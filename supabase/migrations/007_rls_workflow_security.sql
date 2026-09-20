-- ============================================================
-- Migration 007: Row Level Security, Workflow & Data Protection
-- ============================================================

-- ------------------------------------------------------------
-- 1. PRE-CHECK DATA SAFETY & REPORTS STATUS CONSTRAINT
-- ------------------------------------------------------------
DO $$
DECLARE
  v_invalid_count integer;
BEGIN
  SELECT count(*)
  INTO v_invalid_count
  FROM public.reports
  WHERE status IS NULL
     OR status NOT IN ('draft', 'submitted', 'approved', 'rejected');

  IF v_invalid_count > 0 THEN
    RAISE EXCEPTION 'Migration 007 aborted: Found % report(s) with NULL or invalid status. Expected values: draft, submitted, approved, rejected.', v_invalid_count;
  END IF;
END $$;

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_status_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_status_check
  CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));


-- ------------------------------------------------------------
-- 2. SECURITY HELPER FUNCTIONS
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = (SELECT auth.uid())
    AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_department_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT department_id
  FROM public.profiles
  WHERE id = (SELECT auth.uid())
    AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((public.get_current_user_role() = 'admin'), false);
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((public.get_current_user_role() = 'manager'), false);
$$;

REVOKE ALL ON FUNCTION public.get_current_user_role() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

REVOKE ALL ON FUNCTION public.get_current_user_department_id() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_department_id() TO authenticated;

REVOKE ALL ON FUNCTION public.is_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE ALL ON FUNCTION public.is_manager() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated;


-- ------------------------------------------------------------
-- 3. PROFILE COLUMN PROTECTION TRIGGER
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_profile_protection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;

  IF NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Chỉ Quản trị viên mới có quyền thay đổi role.';
    END IF;

    IF NEW.department_id IS DISTINCT FROM OLD.department_id THEN
      RAISE EXCEPTION 'Chỉ Quản trị viên mới có quyền thay đổi department_id.';
    END IF;

    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Chỉ Quản trị viên mới có quyền thay đổi is_active.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_protection ON public.profiles;

CREATE TRIGGER trg_enforce_profile_protection
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_protection();


-- ------------------------------------------------------------
-- 4. REPORT WORKFLOW & IMMUTABILITY TRIGGER
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_report_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
    NEW.updated_at := now();

    IF NOT public.is_admin() THEN
      NEW.submitted_at := NULL;
    END IF;

    RETURN NEW;
  END IF;

  -- TG_OP = 'UPDATE'
  NEW.updated_at := now();
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;

  -- Admin can perform administrative overrides
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Immutable columns for non-Admin
  IF NEW.submitted_by IS DISTINCT FROM OLD.submitted_by THEN
    RAISE EXCEPTION 'Người tạo báo cáo (submitted_by) là bất biến và không được phép thay đổi.';
  END IF;

  IF NEW.department_id IS DISTINCT FROM OLD.department_id THEN
    RAISE EXCEPTION 'Phòng ban của báo cáo (department_id) là bất biến và không được phép thay đổi.';
  END IF;

  -- Approved reports are frozen for non-Admin
  IF OLD.status = 'approved' THEN
    RAISE EXCEPTION 'Báo cáo đã được phê duyệt. Chỉ Quản trị viên mới có quyền mở khóa hoặc chỉnh sửa.';
  END IF;

  -- Submitted reports can only be reviewed by Department Manager
  IF OLD.status = 'submitted' THEN
    IF NOT (public.is_manager() AND OLD.department_id = public.get_current_user_department_id()) THEN
      RAISE EXCEPTION 'Chỉ Lãnh đạo phòng ban mới có quyền xử lý báo cáo đang chờ duyệt.';
    END IF;

    IF NEW.status NOT IN ('approved', 'rejected') THEN
      RAISE EXCEPTION 'Báo cáo đang chờ duyệt chỉ có thể chuyển sang approved hoặc rejected.';
    END IF;

    IF NEW.title IS DISTINCT FROM OLD.title
       OR NEW.period_start IS DISTINCT FROM OLD.period_start
       OR NEW.period_end IS DISTINCT FROM OLD.period_end
       OR NEW.year IS DISTINCT FROM OLD.year
       OR NEW.report_type IS DISTINCT FROM OLD.report_type THEN
      RAISE EXCEPTION 'Báo cáo đang chờ duyệt không được phép chỉnh sửa nội dung. Vui lòng phê duyệt hoặc từ chối trả về.';
    END IF;
  END IF;

  -- Workflow state transition enforcement
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF OLD.status = 'draft' AND NEW.status = 'submitted' THEN
      NEW.submitted_at := now();
    ELSIF OLD.status = 'submitted' AND NEW.status IN ('approved', 'rejected') THEN
      -- Valid review transitions handled above
      NULL;
    ELSIF OLD.status = 'rejected' AND NEW.status = 'draft' THEN
      -- Reopen rejected report for editing
      NULL;
    ELSE
      RAISE EXCEPTION 'Chuyển đổi trạng thái từ % sang % không hợp lệ.', OLD.status, NEW.status;
    END IF;
  END IF;

  -- Prevent manual submitted_at changes outside draft -> submitted transition
  IF NOT (OLD.status = 'draft' AND NEW.status = 'submitted') THEN
    IF NEW.submitted_at IS DISTINCT FROM OLD.submitted_at THEN
      RAISE EXCEPTION 'Thời gian nộp báo cáo (submitted_at) do hệ thống quản lý và không được phép tự ý chỉnh sửa.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_report_workflow ON public.reports;

