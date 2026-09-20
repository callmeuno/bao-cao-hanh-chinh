import { redirect } from 'next/navigation';
import { getCurrentUser, getCurrentProfile } from '../../lib/auth';
import { logout } from '../login/actions';

export const dynamic = 'force-dynamic';

export default async function UnauthorizedPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const profileResult = await getCurrentProfile();

  if (profileResult.status === 'authenticated') {
    redirect('/');
  }

  const isInactive = profileResult.status === 'unauthorized' && profileResult.reason === 'inactive';

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            !
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-2">
            {isInactive ? 'Tài khoản đang bị tạm khóa' : 'Chưa được phân quyền'}
          </h1>

          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            {isInactive
              ? 'Hồ sơ của bạn đang ở trạng thái vô hiệu hóa. Vui lòng liên hệ Quản trị viên để được mở khóa tài khoản.'
              : 'Tài khoản của bạn đã được xác thực qua hệ thống nhưng chưa được Quản trị viên gán phòng ban hoặc cấp vai trò nghiệp vụ.'}
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 text-xs text-slate-500 font-mono">
            Email: {user.email ?? user.id}
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-all"
            >
              Đăng xuất
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
