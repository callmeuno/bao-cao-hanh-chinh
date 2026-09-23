'use server';

import { createClient } from '../../lib/supabase/server';
import { getCurrentProfile } from '../../lib/auth';

export type CreateReportResult =
  | { success: true; reportId: string }
  | { success: false; error: string; duplicate?: boolean; existingId?: string };

export async function createReportAction(params: {
  year: number;
  period: string; // 'year'
  departmentId?: string;
}): Promise<CreateReportResult> {
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

  const year = Number(params.year);
  if (!year || year < 2000 || year > 2100) {
    return { success: false, error: 'Năm báo cáo không hợp lệ (hỗ trợ từ năm 2000 đến 2100).' };
  }

  // Mặc định kỳ báo cáo cả năm (chuẩn bị mở rộng quý/tháng trong tương lai)
  const periodStart = `${year}-01-01`;
  const periodEnd = `${year}-12-31`;
  const title = `Báo cáo năm ${year} - ${dept.name}`;

  // Kiểm tra trùng lặp báo cáo (ngăn ngừa duplicate theo phòng ban, năm, kỳ)
  const { data: existing, error: checkError } = await supabase
    .from('reports')
    .select('id, title, status')
    .eq('department_id', targetDepartmentId)
    .eq('year', year)
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
      error: `Báo cáo năm ${year} của ${dept.name} đã tồn tại trong hệ thống.`,
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
      year,
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
