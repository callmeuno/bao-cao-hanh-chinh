-- ============================================================
-- Migration 002: Indicator catalog + dimensions
-- ============================================================

create table public.indicator_groups (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id),
  code text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint indicator_groups_department_code_unique
    unique (department_id, code)
);

create index if not exists idx_indicator_groups_department
  on public.indicator_groups(department_id);

alter table public.indicators
  add column if not exists group_id uuid;

alter table public.indicators
  add constraint indicators_group_id_fkey
  foreign key (group_id)
  references public.indicator_groups(id);

create index if not exists idx_indicators_group
  on public.indicators(group_id);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  parent_id uuid references public.locations(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_locations_parent
  on public.locations(parent_id);

create table public.dimension_types (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.dimension_items (
  id uuid primary key default gen_random_uuid(),
  dimension_type_id uuid not null
    references public.dimension_types(id)
    on delete cascade,
  code text not null,
  name text not null,
  parent_id uuid references public.dimension_items(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint dimension_items_type_code_unique
    unique (dimension_type_id, code)
);

create index if not exists idx_dimension_items_type
  on public.dimension_items(dimension_type_id);

create index if not exists idx_dimension_items_parent
  on public.dimension_items(parent_id);

create table public.indicator_dimensions (
  id uuid primary key default gen_random_uuid(),
  indicator_id uuid not null
    references public.indicators(id)
    on delete cascade,
  dimension_type_id uuid not null
    references public.dimension_types(id),
  is_required boolean not null default false,
  sort_order integer not null default 0,

  constraint indicator_dimensions_unique
    unique (indicator_id, dimension_type_id)
);

create index if not exists idx_indicator_dimensions_indicator
  on public.indicator_dimensions(indicator_id);

create index if not exists idx_indicator_dimensions_type
  on public.indicator_dimensions(dimension_type_id);

create table public.report_value_details (
  id uuid primary key default gen_random_uuid(),
  report_value_id uuid not null
    references public.report_values(id)
    on delete cascade,
  location_id uuid references public.locations(id),
  value_numeric numeric,
  value_text text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_report_value_details_report_value
  on public.report_value_details(report_value_id);

create index if not exists idx_report_value_details_location
  on public.report_value_details(location_id);

create table public.report_value_detail_dimensions (
  detail_id uuid not null
    references public.report_value_details(id)
    on delete cascade,
  dimension_type_id uuid not null
    references public.dimension_types(id),
  dimension_item_id uuid not null
    references public.dimension_items(id),

  primary key (detail_id, dimension_type_id)
);

create index if not exists idx_report_value_detail_dimensions_item
  on public.report_value_detail_dimensions(dimension_item_id);

insert into public.indicator_groups
  (department_id, code, name, description)
select
  d.id,
  x.code,
  x.name,
  x.description
from (
  values
    ('HCTH', 'Hành chính tổng hợp', 'Nhóm chỉ tiêu hành chính tổng hợp'),
    ('TTBVTV', 'Trồng trọt và BVTV', 'Nhóm chỉ tiêu trồng trọt và bảo vệ thực vật'),
    ('KN', 'Khuyến nông', 'Nhóm chỉ tiêu khuyến nông'),
    ('CNTY', 'Chăn nuôi, thú y', 'Nhóm chỉ tiêu chăn nuôi và thú y'),
    ('VHTT', 'Văn hóa, tuyên truyền trực quan - lưu động', 'Nhóm chỉ tiêu văn hóa và tuyên truyền'),
    ('PTTH', 'Phát thanh - truyền hình', 'Nhóm chỉ tiêu phát thanh và truyền hình'),
    ('TDTTTV', 'Hoạt động thể dục - thể thao - thư viện', 'Nhóm chỉ tiêu thể dục, thể thao và thư viện')
) as x(code, name, description)
join public.departments d
  on d.code = x.code
on conflict (department_id, code) do nothing;

insert into public.dimension_types
  (code, name, description)
values
  ('crop', 'Cây trồng', 'Loại cây trồng'),
  ('livestock', 'Vật nuôi', 'Loại vật nuôi'),
  ('disease', 'Sâu bệnh / dịch bệnh', 'Đối tượng sâu bệnh hoặc dịch bệnh'),
  ('vaccine', 'Vaccine', 'Loại vaccine'),
  ('training_model', 'Mô hình khuyến nông', 'Mô hình hoặc chương trình khuyến nông'),
  ('facility', 'Cơ sở / trang trại', 'Cơ sở, trang trại, dự án'),
  ('severity', 'Mức độ', 'Mức độ nhẹ, trung bình, nặng')
on conflict (code) do nothing;

alter table public.indicator_groups enable row level security;
alter table public.locations enable row level security;
alter table public.dimension_types enable row level security;
alter table public.dimension_items enable row level security;
alter table public.indicator_dimensions enable row level security;
alter table public.report_value_details enable row level security;
alter table public.report_value_detail_dimensions enable row level security;
