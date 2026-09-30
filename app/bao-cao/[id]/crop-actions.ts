'use server';

import { createClient } from '../../../lib/supabase/server';
import { getCurrentProfile } from '../../../lib/auth';
import type { ReportCropItem } from './ReportCropsSection';

export async function saveReportCropsAction(reportId: string, items: ReportCropItem[]) {
  if (typeof reportId !== 'string' || !reportId) {
    return { success: false, error: 'Mã báo cáo không hợp lệ' };
  }

  // 1. Kiểm tra xác thực
  const profileResult = await getCurrentProfile();
  if (profileResult.status !== 'authenticated') {
    return { success: false, error: 'Chưa xác thực' };
  }

  // 2. Lấy report và kiểm tra trạng thái
  const supabase = await createClient();
  const { data: report, error: reportErr } = await supabase
    .from('reports')
    .select('id, status')
    .eq('id', reportId)
    .single();

  if (reportErr || !report) {
    return { success: false, error: 'Không tìm thấy báo cáo' };
  }

  if (report.status !== 'draft') {
    return { success: false, error: 'Chỉ được sửa dữ liệu khi báo cáo ở trạng thái nháp (draft)' };
  }

  // Lấy danh sách location để validate
  const { data: locations } = await supabase.from('locations').select('id');
  const validLocationIds = new Set((locations || []).map(l => l.id));

  // 3. Chuẩn bị dữ liệu và validate
  const toUpsert = [];
  const incomingKeys = new Set<string>();

  for (const item of items) {
    if (!item.location_id && !item.crop_type) continue; // bỏ qua dòng trống hoàn toàn

    if (!item.location_id || !validLocationIds.has(item.location_id)) {
      return { success: false, error: 'Địa bàn không hợp lệ' };
    }

    const cropType = (item.crop_type || '').trim();
    if (!cropType) {
      return { success: false, error: 'Tên cây trồng không được để trống' };
    }

    const unit = (item.unit || '').trim();

    const validateNumber = (val: number | null | undefined) => {
      if (val === null || val === undefined) return null;
      const num = Number(val);
      if (!Number.isFinite(num)) throw new Error('Số không hợp lệ');
      return num;
    };

    let planned_area, planted_area, harvested_area, yield_val;
    try {
      planned_area = validateNumber(item.planned_area);
      planted_area = validateNumber(item.planted_area);
      harvested_area = validateNumber(item.harvested_area);
      yield_val = validateNumber(item.yield);
    } catch {
      return { success: false, error: 'Giá trị số không hợp lệ' };
    }

    const key = `${item.location_id}_${cropType}`;
    incomingKeys.add(key);

    toUpsert.push({
      ...(item.id ? { id: item.id } : {}),
      report_id: reportId,
      location_id: item.location_id,
      crop_type: cropType,
      planned_area,
      planted_area,
      harvested_area,
      yield: yield_val,
      unit,
    });
  }

  // 4. Thực hiện upsert
  if (toUpsert.length > 0) {
    const { error: upsertErr } = await supabase
      .from('report_crops')
      .upsert(toUpsert, { onConflict: 'report_id,location_id,crop_type' });

    if (upsertErr) {
      return { success: false, error: `Lỗi lưu dữ liệu: ${upsertErr.message}` };
    }
  }

  // 5. Sau khi upsert thành công, lấy lại toàn bộ danh sách để xoá những dòng thừa
  const { data: currentData } = await supabase
    .from('report_crops')
    .select('id, location_id, crop_type')
    .eq('report_id', reportId);

  const idsToDelete = (currentData || [])
    .filter(row => {
      const key = `${row.location_id}_${row.crop_type}`;
      return !incomingKeys.has(key);
    })
    .map(row => row.id);

  if (idsToDelete.length > 0) {
    const { error: delErr } = await supabase
      .from('report_crops')
      .delete()
      .in('id', idsToDelete);

    if (delErr) {
      return { success: false, error: `Lỗi xóa dữ liệu cũ: ${delErr.message}` };
    }
  }

  return { success: true };
}
