-- ============================================================
-- Migration 004: 97 Indicator Catalog & Dimension Mappings
-- ============================================================

-- 1. Seed 97 Indicators
INSERT INTO public.indicators (group_id, code, name, unit, data_type)
SELECT
    g.id AS group_id,
    x.code,
    x.name,
    x.unit,
    x.data_type
FROM (
    VALUES
        -- HCTH (5)
        ('HCTH', 'HCTH-01', 'Tổng số nhân sự', 'người', 'number'),
        ('HCTH', 'HCTH-02', 'Số viên chức', 'người', 'number'),
        ('HCTH', 'HCTH-03', 'Số hợp đồng lao động', 'người', 'number'),
        ('HCTH', 'HCTH-04', 'Số Giám đốc', 'người', 'number'),
        ('HCTH', 'HCTH-05', 'Số Phó Giám đốc', 'người', 'number'),

        -- TTBVTV (25)
        ('TTBVTV', 'TTBVTV-01', 'Tổng diện tích gieo trồng kế hoạch', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-02', 'Tổng diện tích gieo trồng thực hiện', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-03', 'Tỷ lệ thực hiện diện tích gieo trồng', '%', 'percentage'),
        ('TTBVTV', 'TTBVTV-04', 'Diện tích cây lương thực kế hoạch', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-05', 'Diện tích cây lương thực thực hiện', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-06', 'Diện tích cây tinh bột kế hoạch', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-07', 'Diện tích cây tinh bột thực hiện', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-08', 'Diện tích cây thực phẩm kế hoạch', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-09', 'Diện tích cây thực phẩm thực hiện', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-10', 'Diện tích cây công nghiệp ngắn ngày kế hoạch', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-11', 'Diện tích cây công nghiệp ngắn ngày thực hiện', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-12', 'Diện tích cây hàng năm khác kế hoạch', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-13', 'Diện tích cây hàng năm khác thực hiện', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-14', 'Diện tích cây công nghiệp dài ngày kế hoạch', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-15', 'Diện tích cây công nghiệp dài ngày thực hiện', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-16', 'Diện tích cây ăn quả kế hoạch', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-17', 'Diện tích cây ăn quả thực hiện', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-18', 'Diện tích cây dược liệu kế hoạch', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-19', 'Diện tích cây dược liệu thực hiện', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-20', 'Tổng diện tích đã thu hoạch', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-21', 'Diện tích đậu đã thu hoạch', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-22', 'Năng suất đậu', NULL, 'number'),
        ('TTBVTV', 'TTBVTV-23', 'Diện tích mè đã thu hoạch', 'ha', 'number'),
        ('TTBVTV', 'TTBVTV-24', 'Năng suất mè', NULL, 'number'),
        ('TTBVTV', 'TTBVTV-25', 'Diện tích cây hàng năm khác đã thu hoạch', 'ha', 'number'),

        -- KN (8)
        ('KN', 'KN-01', 'Số mô hình khuyến nông', 'mô hình', 'number'),
        ('KN', 'KN-02', 'Tổng diện tích mô hình', 'ha', 'number'),
        ('KN', 'KN-03', 'Tổng số hộ tham gia mô hình', 'hộ', 'number'),
        ('KN', 'KN-04', 'Số mô hình đã cấp giống', 'mô hình', 'number'),
        ('KN', 'KN-05', 'Số mô hình đã cấp vật tư', 'mô hình', 'number'),
        ('KN', 'KN-06', 'Số mô hình đã tổ chức tập huấn', 'mô hình', 'number'),
        ('KN', 'KN-07', 'Số lớp/tổ chức tập huấn chuyển giao kỹ thuật', 'lớp', 'number'),
        ('KN', 'KN-08', 'Số người/hộ tham gia tập huấn', 'người', 'number'),

        -- CNTY (30)
        ('CNTY', 'CNTY-01', 'Tổng đàn trâu', 'con', 'number'),
        ('CNTY', 'CNTY-02', 'Tổng đàn bò', 'con', 'number'),
        ('CNTY', 'CNTY-03', 'Tổng đàn bò lai', 'con', 'number'),
        ('CNTY', 'CNTY-04', 'Tổng đàn lợn', 'con', 'number'),
        ('CNTY', 'CNTY-05', 'Tổng đàn gia cầm', 'con', 'number'),
        ('CNTY', 'CNTY-06', 'Tổng đàn dê', 'con', 'number'),
        ('CNTY', 'CNTY-07', 'Tổng đàn chó', 'con', 'number'),
        ('CNTY', 'CNTY-08', 'Số hộ nuôi trâu', 'hộ', 'number'),
        ('CNTY', 'CNTY-09', 'Số hộ nuôi bò', 'hộ', 'number'),
        ('CNTY', 'CNTY-10', 'Số hộ nuôi heo', 'hộ', 'number'),
        ('CNTY', 'CNTY-11', 'Số hộ nuôi gia cầm', 'hộ', 'number'),
        ('CNTY', 'CNTY-12', 'Số hộ nuôi dê', 'hộ', 'number'),
        ('CNTY', 'CNTY-13', 'Số nhà/hộ nuôi chim yến', 'nhà/hộ', 'number'),
        ('CNTY', 'CNTY-14', 'Số hộ nuôi chó', 'hộ', 'number'),
        ('CNTY', 'CNTY-15', 'Tổng số trang trại/cơ sở chăn nuôi', 'cơ sở', 'number'),
        ('CNTY', 'CNTY-16', 'Số dự án chăn nuôi', 'dự án', 'number'),
        ('CNTY', 'CNTY-17', 'Số cơ sở quy mô trang trại', 'cơ sở', 'number'),
        ('CNTY', 'CNTY-18', 'Số cơ sở đạt VietGAP', 'cơ sở', 'number'),
        ('CNTY', 'CNTY-19', 'Số cơ sở an toàn dịch bệnh', 'cơ sở', 'number'),
        ('CNTY', 'CNTY-20', 'Số cơ sở ấp nở giống', 'cơ sở', 'number'),
        ('CNTY', 'CNTY-21', 'Số ổ dịch', 'ổ dịch', 'number'),
        ('CNTY', 'CNTY-22', 'Số hộ có dịch', 'hộ', 'number'),
        ('CNTY', 'CNTY-23', 'Số con mắc bệnh', 'con', 'number'),
        ('CNTY', 'CNTY-24', 'Số con chết', 'con', 'number'),
        ('CNTY', 'CNTY-25', 'Số con tiêu hủy', 'con', 'number'),
        ('CNTY', 'CNTY-26', 'Khối lượng tiêu hủy', 'kg', 'number'),
        ('CNTY', 'CNTY-27', 'Số lượng vaccine được cấp', 'liều', 'number'),
        ('CNTY', 'CNTY-28', 'Số lượng vaccine đã tiêm', 'liều', 'number'),
        ('CNTY', 'CNTY-29', 'Tỷ lệ tiêm phòng', '%', 'percentage'),
        ('CNTY', 'CNTY-30', 'Số cửa hàng kinh doanh thuốc, thức ăn thú y', 'cửa hàng', 'number'),

        -- VHTT (7)
        ('VHTT', 'VHTT-01', 'Số hoạt động/chương trình văn hóa', 'hoạt động', 'number'),
        ('VHTT', 'VHTT-02', 'Số hoạt động tuyên truyền trực quan', 'hoạt động', 'number'),
        ('VHTT', 'VHTT-03', 'Số hoạt động tuyên truyền lưu động', 'hoạt động', 'number'),
        ('VHTT', 'VHTT-04', 'Số chương trình văn nghệ', 'chương trình', 'number'),
        ('VHTT', 'VHTT-05', 'Số nghệ nhân tham gia', 'người', 'number'),
        ('VHTT', 'VHTT-06', 'Số đội nghệ nhân được khảo sát', 'đội', 'number'),
        ('VHTT', 'VHTT-07', 'Số nhiệm vụ thuộc chương trình mục tiêu quốc gia', 'nhiệm vụ', 'number'),

        -- PTTH (12)
        ('PTTH', 'PTTH-01', 'Số chương trình phát thanh', 'chương trình', 'number'),
        ('PTTH', 'PTTH-02', 'Thời lượng phát thanh', NULL, 'number'),
        ('PTTH', 'PTTH-03', 'Số tin phát thanh', 'tin', 'number'),
        ('PTTH', 'PTTH-04', 'Số bài phát thanh', 'bài', 'number'),
        ('PTTH', 'PTTH-05', 'Số chương trình tiếng Jrai', 'chương trình', 'number'),
        ('PTTH', 'PTTH-06', 'Số chuyên mục cải cách hành chính', 'chuyên mục', 'number'),
        ('PTTH', 'PTTH-07', 'Tổng số cụm loa', 'cụm loa', 'number'),
        ('PTTH', 'PTTH-08', 'Số cụm loa hoạt động ổn định', 'cụm loa', 'number'),
        ('PTTH', 'PTTH-09', 'Số cụm loa có sự cố', 'cụm loa', 'number'),
        ('PTTH', 'PTTH-10', 'Số video/clip sản xuất', 'video/clip', 'number'),
        ('PTTH', 'PTTH-11', 'Số tin bài/hình ảnh phản ánh', 'tin bài', 'number'),
        ('PTTH', 'PTTH-12', 'Số nội dung đăng Fanpage', 'nội dung', 'number'),

        -- TDTTTV (10)
        ('TDTTTV', 'TDTTTV-01', 'Số hoạt động thể dục thể thao', 'hoạt động', 'number'),
        ('TDTTTV', 'TDTTTV-02', 'Số địa điểm/sân thể thao được khảo sát', 'địa điểm/sân', 'number'),
        ('TDTTTV', 'TDTTTV-03', 'Số thiết bị thể dục thể thao đề xuất/lắp đặt', 'thiết bị', 'number'),
        ('TDTTTV', 'TDTTTV-04', 'Số giải/đại hội thể dục thể thao tham gia', 'giải', 'number'),
        ('TDTTTV', 'TDTTTV-05', 'Số đoàn thể thao tham gia', 'đoàn', 'number'),
        ('TDTTTV', 'TDTTTV-06', 'Số vận động viên tham gia', 'người', 'number'),
        ('TDTTTV', 'TDTTTV-07', 'Số lượt bạn đọc', 'lượt', 'number'),
        ('TDTTTV', 'TDTTTV-08', 'Số đầu sách phục vụ', 'đầu sách', 'number'),
        ('TDTTTV', 'TDTTTV-09', 'Số tài liệu/sách được sắp xếp, bảo quản', 'tài liệu/sách', 'number'),
        ('TDTTTV', 'TDTTTV-10', 'Số hoạt động thư viện', 'hoạt động', 'number')
) AS x(group_code, code, name, unit, data_type)
JOIN public.indicator_groups g ON g.code = x.group_code
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    unit = EXCLUDED.unit,
    data_type = EXCLUDED.data_type,
    group_id = EXCLUDED.group_id;


