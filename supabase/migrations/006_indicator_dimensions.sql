-- ============================================================
-- Migration 006: Indicator Dimensions Mapping (62 mappings)
-- ============================================================

INSERT INTO public.indicator_dimensions (indicator_id, dimension_type_id, is_required, sort_order)
SELECT
    i.id AS indicator_id,
    dt.id AS dimension_type_id,
    true AS is_required,
    m.sort_order
FROM (
    VALUES
        -- 1. TTBVTV-01..25 -> crop (sort_order = 1) (25 mappings)
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

        -- 2. KN-01..08 -> training_model (sort_order = 1) (8 mappings)
        ('KN-01', 'training_model', 1),
        ('KN-02', 'training_model', 1),
        ('KN-03', 'training_model', 1),
        ('KN-04', 'training_model', 1),
        ('KN-05', 'training_model', 1),
        ('KN-06', 'training_model', 1),
        ('KN-07', 'training_model', 1),
        ('KN-08', 'training_model', 1),

        -- 3. CNTY-01..14 -> livestock (sort_order = 1) (14 mappings)
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

        -- 4. CNTY-21..26 -> disease (sort_order = 1) & livestock (sort_order = 2) (12 mappings)
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

        -- 5. CNTY-27..29 -> vaccine (sort_order = 1) (3 mappings)
        ('CNTY-27', 'vaccine', 1),
        ('CNTY-28', 'vaccine', 1),
        ('CNTY-29', 'vaccine', 1)
) AS m(indicator_code, dimension_type_code, sort_order)
JOIN public.indicators i ON i.code = m.indicator_code
JOIN public.dimension_types dt ON dt.code = m.dimension_type_code
ON CONFLICT (indicator_id, dimension_type_id) DO UPDATE SET
    is_required = EXCLUDED.is_required,
    sort_order = EXCLUDED.sort_order;
