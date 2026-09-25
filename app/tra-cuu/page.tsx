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

export default async function SearchReportsPage() {
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
      topbarTitle="Tra cứu"
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
        <div className="panel-header">
          <div>
            <div className="panel-title">Tra cứu báo cáo</div>
            <div className="panel-subtitle">
              Tìm kiếm và xem các báo cáo đã được lưu trong hệ thống
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            <label>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '6px',
                }}
              >
                Năm
              </div>
              <select className="form-input" defaultValue="">
                <option value="">Tất cả các năm</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </label>

            <label>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '6px',
                }}
              >
                Loại báo cáo
              </div>
              <select className="form-input" defaultValue="">
                <option value="">Tất cả loại báo cáo</option>
                <option value="periodic">Định kỳ</option>
                <option value="ad_hoc">Đột xuất</option>
              </select>
            </label>

            {profile.role === 'admin' ? (
              <label>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                >
                  Phòng ban
                </div>
                <select className="form-input" defaultValue="">
                  <option value="">Tất cả phòng ban</option>
                </select>
              </label>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="alert-error" style={{ margin: '16px' }}>
            <strong>Lỗi tải dữ liệu:</strong> {error.message}
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
                  <th></th>
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
                        <span className="badge badge-gray">
                          Bản nháp
                        </span>
                      </td>

                      <td>{formatDate(report.created_at)}</td>

                      <td>
                        <Link
                          href={`/bao-cao/${report.id}`}
                          style={{
                            color: 'var(--color-primary)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Xem
                        </Link>
                      </td>
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
            <div style={{ fontSize: '30px', marginBottom: '12px' }}>🔎</div>

            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              Chưa có dữ liệu
            </div>

            <div style={{ fontSize: '13px' }}>
              Chưa có báo cáo phù hợp để hiển thị.
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}