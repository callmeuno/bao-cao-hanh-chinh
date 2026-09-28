-- Migration 011: Business data schema for reports
-- Thiết kế và tạo schema database cho hệ thống báo cáo dựa trên Data Dictionary
-- Tận dụng bảng public.reports (Kỳ báo cáo) và public.locations (Địa phương) hiện có

-- ENUMs
CREATE TYPE public.pest_severity AS ENUM ('nhe', 'trung_binh', 'nang');
CREATE TYPE public.cultural_activity_type AS ENUM ('phat_thanh', 'truyen_hinh', 'tuyen_truyen', 'the_thao', 'thu_vien', 'khac');

-- 1. Trồng trọt (crops)
CREATE TABLE public.report_crops (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    crop_type text NOT NULL,
    planned_area numeric,
    planted_area numeric,
    harvested_area numeric,
    yield numeric,
    unit text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (report_id, location_id, crop_type)
);

-- 2. Sâu bệnh (pests)
CREATE TABLE public.report_pests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    crop_group text NOT NULL,
    pest_name text NOT NULL,
    infected_area numeric,
    severity public.pest_severity,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (report_id, location_id, crop_group, pest_name, severity)
);

-- 3. Khuyến nông (agricultural_extensions)
CREATE TABLE public.report_agricultural_extensions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    model_name text NOT NULL,
    area numeric,
    household_count integer,
    status text,
    content text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (report_id, location_id, model_name)
);

-- 4. Chăn nuôi (livestock)
CREATE TABLE public.report_livestock (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    livestock_type text NOT NULL,
    category text NOT NULL,
    quantity numeric,
    unit text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (report_id, location_id, livestock_type, category)
);

-- 5. Cơ sở/trang trại (farms)
CREATE TABLE public.report_farms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    farm_name text NOT NULL,
    livestock_type text,
    quantity numeric,
    scale text,
    certification text,
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (report_id, location_id, farm_name, livestock_type)
);

-- 6. Dịch bệnh (animal_diseases)
CREATE TABLE public.report_animal_diseases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    discovery_date date,
    location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    disease_name text NOT NULL,
    household_count integer,
    infected_count numeric,
    dead_count numeric,
    destroyed_count numeric,
    destroyed_weight numeric,
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (report_id, location_id, disease_name, discovery_date)
);

-- 7. Vaccine (vaccines)
CREATE TABLE public.report_vaccines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    vaccine_type text NOT NULL,
    unit text NOT NULL DEFAULT 'lieu',
    supplied_count numeric,
    vaccinated_count numeric,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (report_id, location_id, vaccine_type)
);

-- 8. Hoạt động văn hóa/thông tin/thể thao (cultural_activities)
CREATE TABLE public.report_cultural_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    activity_type public.cultural_activity_type NOT NULL,
    so_chuong_trinh integer,
    so_tin integer,
    so_bai integer,
    so_video integer,
    so_luot_phuc_vu integer,
    so_dau_sach integer,
    details jsonb DEFAULT '{}'::jsonb,
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (report_id, location_id, activity_type)
);

-- Bật RLS (Row Level Security) cho các bảng mới
ALTER TABLE public.report_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_pests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_agricultural_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_livestock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_animal_diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cultural_activities ENABLE ROW LEVEL SECURITY;

-- Tạo các policy cơ bản cho phép đọc dữ liệu (chỉ cho authenticated)
CREATE POLICY "Allow reading report_crops" ON public.report_crops FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow reading report_pests" ON public.report_pests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow reading report_agricultural_extensions" ON public.report_agricultural_extensions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow reading report_livestock" ON public.report_livestock FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow reading report_farms" ON public.report_farms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow reading report_animal_diseases" ON public.report_animal_diseases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow reading report_vaccines" ON public.report_vaccines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow reading report_cultural_activities" ON public.report_cultural_activities FOR SELECT TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX idx_report_crops_report ON public.report_crops(report_id);
CREATE INDEX idx_report_crops_location ON public.report_crops(location_id);
CREATE INDEX idx_report_pests_report ON public.report_pests(report_id);
CREATE INDEX idx_report_pests_location ON public.report_pests(location_id);
CREATE INDEX idx_report_extensions_report ON public.report_agricultural_extensions(report_id);
CREATE INDEX idx_report_extensions_location ON public.report_agricultural_extensions(location_id);
CREATE INDEX idx_report_livestock_report ON public.report_livestock(report_id);
CREATE INDEX idx_report_livestock_location ON public.report_livestock(location_id);
CREATE INDEX idx_report_farms_report ON public.report_farms(report_id);
CREATE INDEX idx_report_farms_location ON public.report_farms(location_id);
CREATE INDEX idx_report_diseases_report ON public.report_animal_diseases(report_id);
CREATE INDEX idx_report_diseases_location ON public.report_animal_diseases(location_id);
CREATE INDEX idx_report_vaccines_report ON public.report_vaccines(report_id);
CREATE INDEX idx_report_vaccines_location ON public.report_vaccines(location_id);
CREATE INDEX idx_report_cultural_report ON public.report_cultural_activities(report_id);
CREATE INDEX idx_report_cultural_location ON public.report_cultural_activities(location_id);
