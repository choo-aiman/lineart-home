-- ============================================================
-- 통합 운영 시스템 1) 상담예약 관리
-- - 상담 예약 표를 만들고, '통합 운영' 권한이 있는 관리자만 보고 고칠 수 있게 잠금
-- - 방문자(로그인 안 한 사람)는 아예 접근 불가 (학생 개인정보)
-- 먼저 01_google_admin_prepare.sql 이 실행돼 있어야 합니다.
-- ============================================================
begin;

create table if not exists public.consult_reservations (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  student_name  text not null,                 -- 학생 이름
  phone         text,                          -- 연락처
  school        text,                          -- 학교 / 학년
  mode          text default 'ani',            -- 관심 분야: ani(만화·애니) / fine(회화)
  preferred_at  timestamptz,                   -- 희망 상담 일시
  channel       text,                          -- 신청 경로: 홈페이지 / 전화 / 방문 / SNS 등
  status        text not null default 'new',   -- new(신규) / confirmed(예약확정) / done(상담완료) / canceled(취소)
  assigned_to   text,                          -- 담당 강사
  memo          text,                          -- 메모
  updated_at    timestamptz not null default now()
);

-- 최근 신청부터 빠르게 찾기
create index if not exists consult_reservations_created_idx
  on public.consult_reservations (created_at desc);
create index if not exists consult_reservations_status_idx
  on public.consult_reservations (status);

-- 고칠 때마다 updated_at 자동 갱신
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists consult_reservations_touch on public.consult_reservations;
create trigger consult_reservations_touch
  before update on public.consult_reservations
  for each row execute function public.touch_updated_at();

-- 보안: '통합 운영' 권한이 있는 관리자만 (방문자는 읽기도 불가)
alter table public.consult_reservations enable row level security;

do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'consult_reservations'
  loop
    execute format('drop policy %I on public.consult_reservations', pol.policyname);
  end loop;
end
$$;

create policy "통합 운영 권한자만" on public.consult_reservations
  for all to authenticated
  using (public.admin_can('system'))
  with check (public.admin_can('system'));

commit;
