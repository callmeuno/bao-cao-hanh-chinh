# PROJECT RULES — Hệ thống quản lý báo cáo

## Nguyên tắc bất biến
1. Không xóa dữ liệu người dùng khi sửa tính năng.
2. Mọi thay đổi schema phải có migration SQL.
3. Không hard-code bộ phận hoặc chỉ tiêu trong giao diện; dữ liệu cấu hình nằm trong DB.
4. Số liệu báo cáo phải có nguồn và kỳ báo cáo rõ ràng.
5. AI không được tự tạo số liệu. AI chỉ diễn giải dữ liệu đã truy vấn.
6. Quyền truy cập phải được kiểm soát ở server/database, không chỉ ẩn nút trên UI.
7. File gốc phải giữ metadata: người upload, thời gian, bộ phận, kỳ báo cáo, checksum nếu có.
8. Template Word/PDF là cấu hình/asset riêng, không trộn với logic truy vấn dữ liệu.
9. Mọi thay đổi lớn phải có test hoặc checklist kiểm thử.
10. Trước khi sửa code lớn, AI phải đọc file này và đề xuất kế hoạch.

## Kiến trúc
- Next.js App Router + TypeScript
- Supabase PostgreSQL/Auth/Storage
- Git/GitHub
- Vercel cho MVP
- AI layer tách khỏi business logic

## Quy trình thay đổi
1. Phân tích yêu cầu.
2. Liệt kê file/schema/API bị ảnh hưởng.
3. Đề xuất migration nếu cần.
4. Chờ xác nhận với thay đổi lớn.
5. Implement nhỏ, có thể rollback.
6. Test build/lint.
7. Ghi changelog.
