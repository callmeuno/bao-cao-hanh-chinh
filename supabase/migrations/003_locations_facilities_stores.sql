-- Migration 003: locations, facilities, stores
-- 1. Add level column to locations
ALTER TABLE public.locations
    ADD COLUMN level text NOT NULL CHECK (level IN ('province','district','commune'));

-- 2. Create facilities table
CREATE TABLE public.facilities (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id    uuid NOT NULL REFERENCES public.departments(id),
    code             text,
    name             text NOT NULL,
    address          text,
    location_id      uuid REFERENCES public.locations(id),
    facility_type    text,
    livestock_description text,
    scale_description     text,
    vietgap_status   boolean,
    disease_free_status boolean,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 3. Create stores table
CREATE TABLE public.stores (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id    uuid NOT NULL REFERENCES public.departments(id),
    code             text,
    name            text NOT NULL,
    address         text,
    location_id     uuid REFERENCES public.locations(id),
    business_type   text,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 4. Add foreign keys to report_value_details
ALTER TABLE public.report_value_details
    ADD COLUMN facility_id uuid REFERENCES public.facilities(id),
    ADD COLUMN store_id    uuid REFERENCES public.stores(id);

-- 5. Enable Row Level Security for new tables
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 6. Indexes
CREATE INDEX idx_locations_parent_id ON public.locations(parent_id);
CREATE INDEX idx_locations_level    ON public.locations(level);
CREATE INDEX idx_facilities_department_id ON public.facilities(department_id);
CREATE INDEX idx_facilities_location_id   ON public.facilities(location_id);
CREATE INDEX idx_stores_department_id ON public.stores(department_id);
CREATE INDEX idx_stores_location_id   ON public.stores(location_id);
CREATE INDEX idx_report_value_details_facility_id ON public.report_value_details(facility_id);
CREATE INDEX idx_report_value_details_store_id    ON public.report_value_details(store_id);
