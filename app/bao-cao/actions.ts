'use server';

import { createClient } from '../../lib/supabase/server';
import { getCurrentProfile } from '../../lib/auth';

export type CreateReportResult =
  | { success: true; reportId: string }
  | { success: false; error: string; duplicate?: boolean; existingId?: string };

export type PeriodType = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type CreateReportParams = {
  departmentId?: string;
  periodType?: PeriodType;
  year?: number;
  period?: string; // Tương thích ngược nếu client cũ gọi
  quarter?: number; // 1, 2, 3, 4
  month?: number; // 1 .. 12
  date?: string; // YYYY-MM-DD (dùng cho kỳ ngày hoặc tuần)
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

export async function createReportAction(params: CreateReportParams): Promise<CreateReportResult> {
  const profileRes = await getCurrentProfile();
  if (profileRes.status !== 'authenticated') {
    return { success: false, error: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' };
  }

  const { profile } = profileRes;
  const supabase = await createClient();

  // Xác định đơn vị lập báo cáo
  let targetDepartmentId = profile.department_id;
  if (profile.role === 'admin') {
    // Admin luôn chọn phòng ban từ form, không dùng profile.department_id
    if (params.departmentId) {
      targetDepartmentId = params.departmentId;
    } else {
      return { success: false, error: 'Vui lòng chọn phòng ban lập báo cáo.' };
    }
  }

  if (!targetDepartmentId) {
    return { success: false, error: 'Tài khoản chưa được gán phòng ban trực thuộc.' };
  }

  // Lấy thông tin phòng ban để đặt tiêu đề
  const { data: dept, error: deptError } = await supabase
    .from('departments')
    .select('id, name, code')
    .eq('id', targetDepartmentId)
    .single();

  if (deptError || !dept) {
    return { success: false, error: 'Không tìm thấy thông tin phòng ban trong hệ thống.' };
  }

  const periodType = (params.periodType || params.period || 'year') as PeriodType;

  let periodStart: string;
  let periodEnd: string;
  let reportYear: number;
  let title: string;

  if (periodType === 'year') {
    const y = Number(params.year);
    if (!y || y < 2000 || y > 2100) {
      return { success: false, error: 'Năm báo cáo không hợp lệ (hỗ trợ từ năm 2000 đến 2100).' };
    }
    reportYear = y;
    periodStart = `${y}-01-01`;
    periodEnd = `${y}-12-31`;
    title = `Báo cáo năm ${y} - ${dept.name}`;
  } else if (periodType === 'quarter') {
    const y = Number(params.year);
    if (!y || y < 2000 || y > 2100) {
      return { success: false, error: 'Năm báo cáo không hợp lệ (hỗ trợ từ năm 2000 đến 2100).' };
    }
    const q = Number(params.quarter);
    if (![1, 2, 3, 4].includes(q)) {
      return { success: false, error: 'Quý báo cáo không hợp lệ (chọn Quý 1, 2, 3 hoặc 4).' };
    }
    reportYear = y;
    const quarters: Record<number, { start: string; end: string; roman: string }> = {
      1: { start: `${y}-01-01`, end: `${y}-03-31`, roman: 'I' },
      2: { start: `${y}-04-01`, end: `${y}-06-30`, roman: 'II' },
      3: { start: `${y}-07-01`, end: `${y}-09-30`, roman: 'III' },
      4: { start: `${y}-10-01`, end: `${y}-12-31`, roman: 'IV' },
    };
    const info = quarters[q];
    periodStart = info.start;
    periodEnd = info.end;
    title = `Báo cáo Quý ${info.roman}/${y} - ${dept.name}`;
  } else if (periodType === 'month') {
    const y = Number(params.year);
    if (!y || y < 2000 || y > 2100) {
      return { success: false, error: 'Năm báo cáo không hợp lệ (hỗ trợ từ năm 2000 đến 2100).' };
    }
    const m = Number(params.month);
    if (!m || m < 1 || m > 12) {
      return { success: false, error: 'Tháng báo cáo không hợp lệ (chọn từ Tháng 1 đến 12).' };
    }
    reportYear = y;
    const mStr = String(m).padStart(2, '0');
    const lastDay = new Date(y, m, 0).getDate();
    periodStart = `${y}-${mStr}-01`;
    periodEnd = `${y}-${mStr}-${String(lastDay).padStart(2, '0')}`;
    title = `Báo cáo tháng ${mStr}/${y} - ${dept.name}`;
  } else if (periodType === 'week') {
    const dateStr = params.date?.trim();
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return { success: false, error: 'Vui lòng chọn một ngày trong tuần hợp lệ (YYYY-MM-DD).' };
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (isNaN(dt.getTime()) || y < 2000 || y > 2100) {
      return { success: false, error: 'Ngày trong tuần không hợp lệ.' };
    }
    // ISO week: Monday is the first day, Sunday the last
    const dayOfWeek = dt.getUTCDay(); // 0: Sunday, 1: Monday ... 6: Saturday
    const isoDay = (dayOfWeek + 6) % 7; // 0: Monday, 6: Sunday
    const mondayDate = new Date(Date.UTC(y, m - 1, d - isoDay));
    const sundayDate = new Date(Date.UTC(y, m - 1, d - isoDay + 6));
    periodStart = `${mondayDate.getUTCFullYear()}-${String(mondayDate.getUTCMonth() + 1).padStart(2, '0')}-${String(mondayDate.getUTCDate()).padStart(2, '0')}`;
    periodEnd = `${sundayDate.getUTCFullYear()}-${String(sundayDate.getUTCMonth() + 1).padStart(2, '0')}-${String(sundayDate.getUTCDate()).padStart(2, '0')}`;
    const monday = new Date(mondayDate.getUTCFullYear(), mondayDate.getUTCMonth(), mondayDate.getUTCDate());
    const weekNum = getISOWeekNumber(monday);
    reportYear = getISOWeekYear(monday);
    title = `Báo cáo tuần ${weekNum}/${reportYear} (${formatDateVN(periodStart)} - ${formatDateVN(periodEnd)}) - ${dept.name}`;
  } else if (periodType === 'day') {
    const dateStr = params.date?.trim();
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return { success: false, error: 'Vui lòng chọn một ngày báo cáo hợp lệ (YYYY-MM-DD).' };
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (isNaN(dt.getTime()) || y < 2000 || y > 2100) {
      return { success: false, error: 'Ngày báo cáo không hợp lệ.' };
    }
    reportYear = y;
    periodStart = dateStr;
    periodEnd = dateStr;
    title = `Báo cáo ngày ${formatDateVN(dateStr)} - ${dept.name}`;
  } else {
    return { success: false, error: 'Loại kỳ báo cáo không hợp lệ.' };
  }

  // Kiểm tra trùng lặp báo cáo (ngăn ngừa duplicate theo phòng ban, năm, kỳ)
  const { data: existing, error: checkError } = await supabase
    .from('reports')
    .select('id, title, status')
    .eq('department_id', targetDepartmentId)
    .eq('year', reportYear)
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .maybeSingle();

  if (checkError) {
    return { success: false, error: `Lỗi kiểm tra báo cáo: ${checkError.message}` };
  }

  if (existing) {
    return {
      success: false,
      duplicate: true,
      existingId: existing.id,
      error: `Báo cáo cho khoảng thời gian này (${formatDateVN(periodStart)} - ${formatDateVN(periodEnd)}) của ${dept.name} đã tồn tại trong hệ thống.`,
    };
  }

  // Tạo mới báo cáo với trạng thái 'draft'
  const { data: newReport, error: insertError } = await supabase
    .from('reports')
    .insert({
      department_id: targetDepartmentId,
      title,
      report_type: 'periodic',
      period_start: periodStart,
      period_end: periodEnd,
      year: reportYear,
      status: 'draft',
      submitted_by: profile.id,
    })
    .select('id')
    .single();

  if (insertError) {
    return { success: false, error: `Lỗi tạo báo cáo: ${insertError.message}` };
  }

  return { success: true, reportId: newReport.id };
}

export type ValueItem = {
  indicatorId: string;
  valueNumeric: number | null;
  valueText: string | null;
  note: string | null;
};

export type SaveValuesResult =
  | { success: true; count: number; savedAt: string }
  | { success: false; error: string };

export async function saveReportValuesAction(params: {
  reportId: string;
  items: ValueItem[];
}): Promise<SaveValuesResult> {
  const profileRes = await getCurrentProfile();
  if (profileRes.status !== 'authenticated') {
    return { success: false, error: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' };
  }

  const supabase = await createClient();

  // Kiểm tra sự tồn tại và trạng thái của báo cáo
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id, status, department_id')
    .eq('id', params.reportId)
    .maybeSingle();

  if (reportError || !report) {
    return { success: false, error: 'Không tìm thấy báo cáo hoặc bạn không có quyền truy cập.' };
  }

  // Chỉ cho phép cập nhật dữ liệu khi báo cáo ở trạng thái draft hoặc rejected
  if (report.status !== 'draft' && report.status !== 'rejected') {
    return {
      success: false,
      error: `Báo cáo đang ở trạng thái "${report.status}" nên chỉ có thể xem, không được phép chỉnh sửa số liệu.`,
    };
  }

  // Chuẩn bị payload upsert
  const rows = params.items.map((item) => ({
    report_id: params.reportId,
    indicator_id: item.indicatorId,
    value_numeric: item.valueNumeric,
    value_text: item.valueText,
    note: item.note,
  }));

  if (rows.length === 0) {
    return {
      success: true,
      count: 0,
      savedAt: new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date()),
    };
  }

  const { error: upsertError } = await supabase
    .from('report_values')
    .upsert(rows, { onConflict: 'report_id,indicator_id' });

  if (upsertError) {
    return { success: false, error: `Lỗi lưu số liệu báo cáo: ${upsertError.message}` };
  }

  const savedAt = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());

  return { success: true, count: rows.length, savedAt };
}