CREATE TRIGGER trg_enforce_report_workflow
  BEFORE INSERT OR UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_report_workflow();


-- ------------------------------------------------------------
-- 5. RLS: SHARED MASTER CATALOGS (7 TABLES)
-- ------------------------------------------------------------
-- 5.1 departments
DROP POLICY IF EXISTS "Allow reading departments" ON public.departments;
DROP POLICY IF EXISTS "departments_select_authenticated" ON public.departments;
DROP POLICY IF EXISTS "departments_admin_all" ON public.departments;

CREATE POLICY "departments_select_authenticated"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "departments_admin_all"
  ON public.departments FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5.2 locations
DROP POLICY IF EXISTS "locations_select_authenticated" ON public.locations;
DROP POLICY IF EXISTS "locations_admin_all" ON public.locations;

CREATE POLICY "locations_select_authenticated"
  ON public.locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "locations_admin_all"
  ON public.locations FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5.3 dimension_types
DROP POLICY IF EXISTS "dimension_types_select_authenticated" ON public.dimension_types;
DROP POLICY IF EXISTS "dimension_types_admin_all" ON public.dimension_types;

CREATE POLICY "dimension_types_select_authenticated"
  ON public.dimension_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "dimension_types_admin_all"
  ON public.dimension_types FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5.4 dimension_items
DROP POLICY IF EXISTS "dimension_items_select_authenticated" ON public.dimension_items;
DROP POLICY IF EXISTS "dimension_items_admin_all" ON public.dimension_items;

CREATE POLICY "dimension_items_select_authenticated"
  ON public.dimension_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "dimension_items_admin_all"
  ON public.dimension_items FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5.5 indicator_groups
DROP POLICY IF EXISTS "indicator_groups_select_authenticated" ON public.indicator_groups;
DROP POLICY IF EXISTS "indicator_groups_admin_all" ON public.indicator_groups;

CREATE POLICY "indicator_groups_select_authenticated"
  ON public.indicator_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "indicator_groups_admin_all"
  ON public.indicator_groups FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5.6 indicators
DROP POLICY IF EXISTS "indicators_select_authenticated" ON public.indicators;
DROP POLICY IF EXISTS "indicators_admin_all" ON public.indicators;

CREATE POLICY "indicators_select_authenticated"
  ON public.indicators FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "indicators_admin_all"
  ON public.indicators FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5.7 indicator_dimensions
DROP POLICY IF EXISTS "indicator_dimensions_select_authenticated" ON public.indicator_dimensions;
DROP POLICY IF EXISTS "indicator_dimensions_admin_all" ON public.indicator_dimensions;

CREATE POLICY "indicator_dimensions_select_authenticated"
  ON public.indicator_dimensions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "indicator_dimensions_admin_all"
  ON public.indicator_dimensions FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ------------------------------------------------------------
