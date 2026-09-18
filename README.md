# Hệ thống quản lý báo cáo — MVP

Stack đề xuất: Next.js 16 + TypeScript + Supabase + Vercel + Git/GitHub.

## Mục tiêu
- Các bộ phận upload báo cáo.
- Lưu file gốc và metadata.
- Chuẩn hóa số liệu vào PostgreSQL.
- So sánh tuần/tháng/quý/năm.
- Sinh Word/PDF theo template.
- Chat AI truy vấn dữ liệu, không tự bịa số liệu.
- Có workflow duyệt và audit log.

## Bắt đầu

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sau đó cấu hình Supabase theo `supabase/migrations/001_initial_schema.sql`.

## Giai đoạn tiếp theo
1. Supabase Auth + RLS.
2. Upload vào Storage.
3. Parser DOCX/XLSX/PDF.
4. UI quản lý báo cáo.
5. Dashboard + so sánh.
6. Template DOCX/PDF.
7. AI query layer.
8. Tests + backup/deployment.
