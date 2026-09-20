create extension if not exists "pgcrypto";

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  department_id uuid references public.departments(id),
  role text not null default 'staff',
  is_active boolean not null default true,
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
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id),
  title text not null,
  report_type text not null default 'periodic',
  period_start date,
  period_end date,
  year integer,
  status text not null default 'draft',
  submitted_by uuid references public.profiles(id),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.report_values (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  indicator_id uuid not null references public.indicators(id),
  value_numeric numeric,
  value_text text,
  note text,
  created_at timestamptz not null default now(),
  unique(report_id, indicator_id)
);

create table public.report_files (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id),
  original_filename text not null,
  storage_path text not null,
  mime_type text,
  file_size bigint,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  table_name text,
  record_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_department
  on public.reports(department_id);

create index if not exists idx_reports_period
  on public.reports(period_start, period_end);

create index if not exists idx_report_values_report
  on public.report_values(report_id);

create index if not exists idx_report_values_indicator
  on public.report_values(indicator_id);

create index if not exists idx_report_files_report
  on public.report_files(report_id);

alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.indicators enable row level security;
alter table public.reports enable row level security;
alter table public.report_values enable row level security;
alter table public.report_files enable row level security;
alter table public.audit_logs enable row level security;

create policy "Allow reading departments"
on public.departments
for select
to anon, authenticated
using (true);
