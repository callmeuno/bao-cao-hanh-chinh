'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createReportAction, type PeriodType } from '../actions';
import type { UserProfile, DepartmentInfo } from '../../../types/auth';

type Props = {
  profile: UserProfile;
  departments: DepartmentInfo[];
};

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateVN(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getISOWeekNumber(d: Date): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

function getISOWeekYear(d: Date): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  return target.getFullYear();
}

export function CreateReportForm({ profile, departments }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 1. Loại kỳ báo cáo: mặc định là 'year' (Năm)
  const [periodType, setPeriodType] = useState<PeriodType>('year');
  const [reportType, setReportType] = useState<'periodic' | 'ad_hoc'>('periodic');

  // Các state tương ứng với 5 loại kỳ
  const [year, setYear] = useState<number>(2026);
  const [quarter, setQuarter] = useState<number>(3); // Mặc định Quý III
  const [quarterYear, setQuarterYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(9); // Mặc định Tháng 9
  const [monthYear, setMonthYear] = useState<number>(2026);
  const [weekDate, setWeekDate] = useState<string>('2026-09-23');
  const [dayDate, setDayDate] = useState<string>('2026-09-23');
  const [title, setTitle] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Phòng ban
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
  const hasFixedDepartment = !isAdmin;

  // Tính toán trước khoảng thời gian hiển thị trực quan (Live Preview)
  const periodPreview = useMemo(() => {
    if (periodType === 'year') {
      return {
        label: `Năm ${year}`,
        start: `${year}-01-01`,
        end: `${year}-12-31`,
        year: year,
        rangeText: `01/01/${year} đến 31/12/${year}`,
      };
    }

    if (periodType === 'quarter') {
      const quarters: Record<number, { s: string; e: string; roman: string }> = {
        1: { s: '01-01', e: '03-31', roman: 'I' },
        2: { s: '04-01', e: '06-30', roman: 'II' },
        3: { s: '07-01', e: '09-30', roman: 'III' },
        4: { s: '10-01', e: '12-31', roman: 'IV' },
      };
      const qInfo = quarters[quarter] || quarters[1];
      const start = `${quarterYear}-${qInfo.s}`;
      const end = `${quarterYear}-${qInfo.e}`;
      return {
        label: `Quý ${qInfo.roman}/${quarterYear}`,
        start,
        end,
        year: quarterYear,
        rangeText: `${formatDateVN(start)} đến ${formatDateVN(end)}`,
      };
    }

    if (periodType === 'month') {
      const mStr = String(month).padStart(2, '0');
      const lastDay = new Date(monthYear, month, 0).getDate();
      const start = `${monthYear}-${mStr}-01`;
      const end = `${monthYear}-${mStr}-${String(lastDay).padStart(2, '0')}`;
      return {
        label: `Tháng ${mStr}/${monthYear}`,
        start,
        end,
        year: monthYear,
        rangeText: `${formatDateVN(start)} đến ${formatDateVN(end)}`,
      };
    }

    if (periodType === 'week') {
      if (!weekDate || !/^\d{4}-\d{2}-\d{2}$/.test(weekDate)) {
        return null;
      }
      const [y, m, d] = weekDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      if (isNaN(dt.getTime())) return null;

      // ISO week: Monday is the first day, Sunday the last
      const dayOfWeek = dt.getDay(); // 0: Chủ Nhật, 1: Thứ Hai ... 6: Thứ Bảy
      const isoDay = (dayOfWeek + 6) % 7; // 0: Monday, 6: Sunday
      const monday = new Date(y, m - 1, d - isoDay);
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
      const start = formatDateISO(monday);
      const end = formatDateISO(sunday);
      const repYear = getISOWeekYear(monday);
      const weekNum = getISOWeekNumber(monday);

      return {
        label: `Tuần ${weekNum}/${repYear}`,
        start,
        end,
        year: repYear,
        rangeText: `Thứ Hai (${formatDateVN(start)}) đến Chủ Nhật (${formatDateVN(end)})`,
      };
    }

    if (periodType === 'day') {
      if (!dayDate || !/^\d{4}-\d{2}-\d{2}$/.test(dayDate)) {
        return null;
      }
      const [y] = dayDate.split('-').map(Number);
      return {
        label: `Ngày ${formatDateVN(dayDate)}`,
        start: dayDate,
        end: dayDate,
        year: y,
        rangeText: formatDateVN(dayDate),
      };
    }

    return null;
  }, [periodType, year, quarter, quarterYear, month, monthYear, weekDate, dayDate]);

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
        departmentId: targetDeptId,
        periodType,
        reportType,
        title: reportType === 'ad_hoc' ? title : undefined,
        startDate: reportType === 'ad_hoc' ? startDate : undefined,
        endDate: reportType === 'ad_hoc' ? endDate : undefined,
        year: periodType === 'year' ? year : periodType === 'quarter' ? quarterYear : periodType === 'month' ? monthYear : (periodPreview?.year ?? year),
        quarter: periodType === 'quarter' ? quarter : undefined,
        month: periodType === 'month' ? month : undefined,
        date: periodType === 'week' ? weekDate : periodType === 'day' ? dayDate : undefined,
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
            <div>
              <label
                htmlFor="reportType"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Loại báo cáo <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                id="reportType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'periodic' | 'ad_hoc')}
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
                <option value="periodic">Định kỳ</option>
                <option value="ad_hoc">Đột xuất</option>
              </select>
            </div>

            {reportType === 'ad_hoc' && (
              <>
                <div>
                  <label
                    htmlFor="title"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                    }}
                  >
                    Tiêu đề báo cáo <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isPending}
                    placeholder="Nhập tiêu đề báo cáo"
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
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                  }}
                >
                  <div>
                    <label
                      htmlFor="startDate"
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '6px',
                      }}
                    >
                      Từ ngày <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={isPending}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--card-border)',
                        background: '#ffffff',
                        fontSize: '13.5px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="endDate"
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '6px',
                      }}
                    >
                      Đến ngày <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={isPending}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--card-border)',
                        background: '#ffffff',
                        fontSize: '13.5px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {reportType === 'periodic' && (
              <>
                {/* 1. Loại kỳ báo cáo */}
                <div>
              <label
                htmlFor="periodType"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Loại kỳ báo cáo <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                id="periodType"
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as PeriodType)}
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
                <option value="year">Năm</option>
                <option value="quarter">Quý</option>
                <option value="month">Tháng</option>
                <option value="week">Tuần</option>
                <option value="day">Ngày</option>
              </select>
            </div>

            {/* 2. Giao diện chọn thời gian theo loại kỳ */}
            {periodType === 'year' && (
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
            )}

            {periodType === 'quarter' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label
                    htmlFor="quarter"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                    }}
                  >
                    Chọn Quý <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    id="quarter"
                    value={quarter}
                    onChange={(e) => setQuarter(Number(e.target.value))}
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
                    <option value={1}>Quý I (01/01 - 31/03)</option>
                    <option value={2}>Quý II (01/04 - 30/06)</option>
                    <option value={3}>Quý III (01/07 - 30/09)</option>
                    <option value={4}>Quý IV (01/10 - 31/12)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="quarterYear"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                    }}
                  >
                    Năm <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    id="quarterYear"
                    value={quarterYear}
                    onChange={(e) => setQuarterYear(Number(e.target.value))}
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
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
              </div>
            )}

            {periodType === 'month' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label
                    htmlFor="month"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                    }}
                  >
                    Chọn Tháng <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    id="month"
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
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
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Tháng {m < 10 ? `0${m}` : m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="monthYear"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                    }}
                  >
                    Năm <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    id="monthYear"
                    value={monthYear}
                    onChange={(e) => setMonthYear(Number(e.target.value))}
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
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
              </div>
            )}

            {periodType === 'week' && (
              <div>
                <label
                  htmlFor="weekDate"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  Chọn ngày trong tuần <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="weekDate"
                  type="date"
                  value={weekDate}
                  onChange={(e) => setWeekDate(e.target.value)}
                  disabled={isPending}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--card-border)',
                    background: '#ffffff',
                    fontSize: '13.5px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Quy ước tuần tính từ Thứ Hai đến Chủ Nhật. Chọn một ngày bất kỳ để xác định tuần tương ứng.
                </div>
              </div>
            )}

            {periodType === 'day' && (
              <div>
                <label
                  htmlFor="dayDate"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  Chọn ngày báo cáo <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="dayDate"
                  type="date"
                  value={dayDate}
                  onChange={(e) => setDayDate(e.target.value)}
                  disabled={isPending}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--card-border)',
                    background: '#ffffff',
                    fontSize: '13.5px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </div>
            )}
              </>
            )}

            {/* Khung thông tin xem trước thời gian kỳ báo cáo */}
            {reportType === 'periodic' && periodPreview && (
              <div
                style={{
                  padding: '11px 14px',
                  borderRadius: '6px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1e40af',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📅</span>
                  <span>
                    <strong>{periodPreview.label}:</strong> {periodPreview.rangeText}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>
                  Năm {periodPreview.year}
                </div>
              </div>
            )}

            {/* 3. Phòng ban / Đơn vị lập */}
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
