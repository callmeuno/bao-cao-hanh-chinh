import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '../lib/auth';
import { createClient } from '../lib/supabase/server';
import { logout } from './login/actions';
import { AppShell } from './components/AppShell';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  manager: 'Lãnh đạo phòng',
  staff: 'Cán bộ',
};

// ── Inline SVG icon components (no external dependencies) ────────────

function IconDashboard() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" />
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" />
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" />
    </svg>
  );
}

function IconReports() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M8.5 1.5H3.5A1 1 0 002.5 2.5v10a1 1 0 001 1h8a1 1 0 001-1V6L8.5 1.5z" />
      <path d="M8.5 1.5v4.5h4.5" />
      <line x1="5" y1="8.5" x2="10" y2="8.5" />
      <line x1="5" y1="10.5" x2="8" y2="10.5" />
    </svg>
  );
}

function IconIndicators() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <polyline points="1.5,12 4.5,7.5 7.5,9.5 10.5,4.5 13.5,2.5" />
      <line x1="1.5" y1="13.5" x2="13.5" y2="13.5" />
    </svg>
  );
}

function IconData() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <ellipse cx="7.5" cy="3.5" rx="5" ry="2" />
      <path d="M2.5 3.5v4c0 1.1 2.24 2 5 2s5-.9 5-2v-4" />
      <path d="M2.5 7.5v4c0 1.1 2.24 2 5 2s5-.9 5-2v-4" />
    </svg>
  );
}

function IconSummary() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <line x1="2" y1="4" x2="13" y2="4" />
      <line x1="2" y1="7.5" x2="13" y2="7.5" />
      <line x1="2" y1="11" x2="9" y2="11" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="5.5" cy="4.5" r="2.5" />
      <path d="M1 13c0-2.76 2.24-4 4.5-4s4.5 1.24 4.5 4" />
      <path d="M11.5 7.5c1.38 0 2.5 1.12 2.5 2.5v2.5" strokeLinecap="round" />
      <circle cx="11.5" cy="5" r="1.5" />
    </svg>
  );
}

function IconDepartments() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="1.5" y="7" width="4.5" height="6.5" />
      <rect x="9" y="4" width="4.5" height="9.5" />
      <line x1="3.75" y1="7" x2="3.75" y2="2.5" />
      <line x1="3.75" y1="2.5" x2="11.25" y2="2.5" />
      <line x1="11.25" y1="2.5" x2="11.25" y2="4" />
    </svg>
  );
}

