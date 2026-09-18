# Kiến trúc hệ thống

## Luồng dữ liệu
Upload -> Storage -> Extraction -> Validation -> PostgreSQL -> Reporting/Analytics -> DOCX/PDF/Chat

## Quy tắc AI
AI nhận câu hỏi -> tạo kế hoạch truy vấn có kiểm soát -> backend truy vấn DB -> trả dữ liệu có nguồn -> AI diễn giải. Không cho AI tự ghi số liệu vào DB nếu không qua validation.

## Mở rộng
- Approval workflow
- Versioning báo cáo
- OCR cho PDF scan
- Chữ ký số
- Export Excel
- Notification
- Local LLM/Ollama nếu cần giảm chi phí API
