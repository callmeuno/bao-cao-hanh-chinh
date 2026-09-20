import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';

type Department = {
  id: string;
  code: string;
  name: string;
};

export default async function KiemTraSupabasePage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('departments')
    .select('id, code, name')
    .order('code', { ascending: true });

  const departments = (data ?? []) as Department[];

  return (
    <main className="min-h-screen">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Kiểm tra kết nối Supabase</h1>
            <p className="text-sm text-gray-500">Đọc bảng public.departments</p>
          </div>
          <Link href="/" className="px-4 py-2 rounded-lg border text-sm">
            Về trang chủ
          </Link>
        </div>
      </header>
      <div className="max-w-7xl mx-auto p-6">
        <section className="card p-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="font-semibold">Danh sách bộ phận</h2>
              <p className="text-sm text-gray-500">
                {error
                  ? 'Không đọc được dữ liệu'
                  : `${departments.length} bộ phận từ database`}
              </p>
            </div>
          </div>
          {error ? (
            <p className="text-sm text-red-600">{error.message}</p>
          ) : departments.length === 0 ? (
            <p className="text-sm text-gray-500">
              Kết nối Supabase thành công. Bảng public.departments không trả về dòng nào
              (bảng trống hoặc chính sách RLS đang ẩn dữ liệu).
            </p>
          ) : (
            <ol className="space-y-3">
              {departments.map((department, index) => (
                <li
                  key={department.id}
                  className="flex justify-between items-center border rounded-xl px-4 py-3"
                >
                  <div>
                    <span className="text-sm text-gray-500 mr-3">{index + 1}.</span>
                    <span className="font-medium">{department.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{department.code}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