export default async function Home() {
  // 1. Xác thực người dùng
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

  // 2. Truy vấn dữ liệu thực tế từ Supabase
  const supabase = await createClient();

  const [indicatorsRes, departmentsRes, reportsRes] = await Promise.all([
    // Đếm số lượng chỉ tiêu đang hoạt động (kỳ vọng: 97)
    supabase
      .from('indicators')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),

    // Lấy 7 phòng ban chuẩn
    supabase
      .from('departments')
      .select('id, code, name')
      .eq('is_active', true)
      .order('code', { ascending: true }),

    // Thống kê báo cáo trong năm 2026 trong phạm vi RLS của user
    supabase
      .from('reports')
      .select('id, department_id, status')
      .eq('year', 2026),
  ]);

  // Kiểm tra lỗi truy vấn
  const queryError = indicatorsRes.error || departmentsRes.error || reportsRes.error;

  const totalIndicators = indicatorsRes.count ?? 0;
  const reports = reportsRes.data ?? [];
  const departmentsList = departmentsRes.data ?? [];

  // Tính toán số liệu báo cáo năm 2026
  const totalReports2026 = reports.length;
  const submittedOrApprovedReports = reports.filter(
    (r) => r.status === 'submitted' || r.status === 'approved'
  ).length;
  const pendingReports = reports.filter((r) => r.status === 'submitted').length;

  const submittedRate =
    totalReports2026 > 0
      ? `${Math.round((submittedOrApprovedReports / totalReports2026) * 100)}%`
      : '0%';

  return (
    <AppShell
      sidebar={
        <>
          <div className="sidebar-logo">
            <div className="sidebar-logo-title">Hệ thống quản lý báo cáo</div>
            <div className="sidebar-logo-sub">Nền tảng quản lý chuyên ngành</div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-section-label">Chức năng</div>

            <Link href="/" className="sidebar-item active">
              <IconDashboard />
              Tổng quan
            </Link>
            <span className="sidebar-item">
              <IconReports />
              Báo cáo
            </span>
            <span className="sidebar-item">
              <IconIndicators />
              Chỉ tiêu
            </span>
            <span className="sidebar-item">
              <IconData />
              Dữ liệu
            </span>
            <span className="sidebar-item">
              <IconSummary />
              Tổng hợp
            </span>

            <div className="sidebar-section-label">Quản trị</div>
            <span className="sidebar-item">
              <IconUsers />
              Người dùng
            </span>
            <span className="sidebar-item">
              <IconDepartments />
              Phòng ban
            </span>
          </nav>
        </>
      }
      topbarTitle="Tổng quan"
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
          {queryError ? (
            <div className="alert-error">
              <strong>Lỗi truy xuất dữ liệu:</strong> {queryError.message}
            </div>
          ) : null}

          {/* Stat cards */}
          <div className="stat-grid">
            <div className="stat-card stat-card-accent">
              <div className="stat-card-label">Báo cáo năm 2026</div>
              <div className="stat-card-value">{totalReports2026}</div>
              <div className="stat-card-sub">Năm 2026</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Đã nộp</div>
              <div className="stat-card-value">{submittedOrApprovedReports}</div>
              <div className="stat-card-sub">{submittedRate} tổng số</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Chờ duyệt</div>
              <div className="stat-card-value">{pendingReports}</div>
              <div className="stat-card-sub">
                {totalReports2026 > 0 ? `${pendingReports} cần xử lý` : 'Không có'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Chỉ tiêu</div>
              <div className="stat-card-value">{totalIndicators}</div>
              <div className="stat-card-sub">Đang áp dụng</div>
            </div>
          </div>

          {/* Content grid: department table + quick actions */}
          <div className="content-grid">
            {/* Department progress table */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Tiến độ nộp báo cáo</div>
                <div className="panel-subtitle">Kỳ báo cáo năm 2026</div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Phòng ban</th>
                    <th style={{ textAlign: 'center' }}>Tổng</th>
                    <th style={{ textAlign: 'center' }}>Đã nộp</th>
                    <th style={{ textAlign: 'center' }}>Chờ duyệt</th>
                    <th style={{ textAlign: 'center' }}>Tiến độ</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentsList.map((dept) => {
                    const deptReports = reports.filter((r) => r.department_id === dept.id);
                    const deptTotal = deptReports.length;
                    const deptSubmitted = deptReports.filter(
                      (r) => r.status === 'submitted' || r.status === 'approved'
                    ).length;
                    const deptPending = deptReports.filter(
                      (r) => r.status === 'submitted'
                    ).length;

                    // Logic tiến độ phòng ban — giữ nguyên từ phiên bản trước:
                    // 0 báo cáo → badge xám "Chưa có"
                    // có báo cáo → (đã nộp / tổng) * 100%
                    // 100% → badge xanh lá; còn lại → badge xanh dương
                    const progressPercent =
                      deptTotal > 0 ? Math.round((deptSubmitted / deptTotal) * 100) : 0;
                    const badgeClass =
                      deptTotal === 0
                        ? 'badge badge-gray'
                        : progressPercent === 100
                        ? 'badge badge-green'
                        : 'badge badge-blue';

                    return (
                      <tr key={dept.id}>
                        <td>{dept.name}</td>
                        <td style={{ textAlign: 'center' }}>
                          {deptTotal > 0 ? deptTotal : '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {deptTotal > 0 ? deptSubmitted : '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {deptTotal > 0 ? deptPending : '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={badgeClass}>
                            {deptTotal > 0 ? `${progressPercent}%` : 'Chưa có'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick actions panel */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Thao tác nhanh</div>
              </div>
              <div className="quick-action-list">
                <button className="quick-action-btn">
                  <span className="quick-action-icon">📤</span>
                  Upload báo cáo
                </button>
                <button className="quick-action-btn">
                  <span className="quick-action-icon">📊</span>
                  So sánh số liệu
                </button>
                <button className="quick-action-btn">
                  <span className="quick-action-icon">📝</span>
                  Tạo báo cáo
                </button>
                <button className="quick-action-btn">
                  <span className="quick-action-icon">💬</span>
                  Chat với dữ liệu
                </button>
              </div>
            </div>
          </div>
    </AppShell>
  );
}
