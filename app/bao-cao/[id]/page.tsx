import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentProfile } from '../../../lib/auth';
import { createClient } from '../../../lib/supabase/server';
import { logout } from '../../login/actions';
import { AppShell } from '../../components/AppShell';
import { AppSidebarContent } from '../../components/AppSidebarContent';
import {
  ReportDataEntryForm,
  type ReportDetail,
  type IndicatorItem,
  type ExistingReportValue,
} from './ReportDataEntryForm';

export const dynamic = 'force-dynamic';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  manager: 'Lãnh đạo phòng',
  staff: 'Cán bộ',
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ReportDataEntryPage({ params }: Props) {
  const { id } = await params;

  // 1. Kiểm tra xác thực và quyền truy cập
  const profileResult = await getCurrentProfile();

  if (profileResult.status === 'unauthenticated') {
    redirect('/login');
  }

  if (profileResult.status === 'unauthorized') {
    redirect('/unauthorized');
  }

  const profile = profileResult.profile;
  const roleLabel = ROLE_LABELS[profile.role] || 'Người dùng';
  const departmentName = profile.department?.name || (profile.role === 'admin' ? 'Toàn cơ quan' : '');
  const userDisplayName = profile.full_name || 'Người dùng';

  // 2. Truy vấn báo cáo từ Supabase
  const supabase = await createClient();

  const { data: rawReport, error: reportErr } = await supabase
    .from('reports')
    .select(`
      id,
      title,
      year,
      report_type,
      period_start,
      period_end,
      status,
      department_id,
      submitted_by,
      created_at,
      departments (
        id,
        code,
        name
      )
    `)
    .eq('id', id)
    .maybeSingle();

  // Nếu không tìm thấy báo cáo hoặc có lỗi (bao gồm RLS từ chối truy cập)
  if (reportErr || !rawReport) {
    return (
      <AppShell
        sidebar={<AppSidebarContent active="reports" />}
        topbarTitle="Nhập dữ liệu báo cáo"
        topbarUser={
          <>
            <div>
              <div className="topbar-user-name">{userDisplayName}</div>
              <div className="topbar-user-meta">
                {roleLabel}{departmentName ? ` · ${departmentName}` : ''}
              </div>
            </div>
            <div className="topbar-avatar" aria-hidden="true">
              {userDisplayName.charAt(0).toUpperCase()}
            </div>
            <form action={logout}>
              <button type="submit" className="btn-logout">
                Đăng xuất
              </button>
            </form>
          </>
        }
      >
        <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }} className="panel">
          <div style={{ padding: '36px 24px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Không tìm thấy báo cáo
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {reportErr
                ? `Lỗi truy xuất dữ liệu: ${reportErr.message}`
                : 'Báo cáo không tồn tại hoặc bạn không có quyền truy cập vào báo cáo này theo quy định phân quyền.'}
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 18px',
                borderRadius: '6px',
                background: 'var(--color-primary)',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              &larr; Về trang tổng quan
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // Chuẩn hóa cấu trúc department
  const deptRaw = rawReport.departments as unknown;
  let deptInfo: { id: string; code: string; name: string } | null = null;
  if (deptRaw && typeof deptRaw === 'object') {
    if (Array.isArray(deptRaw)) {
      deptInfo = (deptRaw[0] as { id: string; code: string; name: string }) ?? null;
    } else {
      deptInfo = deptRaw as { id: string; code: string; name: string };
    }
  }

  const report: ReportDetail = {
    id: rawReport.id,
    title: rawReport.title,
    year: rawReport.year,
    report_type: rawReport.report_type,
    period_start: rawReport.period_start,
    period_end: rawReport.period_end,
    status: rawReport.status,
    department_id: rawReport.department_id,
    submitted_by: rawReport.submitted_by,
    created_at: rawReport.created_at,
    departments: deptInfo,
  };

  // 3. Truy vấn danh sách chỉ tiêu theo phòng ban của báo cáo
  const { data: rawIndicators, error: indErr } = await supabase
    .from('indicators')
    .select(`
      id,
      code,
      name,
      unit,
      data_type,
      description,
      indicator_groups!inner (
        department_id,
        name
      )
    `)
    .eq('indicator_groups.department_id', report.department_id)
    .eq('is_active', true)
    .order('code', { ascending: true });

  const indicators: IndicatorItem[] = (rawIndicators || []).map((ind) => ({
    id: ind.id,
    code: ind.code,
    name: ind.name,
    unit: ind.unit,
    data_type: ind.data_type,
    description: ind.description,
  }));

  // 4. Truy vấn số liệu đã nhập của báo cáo
  const { data: rawValues } = await supabase
    .from('report_values')
    .select('id, indicator_id, value_numeric, value_text, note')
    .eq('report_id', report.id);

  const initialValues: ExistingReportValue[] = (rawValues || []).map((v) => ({
    id: v.id,
    indicator_id: v.indicator_id,
    value_numeric: v.value_numeric,
    value_text: v.value_text,
    note: v.note,
  }));

  return (
    <AppShell
      sidebar={<AppSidebarContent active="reports" />}
      topbarTitle="Nhập dữ liệu báo cáo"
      topbarUser={
        <>
          <div>
            <div className="topbar-user-name">{userDisplayName}</div>
            <div className="topbar-user-meta">
              {roleLabel}{departmentName ? ` · ${departmentName}` : ''}
            </div>
          </div>
          <div className="topbar-avatar" aria-hidden="true">
            {userDisplayName.charAt(0).toUpperCase()}
          </div>
          <form action={logout}>
            <button type="submit" className="btn-logout">
              Đăng xuất
            </button>
          </form>
        </>
      }
    >
      {indErr ? (
        <div className="alert-error" style={{ marginBottom: '16px' }}>
          <strong>Lỗi tải danh mục chỉ tiêu:</strong> {indErr.message}
        </div>
      ) : null}

      <ReportDataEntryForm
        report={report}
        indicators={indicators}
        initialValues={initialValues}
      />
    </AppShell>
  );
}
