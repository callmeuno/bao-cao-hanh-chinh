import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentProfile } from '../../lib/auth';
import { createClient } from '../../lib/supabase/server';
import { logout } from '../login/actions';
import { AppShell } from '../components/AppShell';
import { AppSidebarContent } from '../components/AppSidebarContent';

export const dynamic = 'force-dynamic';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  manager: 'Lãnh đạo phòng',
  staff: 'Cán bộ',
};

function formatDate(value: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('vi-VN').format(date);
}

function formatPeriod(
  periodStart: string | null,
  periodEnd: string | null,
  year: number | null,
) {
  if (!periodStart || !periodEnd) {
    return year ? `Năm ${year}` : '—';
  }

  const start = new Date(`${periodStart}T00:00:00`);
  const end = new Date(`${periodEnd}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return year ? `Năm ${year}` : '—';
  }

  const startText = new Intl.DateTimeFormat('vi-VN').format(start);
  const endText = new Intl.DateTimeFormat('vi-VN').format(end);

  if (periodStart === periodEnd) {
    return startText;
  }

  return `${startText} – ${endText}`;
}

export default async function ReportsPage() {
  const profileResult = await getCurrentProfile();

  if (profileResult.status === 'unauthenticated') {
    redirect('/login');
  }

  if (profileResult.status === 'unauthorized') {
    redirect('/unauthorized');
  }

  const profile = profileResult.profile;
  const roleLabel = ROLE_LABELS[profile.role] || 'Người dùng';
  const departmentName =
    profile.department?.name || (profile.role === 'admin' ? 'Toàn cơ quan' : '');
  const userDisplayName = profile.full_name || 'Người dùng';

  const supabase = await createClient();

  const { data: reports, error } = await supabase
    .from('reports')
    .select(`
      id,
      title,
      year,
      report_type,
      period_start,
      period_end,
      status,
      created_at,
      departments (
        code,
        name
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <AppShell
      sidebar={<AppSidebarContent active="reports" />}
      topbarTitle="Báo cáo"
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
      <div className="panel">
        <div
          className="panel-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div className="panel-title">Danh sách báo cáo</div>
            <div className="panel-subtitle">
              Tra cứu và quản lý các báo cáo đã tạo
            </div>
          </div>

          <Link
            href="/bao-cao/tao"
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            + Tạo báo cáo
          </Link>
        </div>

        {error ? (
          <div className="alert-error" style={{ margin: '16px' }}>
            <strong>Lỗi tải danh sách báo cáo:</strong> {error.message}
          </div>
        ) : reports && reports.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Báo cáo</th>
                  <th>Kỳ báo cáo</th>
                  <th>Phòng ban</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const department = Array.isArray(report.departments)
                    ? report.departments[0]
                    : report.departments;

                  return (
                    <tr key={report.id}>
                      <td>
                        <Link
                          href={`/bao-cao/${report.id}`}
                          style={{
                            color: 'var(--color-primary)',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          {report.title}
                        </Link>
                      </td>
                      <td>
                        {formatPeriod(
                          report.period_start,
                          report.period_end,
                          report.year,
                        )}
                      </td>
                      <td>
                        {department?.name || department?.code || '—'}
                      </td>
                      <td>
                        <span className="badge badge-gray">Bản nháp</span>
                      </td>
                      <td>{formatDate(report.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ fontSize: '30px', marginBottom: '12px' }}>📄</div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              Chưa có báo cáo
            </div>
            <div style={{ fontSize: '13px', marginBottom: '18px' }}>
              Hãy tạo báo cáo đầu tiên để bắt đầu nhập dữ liệu.
            </div>
            <Link
              href="/bao-cao/tao"
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              + Tạo báo cáo
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
