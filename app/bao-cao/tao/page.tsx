import { redirect } from 'next/navigation';
import { getCurrentProfile } from '../../../lib/auth';
import { createClient } from '../../../lib/supabase/server';
import { logout } from '../../login/actions';
import { AppShell } from '../../components/AppShell';
import { AppSidebarContent } from '../../components/AppSidebarContent';
import { CreateReportForm } from './CreateReportForm';
import type { DepartmentInfo } from '../../../types/auth';

export const dynamic = 'force-dynamic';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  manager: 'Lãnh đạo phòng',
  staff: 'Cán bộ',
};

export default async function CreateReportPage() {
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

  // Nếu là admin, lấy danh sách tất cả các phòng ban đang hoạt động để admin lựa chọn
  let departments: DepartmentInfo[] = [];
  if (profile.role === 'admin') {
    const supabase = await createClient();
    const { data } = await supabase
      .from('departments')
      .select('id, code, name')
      .eq('is_active', true)
      .order('code', { ascending: true });

    if (data) {
      departments = data as DepartmentInfo[];
    }
  }

  return (
    <AppShell
      sidebar={<AppSidebarContent active="reports" />}
      topbarTitle="Khởi tạo báo cáo"
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
      <CreateReportForm profile={profile} departments={departments} />
    </AppShell>
  );
}
