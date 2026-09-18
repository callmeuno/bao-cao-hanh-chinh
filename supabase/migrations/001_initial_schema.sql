create extension if not exists pgcrypto;

create type public.user_role as enum ('admin','leader','department_manager','staff','viewer');
create type public.report_period_type as enum ('day','week','month','quarter','year');
create type public.report_status as enum ('draft','submitted','pending_approval','approved','rejected');

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'staff',
  department_id uuid references public.departments(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.indicators (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  unit text,
  description text,
  data_type text not null default 'number',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id),
  period_type public.report_period_type not null,
  period_start date not null,
  period_end date not null,
  year int not null,
  title text not null,
  status public.report_status not null default 'draft',
  source_file_path text,
  source_file_name text,
  uploaded_by uuid references public.profiles(id),
  submitted_at timestamptz,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.report_values (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  indicator_id uuid not null references public.indicators(id),
  numeric_value numeric,
  text_value text,
  unit text,
  source_location text,
  confidence numeric,
  created_at timestamptz not null default now(),
  unique(report_id, indicator_id)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index reports_department_period_idx on public.reports(department_id, period_start, period_end);
create index report_values_indicator_idx on public.report_values(indicator_id);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

insert into public.departments(code,name) values
('VH','Văn hóa'),('TT','Thông tin'),('TDTT','Thể thao'),('KN','Khuyến nông'),('CNTY','Chăn nuôi - thú y')
on conflict (code) do nothing;
