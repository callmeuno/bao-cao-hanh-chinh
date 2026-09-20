-- ============================================================
-- Migration 005: Dimension Seed (57 items)
-- ============================================================

INSERT INTO public.dimension_items (dimension_type_id, code, name)
SELECT
    dt.id AS dimension_type_id,
    x.code,
    x.name
FROM (
    VALUES
        -- 1. crop (15 items)
        ('crop', 'lua_nuoc', 'Lúa nước'),
        ('crop', 'ngo', 'Ngô'),
        ('crop', 'ngo_lai', 'Ngô lai'),
        ('crop', 'san', 'Sắn'),
        ('crop', 'khoai_lang', 'Khoai lang'),
        ('crop', 'rau_cac_loai', 'Rau các loại'),
        ('crop', 'dau_cac_loai', 'Đậu các loại'),
        ('crop', 'mia', 'Mía'),
        ('crop', 'mia_trong_moi', 'Mía trồng mới'),
        ('crop', 'mia_luu_goc', 'Mía lưu gốc'),
        ('crop', 'lac', 'Lạc'),
        ('crop', 'me', 'Mè'),
        ('crop', 'cay_ot', 'Cây ớt'),
        ('crop', 'co_chan_nuoi', 'Cỏ chăn nuôi'),
        ('crop', 'cay_hang_nam_con_lai', 'Cây hàng năm còn lại'),

        -- 2. disease (16 items)
        ('disease', 'bo_tri', 'Bọ trĩ'),
        ('disease', 'tuyen_trung', 'Tuyến trùng'),
        ('disease', 'sau_cuon_la_nho', 'Sâu cuốn lá nhỏ'),
        ('disease', 'sau_duc_than', 'Sâu đục thân'),
        ('disease', 'oc_buou_vang', 'Ốc bươu vàng'),
        ('disease', 'chuot', 'Chuột'),
        ('disease', 'benh_dao_on', 'Bệnh đạo ôn'),
        ('disease', 'benh_bac_la', 'Bệnh bạc lá'),
        ('disease', 'ray_nau', 'Rầy nâu'),
        ('disease', 'sau_keo_mua_thu', 'Sâu keo mùa thu'),
        ('disease', 'sau_xanh', 'Sâu xanh'),
        ('disease', 'benh_than_thu', 'Bệnh thán thư'),
        ('disease', 'benh_kham_la', 'Bệnh khảm lá'),
        ('disease', 'bo_phan_trang', 'Bọ phấn trắng'),
        ('disease', 'benh_trang_la_mia', 'Bệnh trắng lá mía'),
        ('disease', 'dich_ta_lon_chau_phi', 'Dịch tả lợn châu Phi (DTLCP)'),

        -- 3. vaccine (9 items)
        ('vaccine', 'lmlm', 'LMLM'),
        ('vaccine', 'vdnc', 'VDNC'),
        ('vaccine', 'cum_gia_cam', 'Cúm gia cầm'),
        ('vaccine', 'dai_cho_meo', 'Dại chó/mèo'),
        ('vaccine', 'dich_ta_va_kep_heo', 'Dịch tả và kép heo'),
        ('vaccine', 'h5n1', 'H5N1'),
        ('vaccine', 'gumboro', 'Gumboro'),
        ('vaccine', 'newcastle', 'Newcastle'),
        ('vaccine', 'duck_plague', 'Duck plague'),

        -- 4. training_model (6 items)
        ('training_model', 'lua_giam_phat_thai', 'Lúa giảm phát thải, thích ứng biến đổi khí hậu'),
        ('training_model', 'dau_nuoi_tam_ben_vung', 'Dâu nuôi tằm bền vững'),
        ('training_model', 'kho_qua_vietgap', 'Khổ qua VietGAP'),
        ('training_model', 'khoai_lang_kn', 'Khoai lang'),
        ('training_model', 'bi_do', 'Bí đỏ'),
        ('training_model', 'ga_thuong_pham_atsh', 'Gà thương phẩm an toàn sinh học'),

        -- 5. livestock (8 items)
        ('livestock', 'trau', 'Trâu'),
        ('livestock', 'bo', 'Bò'),
        ('livestock', 'bo_lai', 'Bò lai'),
        ('livestock', 'lon_heo', 'Lợn/Heo'),
        ('livestock', 'gia_cam', 'Gia cầm'),
        ('livestock', 'de', 'Dê'),
        ('livestock', 'cho', 'Chó'),
        ('livestock', 'chim_yen', 'Chim yến'),

        -- 6. severity (3 items)
        ('severity', 'nhe', 'Nhẹ'),
        ('severity', 'trung_binh', 'Trung bình'),
        ('severity', 'nang', 'Nặng')
) AS x(dimension_type_code, code, name)
JOIN public.dimension_types dt ON dt.code = x.dimension_type_code
ON CONFLICT (dimension_type_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = true;