-- 6. RLS: PROFILES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR department_id = (SELECT public.get_current_user_department_id())
    OR (SELECT public.is_admin())
  );

CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
  );

CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
  );


-- ------------------------------------------------------------
-- 7. RLS: FACILITIES & STORES
-- ------------------------------------------------------------
-- 7.1 facilities
DROP POLICY IF EXISTS "facilities_select_policy" ON public.facilities;
DROP POLICY IF EXISTS "facilities_insert_policy" ON public.facilities;
DROP POLICY IF EXISTS "facilities_update_policy" ON public.facilities;
DROP POLICY IF EXISTS "facilities_delete_policy" ON public.facilities;

CREATE POLICY "facilities_select_policy"
  ON public.facilities FOR SELECT
  TO authenticated
  USING (
    (
      department_id = (SELECT public.get_current_user_department_id())
      AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
    )
    OR (SELECT public.is_admin())
  );

CREATE POLICY "facilities_insert_policy"
  ON public.facilities FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      department_id = (SELECT public.get_current_user_department_id())
      AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
    )
    OR (SELECT public.is_admin())
  );

CREATE POLICY "facilities_update_policy"
  ON public.facilities FOR UPDATE
  TO authenticated
  USING (
    (
      department_id = (SELECT public.get_current_user_department_id())
      AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
    )
    OR (SELECT public.is_admin())
  )
  WITH CHECK (
    (
      department_id = (SELECT public.get_current_user_department_id())
      AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
    )
    OR (SELECT public.is_admin())
  );

CREATE POLICY "facilities_delete_policy"
  ON public.facilities FOR DELETE
  TO authenticated
  USING (
    (
      department_id = (SELECT public.get_current_user_department_id())
      AND (SELECT public.is_manager())
    )
    OR (SELECT public.is_admin())
  );

-- 7.2 stores
DROP POLICY IF EXISTS "stores_select_policy" ON public.stores;
DROP POLICY IF EXISTS "stores_insert_policy" ON public.stores;
DROP POLICY IF EXISTS "stores_update_policy" ON public.stores;
DROP POLICY IF EXISTS "stores_delete_policy" ON public.stores;

CREATE POLICY "stores_select_policy"
  ON public.stores FOR SELECT
  TO authenticated
  USING (
    (
      department_id = (SELECT public.get_current_user_department_id())
      AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
    )
    OR (SELECT public.is_admin())
  );

CREATE POLICY "stores_insert_policy"
  ON public.stores FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      department_id = (SELECT public.get_current_user_department_id())
      AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
    )
    OR (SELECT public.is_admin())
  );

CREATE POLICY "stores_update_policy"
  ON public.stores FOR UPDATE
  TO authenticated
  USING (
    (
      department_id = (SELECT public.get_current_user_department_id())
      AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
    )
    OR (SELECT public.is_admin())
  )
  WITH CHECK (
    (
      department_id = (SELECT public.get_current_user_department_id())
      AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
    )
    OR (SELECT public.is_admin())
  );

CREATE POLICY "stores_delete_policy"
  ON public.stores FOR DELETE
  TO authenticated
  USING (
    (
      department_id = (SELECT public.get_current_user_department_id())
      AND (SELECT public.is_manager())
    )
    OR (SELECT public.is_admin())
  );


-- ------------------------------------------------------------
-- 8. RLS: REPORTS
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "reports_select_policy" ON public.reports;
DROP POLICY IF EXISTS "reports_insert_policy" ON public.reports;
DROP POLICY IF EXISTS "reports_update_policy" ON public.reports;
DROP POLICY IF EXISTS "reports_delete_policy" ON public.reports;

CREATE POLICY "reports_select_policy"
  ON public.reports FOR SELECT
  TO authenticated
  USING (
    (
      department_id = (SELECT public.get_current_user_department_id())
      AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
    )
    OR (SELECT public.is_admin())
  );

CREATE POLICY "reports_insert_policy"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      department_id = (SELECT public.get_current_user_department_id())
      AND submitted_by = (SELECT auth.uid())
      AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
      AND status = 'draft'
    )
    OR (SELECT public.is_admin())
  );

