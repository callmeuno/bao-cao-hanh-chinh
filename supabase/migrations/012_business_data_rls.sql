-- ========================================================================================
-- ENABLE ROW LEVEL SECURITY
-- ========================================================================================
ALTER TABLE public.report_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_pests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_agricultural_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_livestock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_animal_diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cultural_activities ENABLE ROW LEVEL SECURITY;

-- ========================================================================================
-- DROP OLD POLICIES FROM MIGRATION 011
-- ========================================================================================
DROP POLICY IF EXISTS "Allow reading report_crops" ON public.report_crops;
DROP POLICY IF EXISTS "Allow reading report_pests" ON public.report_pests;
DROP POLICY IF EXISTS "Allow reading report_agricultural_extensions" ON public.report_agricultural_extensions;
DROP POLICY IF EXISTS "Allow reading report_livestock" ON public.report_livestock;
DROP POLICY IF EXISTS "Allow reading report_farms" ON public.report_farms;
DROP POLICY IF EXISTS "Allow reading report_animal_diseases" ON public.report_animal_diseases;
DROP POLICY IF EXISTS "Allow reading report_vaccines" ON public.report_vaccines;
DROP POLICY IF EXISTS "Allow reading report_cultural_activities" ON public.report_cultural_activities;

-- ========================================================================================
-- NEW RLS POLICIES FOR 8 BUSINESS DATA TABLES
-- ========================================================================================

-- 1. report_crops
CREATE POLICY "report_crops_select_policy" ON public.report_crops
FOR SELECT TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id()
    )
  )
);

CREATE POLICY "report_crops_insert_policy" ON public.report_crops
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

CREATE POLICY "report_crops_update_policy" ON public.report_crops
FOR UPDATE TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

CREATE POLICY "report_crops_delete_policy" ON public.report_crops
FOR DELETE TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

-- 2. report_pests
CREATE POLICY "report_pests_select_policy" ON public.report_pests
FOR SELECT TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id()
    )
  )
);

CREATE POLICY "report_pests_insert_policy" ON public.report_pests
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

CREATE POLICY "report_pests_update_policy" ON public.report_pests
FOR UPDATE TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

CREATE POLICY "report_pests_delete_policy" ON public.report_pests
FOR DELETE TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

-- 3. report_agricultural_extensions
CREATE POLICY "report_agricultural_extensions_select_policy" ON public.report_agricultural_extensions
FOR SELECT TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id()
    )
  )
);

CREATE POLICY "report_agricultural_extensions_insert_policy" ON public.report_agricultural_extensions
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

CREATE POLICY "report_agricultural_extensions_update_policy" ON public.report_agricultural_extensions
FOR UPDATE TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

CREATE POLICY "report_agricultural_extensions_delete_policy" ON public.report_agricultural_extensions
FOR DELETE TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

-- 4. report_livestock
CREATE POLICY "report_livestock_select_policy" ON public.report_livestock
FOR SELECT TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id()
    )
  )
);

CREATE POLICY "report_livestock_insert_policy" ON public.report_livestock
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

CREATE POLICY "report_livestock_update_policy" ON public.report_livestock
FOR UPDATE TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

CREATE POLICY "report_livestock_delete_policy" ON public.report_livestock
FOR DELETE TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

-- 5. report_farms
CREATE POLICY "report_farms_select_policy" ON public.report_farms
FOR SELECT TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id()
    )
  )
);

CREATE POLICY "report_farms_insert_policy" ON public.report_farms
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

CREATE POLICY "report_farms_update_policy" ON public.report_farms
FOR UPDATE TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

CREATE POLICY "report_farms_delete_policy" ON public.report_farms
FOR DELETE TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

-- 6. report_animal_diseases
CREATE POLICY "report_animal_diseases_select_policy" ON public.report_animal_diseases
FOR SELECT TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id()
    )
  )
);

CREATE POLICY "report_animal_diseases_insert_policy" ON public.report_animal_diseases
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

CREATE POLICY "report_animal_diseases_update_policy" ON public.report_animal_diseases
FOR UPDATE TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

CREATE POLICY "report_animal_diseases_delete_policy" ON public.report_animal_diseases
FOR DELETE TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

-- 7. report_vaccines
CREATE POLICY "report_vaccines_select_policy" ON public.report_vaccines
FOR SELECT TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id()
    )
  )
);

CREATE POLICY "report_vaccines_insert_policy" ON public.report_vaccines
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

CREATE POLICY "report_vaccines_update_policy" ON public.report_vaccines
FOR UPDATE TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

CREATE POLICY "report_vaccines_delete_policy" ON public.report_vaccines
FOR DELETE TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

-- 8. report_cultural_activities
CREATE POLICY "report_cultural_activities_select_policy" ON public.report_cultural_activities
FOR SELECT TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id()
    )
  )
);

CREATE POLICY "report_cultural_activities_insert_policy" ON public.report_cultural_activities
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

CREATE POLICY "report_cultural_activities_update_policy" ON public.report_cultural_activities
FOR UPDATE TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);

CREATE POLICY "report_cultural_activities_delete_policy" ON public.report_cultural_activities
FOR DELETE TO authenticated
USING (
  public.is_admin() OR (
    (SELECT public.get_current_user_role()) IN ('staff', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.department_id = public.get_current_user_department_id() AND r.status IN ('draft', 'rejected')
    )
  )
);
