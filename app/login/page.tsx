'use client';

import { useActionState } from 'react';
import { login, type ActionState } from './actions';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(login, null);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Đăng nhập</h1>
            <p className="text-sm text-slate-500 mt-1">Hệ thống quản lý báo cáo chuyên ngành</p>
          </div>

          {state?.error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@agency.gov.vn"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
