-- ============================================================
-- Migration 009: Remove Report Approval Workflow
-- ============================================================
-- New workflow:
--   draft -> edit/save/report generation
--
-- No submitted / approved / rejected workflow.
-- Existing migrations 007/008 are intentionally left unchanged.
-- This migration overrides their database behavior safely.
-- ============================================================


-- ------------------------------------------------------------
-- 1. REMOVE OLD REPORT WORKFLOW TRIGGER
-- ------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_enforce_report_workflow
ON public.reports;

DROP FUNCTION IF EXISTS public.enforce_report_workflow();


-- ------------------------------------------------------------
-- 2. REPORT STATUS: DRAFT ONLY
-- ------------------------------------------------------------

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_status_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_status_check
  CHECK (status = 'draft');

ALTER TABLE public.reports
  ALTER COLUMN status SET DEFAULT 'draft';


-- ------------------------------------------------------------
-- 3. REPORTS RLS
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
      AND status = 'draft'
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
        (SELECT public.is_manager())
        OR submitted_by = (SELECT auth.uid())
      )
      AND status = 'draft'
    )
  );


-- ------------------------------------------------------------
-- 4. REPORT VALUES RLS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "report_values_select_policy"
  ON public.report_values;
DROP POLICY IF EXISTS "report_values_insert_policy"
  ON public.report_values;
DROP POLICY IF EXISTS "report_values_update_policy"
  ON public.report_values;
DROP POLICY IF EXISTS "report_values_delete_policy"
  ON public.report_values;

CREATE POLICY "report_values_select_policy"
  ON public.report_values FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reports r
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
      SELECT 1
      FROM public.reports r
      WHERE r.id = report_values.report_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status = 'draft'
          )
        )
    )
  );

CREATE POLICY "report_values_update_policy"
  ON public.report_values FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reports r
      WHERE r.id = report_values.report_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status = 'draft'
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.reports r
      WHERE r.id = report_values.report_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status = 'draft'
          )
        )
    )
  );

CREATE POLICY "report_values_delete_policy"
  ON public.report_values FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reports r
      WHERE r.id = report_values.report_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status = 'draft'
          )
        )
    )
  );


-- ------------------------------------------------------------
-- 5. REPORT FILES RLS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "report_files_select_policy"
  ON public.report_files;
DROP POLICY IF EXISTS "report_files_insert_policy"
  ON public.report_files;
DROP POLICY IF EXISTS "report_files_update_policy"
  ON public.report_files;
DROP POLICY IF EXISTS "report_files_delete_policy"
  ON public.report_files;

CREATE POLICY "report_files_select_policy"
  ON public.report_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reports r
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
      SELECT 1
      FROM public.reports r
      WHERE r.id = report_files.report_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status = 'draft'
          )
        )
    )
  );

CREATE POLICY "report_files_update_policy"
  ON public.report_files FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reports r
      WHERE r.id = report_files.report_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status = 'draft'
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.reports r
      WHERE r.id = report_files.report_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status = 'draft'
          )
        )
    )
  );

CREATE POLICY "report_files_delete_policy"
  ON public.report_files FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reports r
      WHERE r.id = report_files.report_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status = 'draft'
          )
        )
    )
  );


-- ------------------------------------------------------------
-- 6. REPORT VALUE DETAILS RLS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "report_value_details_select_policy"
  ON public.report_value_details;
DROP POLICY IF EXISTS "report_value_details_insert_policy"
  ON public.report_value_details;
DROP POLICY IF EXISTS "report_value_details_update_policy"
  ON public.report_value_details;
DROP POLICY IF EXISTS "report_value_details_delete_policy"
  ON public.report_value_details;

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
            AND r.status = 'draft'
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
            AND r.status = 'draft'
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
            AND r.status = 'draft'
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
            AND r.status = 'draft'
          )
        )
    )
  );


-- ------------------------------------------------------------
-- 7. REPORT VALUE DETAIL DIMENSIONS RLS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "report_value_detail_dimensions_select_policy"
  ON public.report_value_detail_dimensions;
DROP POLICY IF EXISTS "report_value_detail_dimensions_insert_policy"
  ON public.report_value_detail_dimensions;
DROP POLICY IF EXISTS "report_value_detail_dimensions_update_policy"
  ON public.report_value_detail_dimensions;
DROP POLICY IF EXISTS "report_value_detail_dimensions_delete_policy"
  ON public.report_value_detail_dimensions;

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
            AND r.status = 'draft'
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
      WHERE rvd.id = public.report_value_detail_dimensions.detail_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status = 'draft'
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
      WHERE rvd.id = public.report_value_detail_dimensions.detail_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status = 'draft'
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
      WHERE rvd.id = public.report_value_detail_dimensions.detail_id
        AND (
          (SELECT public.is_admin())
          OR (
            r.department_id = (SELECT public.get_current_user_department_id())
            AND (SELECT public.get_current_user_role()) IN ('staff', 'manager')
            AND r.status = 'draft'
          )
        )
    )
  );


-- ------------------------------------------------------------
-- 8. STORAGE RLS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "reports_storage_select"
  ON storage.objects;
DROP POLICY IF EXISTS "reports_storage_insert"
  ON storage.objects;
DROP POLICY IF EXISTS "reports_storage_update"
  ON storage.objects;
DROP POLICY IF EXISTS "reports_storage_delete"
  ON storage.objects;

CREATE POLICY "reports_storage_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'reports'
    AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.reports r
            WHERE r.id::text = (storage.foldername(name))[3]
              AND r.department_id = public.get_current_user_department_id()
        )
    )
);

CREATE POLICY "reports_storage_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'reports'
    AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.reports r
            WHERE r.id::text = (storage.foldername(name))[3]
              AND r.department_id = public.get_current_user_department_id()
              AND r.status = 'draft'
        )
    )
);

CREATE POLICY "reports_storage_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'reports'
    AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.reports r
            WHERE r.id::text = (storage.foldername(name))[3]
              AND r.department_id = public.get_current_user_department_id()
              AND r.status = 'draft'
        )
    )
)
WITH CHECK (
    bucket_id = 'reports'
    AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.reports r
            WHERE r.id::text = (storage.foldername(name))[3]
              AND r.department_id = public.get_current_user_department_id()
              AND r.status = 'draft'
        )
    )
);

CREATE POLICY "reports_storage_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'reports'
    AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.reports r
            WHERE r.id::text = (storage.foldername(name))[3]
              AND r.department_id = public.get_current_user_department_id()
              AND r.status = 'draft'
        )
    )
);
