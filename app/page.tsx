import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '../lib/auth';
import { createClient } from '../lib/supabase/server';
import { logout } from './login/actions';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  manager: 'Lãnh đạo phòng',
  staff: 'Cán bộ',
};

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

  const stats = [
    ['Báo cáo năm 2026', totalReports2026.toString(), 'Năm 2026'],
    ['Đã nộp', submittedOrApprovedReports.toString(), submittedRate],
    ['Chờ duyệt', pendingReports.toString(), totalReports2026 > 0 ? `${pendingReports} cần xử lý` : '0'],
    ['Chỉ tiêu', totalIndicators.toString(), 'Đang áp dụng'],
  ];

  return (
    <main className="min-h-screen">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Hệ thống quản lý báo cáo</h1>
            <p className="text-sm text-gray-500">MVP — kiến trúc sẵn sàng mở rộng</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/kiem-tra-supabase"
              className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50 transition-colors"
            >
              Kiểm tra Supabase
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-sm">
              <div className="text-left">
                <div className="font-semibold text-gray-900 leading-tight">{userDisplayName}</div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{roleLabel}</span>
                  {departmentName ? <span> · {departmentName}</span> : null}
                </div>
              </div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {queryError ? (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <p className="font-medium">Lỗi truy xuất dữ liệu từ cơ sở dữ liệu:</p>
            <p className="text-xs mt-1 text-red-600">{queryError.message}</p>
          </div>
        ) : null}

        <section className="grid md:grid-cols-4 gap-4">
          {stats.map(([title, value, subtext]) => (
            <div className="card p-5" key={title}>
              <p className="text-sm text-gray-500">{title}</p>
              <div className="mt-2 flex items-end justify-between">
                <b className="text-3xl">{value}</b>
                <span className="text-sm text-gray-500">{subtext}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="grid lg:grid-cols-3 gap-5 mt-6">
          <div className="card p-5 lg:col-span-2">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="font-semibold">Tiến độ nộp báo cáo</h2>
                <p className="text-sm text-gray-500">Kỳ báo cáo năm 2026</p>
              </div>
              <button className="border px-3 py-2 rounded-lg text-sm">Xem tất cả</button>
            </div>

            <div className="space-y-4">
              {departmentsList.map((dept) => {
                const deptReports = reports.filter((r) => r.department_id === dept.id);
                const deptTotal = deptReports.length;
                const deptSubmitted = deptReports.filter(
                  (r) => r.status === 'submitted' || r.status === 'approved'
                ).length;

                // Logic tiến độ phòng ban:
                // - Khi chưa có báo cáo: progress = 0%, hiển thị '0 báo cáo · Chưa có dữ liệu'
                // - Khi đã có báo cáo: progress = (số báo cáo đã nộp hoặc duyệt / tổng báo cáo của phòng) * 100%
                const progressPercent = deptTotal > 0 ? Math.round((deptSubmitted / deptTotal) * 100) : 0;
                const statusLabel =
                  deptTotal > 0
                    ? `${deptSubmitted}/${deptTotal} đã nộp`
                    : '0 báo cáo · Chưa có dữ liệu';

                return (
                  <div key={dept.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{dept.name}</span>
                      <span className="text-gray-500">{statusLabel}</span>
                    </div>
                    <div className="h-2 rounded bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-gray-800 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold">Thao tác nhanh</h2>
            <div className="grid gap-3 mt-4">
              <button className="text-left border rounded-xl p-4 hover:bg-gray-50">📤 Upload báo cáo</button>
              <button className="text-left border rounded-xl p-4 hover:bg-gray-50">📊 So sánh số liệu</button>
              <button className="text-left border rounded-xl p-4 hover:bg-gray-50">📝 Tạo báo cáo</button>
              <button className="text-left border rounded-xl p-4 hover:bg-gray-50">💬 Chat với dữ liệu</button>
            </div>
          </div>
        </section>

        <section className="card p-5 mt-6">
          <h2 className="font-semibold">Lộ trình triển khai</h2>
          <div className="grid md:grid-cols-6 gap-3 mt-4">
            {['Auth + phân quyền', 'Upload + Storage', 'Trích xuất dữ liệu', 'Dashboard', 'Word/PDF', 'Chat AI'].map(
              (stage, index) => (
                <div className="border rounded-xl p-4" key={stage}>
                  <div className="text-xs text-gray-500">Giai đoạn {index + 1}</div>
                  <div className="font-medium mt-2">{stage}</div>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

