-- ============================================================
-- 상담 관리 2) 상담 기록
-- - 상담한 내용을 학생별로 남기는 표
-- - '상담 관리' 권한이 있는 관리자만 보고 고칠 수 있음 (방문자는 접근 불가)
-- 먼저 05, 01 이 실행돼 있어야 합니다.
-- ============================================================
begin;

create table if not exists public.counsel_records (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  mode           text not null default 'ani',      -- ani(애니) / fine(회화)
  counseled_at   timestamptz not null default now(), -- 상담 일시

  -- 학생 정보 (재원생 표나 상담 예약에서 불러오거나 직접 입력)
  student_name   text not null,
  student_phone  text,
  school         text,
  grade          text,                             -- 학년 / 기수 등 자유 입력
  purpose        text,                             -- admission(입시) / career(진로) / tuition(원비) / relation(관계) / etc(기타)

  counselor      text,                             -- 상담 강사
  cause          text,                             -- 원인
  process        text,                             -- 상담 과정
  result         text,                             -- 결과

  -- 추후 상담 예약 (예약을 잡으면 상담예약 목록에도 함께 생성됨)
  next_reserved  boolean not null default false,
  next_at        timestamptz,
  next_reservation_id bigint references public.consult_reservations(id) on delete set null,

  -- 어디서 정보를 가져왔는지 (나중에 추적용)
  from_reservation_id bigint references public.consult_reservations(id) on delete set null
);

create index if not exists counsel_records_mode_idx      on public.counsel_records (mode, counseled_at desc);
create index if not exists counsel_records_name_idx      on public.counsel_records (student_name);
create index if not exists counsel_records_next_idx      on public.counsel_records (next_reserved, next_at);

-- 고칠 때마다 updated_at 자동 갱신 (05 에서 만든 함수 재사용)
drop trigger if exists counsel_records_touch on public.counsel_records;
create trigger counsel_records_touch
  before update on public.counsel_records
  for each row execute function public.touch_updated_at();

-- 보안: '상담 관리' 권한(system)이 있는 관리자만
alter table public.counsel_records enable row level security;

do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'counsel_records'
  loop
    execute format('drop policy %I on public.counsel_records', pol.policyname);
  end loop;
end
$$;

create policy "상담 관리 권한자만" on public.counsel_records
  for all to authenticated
  using (public.admin_can('system'))
  with check (public.admin_can('system'));

commit;