CREATE POLICY "reports_update_policy"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (
    (
      department_id = (SELECT public.get_current_user_department_id())
      AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
    )
    OR (SELECT public.is_admin())
  )
  WITH CHECK (
    (
      department_id = (SELECT public.get_current_user_department_id())
      AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
    )
    OR (SELECT public.is_admin())
  );

CREATE POLICY "reports_delete_policy"
  ON public.reports FOR DELETE
  TO authenticated
  USING (
    (SELECT public.is_admin())
    OR (
      department_id = (SELECT public.get_current_user_department_id())
      AND (
        ((SELECT public.is_manager()) AND status IN ('draft', 'rejected'))
        OR (submitted_by = (SELECT auth.uid()) AND status IN ('draft', 'rejected'))
      )
    )
  );


-- ------------------------------------------------------------
-- 9. RLS: REPORT VALUES & REPORT FILES
-- ------------------------------------------------------------
-- 9.1 report_values
DROP POLICY IF EXISTS "report_values_select_policy" ON public.report_values;
DROP POLICY IF EXISTS "report_values_insert_policy" ON public.report_values;
DROP POLICY IF EXISTS "report_values_update_policy" ON public.report_values;
DROP POLICY IF EXISTS "report_values_delete_policy" ON public.report_values;

CREATE POLICY "report_values_select_policy"
  ON public.report_values FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_values.report_id
        AND (
          (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
          )
          OR (SELECT public.is_admin())
        )
    )
  );

CREATE POLICY "report_values_insert_policy"
  ON public.report_values FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_values.report_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status IN ('draft', 'rejected')
          )
        )
    )
  );

CREATE POLICY "report_values_update_policy"
  ON public.report_values FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_values.report_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status IN ('draft', 'rejected')
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_values.report_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status IN ('draft', 'rejected')
          )
        )
    )
  );

CREATE POLICY "report_values_delete_policy"
  ON public.report_values FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_values.report_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status IN ('draft', 'rejected')
          )
        )
    )
  );

-- 9.2 report_files
DROP POLICY IF EXISTS "report_files_select_policy" ON public.report_files;
DROP POLICY IF EXISTS "report_files_insert_policy" ON public.report_files;
DROP POLICY IF EXISTS "report_files_update_policy" ON public.report_files;
DROP POLICY IF EXISTS "report_files_delete_policy" ON public.report_files;

CREATE POLICY "report_files_select_policy"
  ON public.report_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_files.report_id
        AND (
          (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
          )
          OR (SELECT public.is_admin())
        )
    )
  );

CREATE POLICY "report_files_insert_policy"
  ON public.report_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_files.report_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status IN ('draft', 'rejected')
          )
        )
    )
  );

CREATE POLICY "report_files_update_policy"
  ON public.report_files FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_files.report_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status IN ('draft', 'rejected')
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_files.report_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status IN ('draft', 'rejected')
          )
        )
    )
  );

CREATE POLICY "report_files_delete_policy"
  ON public.report_files FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_files.report_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status IN ('draft', 'rejected')
          )
        )
    )
  );


-- ------------------------------------------------------------
-- 10. RLS: REPORT VALUE DETAILS & DETAIL DIMENSIONS
-- ------------------------------------------------------------
-- 10.1 report_value_details
DROP POLICY IF EXISTS "report_value_details_select_policy" ON public.report_value_details;
DROP POLICY IF EXISTS "report_value_details_insert_policy" ON public.report_value_details;
DROP POLICY IF EXISTS "report_value_details_update_policy" ON public.report_value_details;
DROP POLICY IF EXISTS "report_value_details_delete_policy" ON public.report_value_details;

CREATE POLICY "report_value_details_select_policy"
  ON public.report_value_details FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.report_values rv
      JOIN public.reports r ON rv.report_id = r.id
      WHERE rv.id = report_value_details.report_value_id
        AND (
          (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
          )
          OR (SELECT public.is_admin())
        )
    )
  );

