-- Migration: 010_rename_report_type.sql

-- 1. Xóa constraint cũ giới hạn report_type (nếu có)
-- (Ghi chú: Qua kiểm tra schema từ 001 đến 009, bảng reports chỉ định nghĩa cột report_type text, không có CHECK constraint explicitly cho cột này. 
-- Tuy nhiên, ta vẫn dùng IF EXISTS để đảm bảo an toàn nếu constraint từng được tạo thủ công với tên mặc định).
ALTER TABLE public.reports 
DROP CONSTRAINT IF EXISTS reports_report_type_check;

-- 2. Cập nhật dữ liệu hiện có: periodic -> dinh_ky, ad_hoc -> dot_xuat
UPDATE public.reports SET report_type = 'dinh_ky' WHERE report_type = 'periodic';
UPDATE public.reports SET report_type = 'dot_xuat' WHERE report_type = 'ad_hoc';

-- 3. Đặt DEFAULT của report_type thành dinh_ky
ALTER TABLE public.reports 
ALTER COLUMN report_type SET DEFAULT 'dinh_ky';

-- 4. Tạo constraint mới chỉ cho phép dinh_ky và dot_xuat
ALTER TABLE public.reports 
ADD CONSTRAINT reports_report_type_check 
CHECK (report_type IN ('dinh_ky', 'dot_xuat'));
