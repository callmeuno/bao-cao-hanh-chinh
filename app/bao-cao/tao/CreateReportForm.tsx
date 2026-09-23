'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createReportAction } from '../actions';
import type { UserProfile, DepartmentInfo } from '../../../types/auth';

type Props = {
  profile: UserProfile;
  departments: DepartmentInfo[];
};

export function CreateReportForm({ profile, departments }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [year, setYear] = useState<number>(2026);
  const [period, setPeriod] = useState<string>('year');
  const [departmentId, setDepartmentId] = useState<string>(() => {
    if (profile.role === 'admin') {
      if (profile.department_id && departments.some((d) => d.id === profile.department_id)) {
        return profile.department_id;
      }
      return departments.length > 0 ? departments[0].id : '';
    }
    return profile.department_id || '';
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateExistingId, setDuplicateExistingId] = useState<string | null>(null);

  const isAdmin = profile.role === 'admin';
  // Admin luôn được chọn phòng ban từ danh sách active; staff/manager cố định theo tài khoản
  const hasFixedDepartment = !isAdmin;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setDuplicateExistingId(null);

    const targetDeptId = isAdmin ? departmentId : profile.department_id;
    if (!targetDeptId) {
      setErrorMessage(
        isAdmin
          ? 'Vui lòng chọn phòng ban lập báo cáo.'
          : 'Tài khoản chưa được gán phòng ban trực thuộc.'
      );
      return;
    }

    startTransition(async () => {
      const res = await createReportAction({
        year,
        period,
        departmentId: targetDeptId,
      });

      if (!res.success) {
        setErrorMessage(res.error);
        if (res.duplicate && res.existingId) {
          setDuplicateExistingId(res.existingId);
        }
        return;
      }

      router.push(`/bao-cao/${res.reportId}`);
    });
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Khởi tạo báo cáo mới</div>
          <div className="panel-subtitle">
            Thiết lập thông tin kỳ báo cáo và đơn vị thực hiện để bắt đầu nhập liệu
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px 20px' }}>
          {errorMessage && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: duplicateExistingId ? '#fffbeb' : '#fef2f2',
                border: `1px solid ${duplicateExistingId ? '#fef3c7' : '#fecaca'}`,
                color: duplicateExistingId ? '#92400e' : '#dc2626',
                fontSize: '13.5px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{duplicateExistingId ? '⚠️' : '❌'}</span>
                  <span>{errorMessage}</span>
                </div>
                {duplicateExistingId && (
                  <Link
                    href={`/bao-cao/${duplicateExistingId}`}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      background: '#d97706',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '12.5px',
                      fontWeight: 600,
                    }}
                  >
                    Xem báo cáo này &rarr;
                  </Link>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Năm báo cáo */}
            <div>
              <label
                htmlFor="year"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Năm báo cáo <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                id="year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                disabled={isPending}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--card-border)',
                  background: '#ffffff',
                  fontSize: '13.5px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              >
                <option value={2026}>2026 (Năm hiện tại)</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            {/* Kỳ báo cáo */}
            <div>
              <label
                htmlFor="period"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Kỳ báo cáo <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                disabled={isPending}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--card-border)',
                  background: '#ffffff',
                  fontSize: '13.5px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              >
                <option value="year">Cả năm (01/01 - 31/12)</option>
              </select>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Hệ thống kiến trúc sẵn sàng cho kỳ Quý / Tháng / 6 Tháng ở giai đoạn tiếp theo.
              </div>
            </div>

            {/* Phòng ban / Đơn vị lập */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Đơn vị lập báo cáo <span style={{ color: '#dc2626' }}>*</span>
              </label>

              {hasFixedDepartment ? (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--card-border)',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                      {profile.department?.name || 'Đơn vị chưa xác định'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Xác định tự động theo tài khoản đăng nhập của bạn
                    </div>
                  </div>
                  {profile.department?.code && (
                    <span className="badge badge-gray">{profile.department.code}</span>
                  )}
                </div>
              ) : (
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  disabled={isPending}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--card-border)',
                    background: '#ffffff',
                    fontSize: '13.5px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: '28px',
              paddingTop: '16px',
              borderTop: '1px solid var(--card-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--card-border)',
                background: '#ffffff',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Quay lại
            </Link>

            <button
              type="submit"
              disabled={isPending}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                background: isPending ? '#93c5fd' : 'var(--color-primary)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isPending ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {isPending ? (
                <>
                  <svg
                    style={{ animation: 'spin 1s linear infinite', width: '14px', height: '14px' }}
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                    <path
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Đang khởi tạo...</span>
                </>
              ) : (
                <span>Tạo báo cáo &rarr;</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
