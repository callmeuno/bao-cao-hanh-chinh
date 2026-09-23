import Link from 'next/link';

export function IconDashboard() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" />
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" />
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" />
    </svg>
  );
}

export function IconReports() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M8.5 1.5H3.5A1 1 0 002.5 2.5v10a1 1 0 001 1h8a1 1 0 001-1V6L8.5 1.5z" />
      <path d="M8.5 1.5v4.5h4.5" />
      <line x1="5" y1="8.5" x2="10" y2="8.5" />
      <line x1="5" y1="10.5" x2="8" y2="10.5" />
    </svg>
  );
}

export function IconIndicators() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <polyline points="1.5,12 4.5,7.5 7.5,9.5 10.5,4.5 13.5,2.5" />
      <line x1="1.5" y1="13.5" x2="13.5" y2="13.5" />
    </svg>
  );
}

export function IconData() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <ellipse cx="7.5" cy="3.5" rx="5" ry="2" />
      <path d="M2.5 3.5v4c0 1.1 2.24 2 5 2s5-.9 5-2v-4" />
      <path d="M2.5 7.5v4c0 1.1 2.24 2 5 2s5-.9 5-2v-4" />
    </svg>
  );
}

export function IconSummary() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <line x1="2" y1="4" x2="13" y2="4" />
      <line x1="2" y1="7.5" x2="13" y2="7.5" />
      <line x1="2" y1="11" x2="9" y2="11" />
    </svg>
  );
}

export function IconUsers() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="5.5" cy="4.5" r="2.5" />
      <path d="M1 13c0-2.76 2.24-4 4.5-4s4.5 1.24 4.5 4" />
      <path d="M11.5 7.5c1.38 0 2.5 1.12 2.5 2.5v2.5" strokeLinecap="round" />
      <circle cx="11.5" cy="5" r="1.5" />
    </svg>
  );
}

export function IconDepartments() {
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

export function AppSidebarContent({ active = 'dashboard' }: { active?: 'dashboard' | 'reports' | 'indicators' | 'data' | 'summary' }) {
  return (
    <>
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">Hệ thống quản lý báo cáo</div>
        <div className="sidebar-logo-sub">Nền tảng quản lý chuyên ngành</div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Chức năng</div>

        <Link href="/" className={`sidebar-item ${active === 'dashboard' ? 'active' : ''}`}>
          <IconDashboard />
          Tổng quan
        </Link>
        <Link href="/bao-cao/tao" className={`sidebar-item ${active === 'reports' ? 'active' : ''}`}>
          <IconReports />
          Tạo báo cáo
        </Link>
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
  );
}
