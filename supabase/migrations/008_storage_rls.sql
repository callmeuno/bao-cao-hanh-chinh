-- Storage RLS for private report files.
-- Path format:
-- <department_id>/<year>/<report_id>/<filename>

DROP POLICY IF EXISTS "reports_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "reports_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "reports_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "reports_storage_delete" ON storage.objects;

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
              AND r.status IN ('draft', 'rejected')
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
              AND r.status IN ('draft', 'rejected')
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
              AND r.status IN ('draft', 'rejected')
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
              AND r.status IN ('draft', 'rejected')
        )
    )
);