CREATE POLICY "report_value_details_insert_policy"
  ON public.report_value_details FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.report_values rv
      JOIN public.reports r ON rv.report_id = r.id
      WHERE rv.id = report_value_details.report_value_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status IN ('draft', 'rejected')
            AND (
              report_value_details.facility_id IS NULL
              OR EXISTS (
                SELECT 1
                FROM public.facilities f
                WHERE f.id = report_value_details.facility_id
                  AND f.department_id = r.department_id
              )
            )
            AND (
              report_value_details.store_id IS NULL
              OR EXISTS (
                SELECT 1
                FROM public.stores s
                WHERE s.id = report_value_details.store_id
                  AND s.department_id = r.department_id
              )
            )
          )
        )
    )
  );

CREATE POLICY "report_value_details_update_policy"
  ON public.report_value_details FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.report_values rv
      JOIN public.reports r ON rv.report_id = r.id
      WHERE rv.id = report_value_details.report_value_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status IN ('draft', 'rejected')
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.report_values rv
      JOIN public.reports r ON rv.report_id = r.id
      WHERE rv.id = report_value_details.report_value_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status IN ('draft', 'rejected')
            AND (
              report_value_details.facility_id IS NULL
              OR EXISTS (
                SELECT 1
                FROM public.facilities f
                WHERE f.id = report_value_details.facility_id
                  AND f.department_id = r.department_id
              )
            )
            AND (
              report_value_details.store_id IS NULL
              OR EXISTS (
                SELECT 1
                FROM public.stores s
                WHERE s.id = report_value_details.store_id
                  AND s.department_id = r.department_id
              )
            )
          )
        )
    )
  );

CREATE POLICY "report_value_details_delete_policy"
  ON public.report_value_details FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.report_values rv
      JOIN public.reports r ON rv.report_id = r.id
      WHERE rv.id = report_value_details.report_value_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status IN ('draft', 'rejected')
          )
        )
    )
  );

-- 10.2 report_value_detail_dimensions
DROP POLICY IF EXISTS "report_value_detail_dimensions_select_policy" ON public.report_value_detail_dimensions;
DROP POLICY IF EXISTS "report_value_detail_dimensions_insert_policy" ON public.report_value_detail_dimensions;
DROP POLICY IF EXISTS "report_value_detail_dimensions_update_policy" ON public.report_value_detail_dimensions;
DROP POLICY IF EXISTS "report_value_detail_dimensions_delete_policy" ON public.report_value_detail_dimensions;

CREATE POLICY "report_value_detail_dimensions_select_policy"
  ON public.report_value_detail_dimensions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.report_value_details rvd
      JOIN public.report_values rv ON rvd.report_value_id = rv.id
      JOIN public.reports r ON rv.report_id = r.id
      WHERE rvd.id = report_value_detail_dimensions.detail_id
        AND (
          (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
          )
          OR (SELECT public.is_admin())
        )
    )
  );

CREATE POLICY "report_value_detail_dimensions_insert_policy"
  ON public.report_value_detail_dimensions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.report_value_details rvd
      JOIN public.report_values rv ON rvd.report_value_id = rv.id
      JOIN public.reports r ON rv.report_id = r.id
      WHERE rvd.id = report_value_detail_dimensions.detail_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status IN ('draft', 'rejected')
          )
        )
    )
  );

CREATE POLICY "report_value_detail_dimensions_update_policy"
  ON public.report_value_detail_dimensions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.report_value_details rvd
      JOIN public.report_values rv ON rvd.report_value_id = rv.id
      JOIN public.reports r ON rv.report_id = r.id
      WHERE rvd.id = report_value_detail_dimensions.detail_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status IN ('draft', 'rejected')
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.report_value_details rvd
      JOIN public.report_values rv ON rvd.report_value_id = rv.id
      JOIN public.reports r ON rv.report_id = r.id
      WHERE rvd.id = report_value_detail_dimensions.detail_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status IN ('draft', 'rejected')
          )
        )
    )
  );

CREATE POLICY "report_value_detail_dimensions_delete_policy"
  ON public.report_value_detail_dimensions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.report_value_details rvd
      JOIN public.report_values rv ON rvd.report_value_id = rv.id
      JOIN public.reports r ON rv.report_id = r.id
      WHERE rvd.id = report_value_detail_dimensions.detail_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status IN ('draft', 'rejected')
          )
        )
    )
  );


-- ------------------------------------------------------------
-- 11. RLS: AUDIT LOGS (ADMIN SELECT ONLY, NO CLIENT WRITES)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;

CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_admin())
  );