-- 2. Seed Indicator Dimensions Mapping
INSERT INTO public.indicator_dimensions (indicator_id, dimension_type_id, is_required, sort_order)
SELECT
    i.id AS indicator_id,
    dt.id AS dimension_type_id,
    true AS is_required,
    m.sort_order
FROM (
    VALUES
        -- TTBVTV-01..25 -> crop
        ('TTBVTV-01', 'crop', 1),
        ('TTBVTV-02', 'crop', 1),
        ('TTBVTV-03', 'crop', 1),
        ('TTBVTV-04', 'crop', 1),
        ('TTBVTV-05', 'crop', 1),
        ('TTBVTV-06', 'crop', 1),
        ('TTBVTV-07', 'crop', 1),
        ('TTBVTV-08', 'crop', 1),
        ('TTBVTV-09', 'crop', 1),
        ('TTBVTV-10', 'crop', 1),
        ('TTBVTV-11', 'crop', 1),
        ('TTBVTV-12', 'crop', 1),
        ('TTBVTV-13', 'crop', 1),
        ('TTBVTV-14', 'crop', 1),
        ('TTBVTV-15', 'crop', 1),
        ('TTBVTV-16', 'crop', 1),
        ('TTBVTV-17', 'crop', 1),
        ('TTBVTV-18', 'crop', 1),
        ('TTBVTV-19', 'crop', 1),
        ('TTBVTV-20', 'crop', 1),
        ('TTBVTV-21', 'crop', 1),
        ('TTBVTV-22', 'crop', 1),
        ('TTBVTV-23', 'crop', 1),
        ('TTBVTV-24', 'crop', 1),
        ('TTBVTV-25', 'crop', 1),

        -- KN-01..08 -> training_model
        ('KN-01', 'training_model', 1),
        ('KN-02', 'training_model', 1),
        ('KN-03', 'training_model', 1),
        ('KN-04', 'training_model', 1),
        ('KN-05', 'training_model', 1),
        ('KN-06', 'training_model', 1),
        ('KN-07', 'training_model', 1),
        ('KN-08', 'training_model', 1),

        -- CNTY-01..14 -> livestock
        ('CNTY-01', 'livestock', 1),
        ('CNTY-02', 'livestock', 1),
        ('CNTY-03', 'livestock', 1),
        ('CNTY-04', 'livestock', 1),
        ('CNTY-05', 'livestock', 1),
        ('CNTY-06', 'livestock', 1),
        ('CNTY-07', 'livestock', 1),
        ('CNTY-08', 'livestock', 1),
        ('CNTY-09', 'livestock', 1),
        ('CNTY-10', 'livestock', 1),
        ('CNTY-11', 'livestock', 1),
        ('CNTY-12', 'livestock', 1),
        ('CNTY-13', 'livestock', 1),
        ('CNTY-14', 'livestock', 1),

        -- CNTY-21..26 -> disease + livestock
        ('CNTY-21', 'disease', 1),
        ('CNTY-21', 'livestock', 2),
        ('CNTY-22', 'disease', 1),
        ('CNTY-22', 'livestock', 2),
        ('CNTY-23', 'disease', 1),
        ('CNTY-23', 'livestock', 2),
        ('CNTY-24', 'disease', 1),
        ('CNTY-24', 'livestock', 2),
        ('CNTY-25', 'disease', 1),
        ('CNTY-25', 'livestock', 2),
        ('CNTY-26', 'disease', 1),
        ('CNTY-26', 'livestock', 2),

        -- CNTY-27..29 -> vaccine
        ('CNTY-27', 'vaccine', 1),
        ('CNTY-28', 'vaccine', 1),
        ('CNTY-29', 'vaccine', 1)
) AS m(indicator_code, dimension_type_code, sort_order)
JOIN public.indicators i ON i.code = m.indicator_code
JOIN public.dimension_types dt ON dt.code = m.dimension_type_code
ON CONFLICT (indicator_id, dimension_type_id) DO NOTHING;
