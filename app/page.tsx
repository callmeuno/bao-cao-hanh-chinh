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

  const [indicatorsRes, reportsRes] = await Promise.all([
    // Đếm số lượng chỉ tiêu đang hoạt động (kỳ vọng: 97)
    supabase
      .from('indicators')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),

    // Thống kê báo cáo trong năm 2026 trong phạm vi RLS của user
    supabase
      .from('reports')
      .select('id', { count: 'exact' })
      .eq('year', 2026),
  ]);

  // Kiểm tra lỗi truy vấn
  const queryError = indicatorsRes.error || reportsRes.error;

  const totalIndicators = indicatorsRes.count ?? 0;
  const totalReports2026 = reportsRes.count ?? (reportsRes.data ?? []).length;

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
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="stat-card stat-card-accent">
          <div className="stat-card-label">Báo cáo năm 2026</div>
          <div className="stat-card-value">{totalReports2026}</div>
          <div className="stat-card-sub">Năm 2026</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Chỉ tiêu</div>
          <div className="stat-card-value">{totalIndicators}</div>
          <div className="stat-card-sub">Đang áp dụng</div>
        </div>
      </div>

      {/* Content grid: Công việc chính + AI trợ lý */}
      <div className="content-grid">
        {/* Panel Công việc chính */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Công việc chính</div>
            <div className="panel-subtitle">Chức năng quản lý và xử lý báo cáo</div>
          </div>
          <div
            style={{
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '12px',
            }}
          >
            <Link
              href="/bao-cao/tao"
              style={{
                display: 'block',
                textDecoration: 'none',
                padding: '14px 16px',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: '#ffffff',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              className="hover:border-blue-400 hover:shadow-sm"
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="quick-action-icon">
                    <IconReports />
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                    Tạo báo cáo
                  </span>
                </div>
                <span className="badge badge-blue">Tạo mới &rarr;</span>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Tạo báo cáo theo mẫu được cấu hình
              </div>
            </Link>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: '#fafbfc',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="quick-action-icon">
                    <IconData />
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                    Nhập dữ liệu
                  </span>
                </div>
                <span className="badge badge-gray">Chưa khả dụng</span>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Nhập và cập nhật số liệu báo cáo
              </div>
            </div>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: '#fafbfc',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="quick-action-icon">
                    <IconSummary />
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                    Tra cứu & so sánh
                  </span>
                </div>
                <span className="badge badge-gray">Chưa khả dụng</span>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Tìm kiếm, tra cứu và so sánh số liệu
              </div>
            </div>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: '#fafbfc',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="quick-action-icon">
                    <IconIndicators />
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                    Kho báo cáo
                  </span>
                </div>
                <span className="badge badge-gray">Chưa khả dụng</span>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Lưu trữ và quản lý các báo cáo đã tạo
              </div>
            </div>
          </div>
        </div>

        {/* Panel AI trợ lý */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">AI trợ lý</div>
            <div className="panel-subtitle">Hỗ trợ thông minh</div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
              <span className="quick-action-icon" style={{ fontSize: '16px' }}>💬</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  AI trợ lý
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.45 }}>
                  Tra cứu dữ liệu, hỗ trợ tổng hợp và soạn thảo báo cáo
                </div>
              </div>
            </div>
            <span className="badge badge-gray">Chưa kích hoạt</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
