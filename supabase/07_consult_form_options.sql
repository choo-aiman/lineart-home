-- ============================================================
-- 상담 신청 폼 보완
-- 1) 보호자 동반 여부 칸 추가
-- 2) 신청 완료 팝업 문구를 관리자에서 고칠 수 있도록 설정 표 추가
-- 먼저 05, 06 이 실행돼 있어야 합니다.
-- ============================================================
begin;

-- 1) 보호자 동반 여부 (with = 보호자 동반, alone = 혼자 방문)
alter table public.consult_reservations add column if not exists guardian text;

-- 방문자 신청 규칙에 보호자 항목 반영
drop policy if exists "방문자 상담 신청" on public.consult_reservations;
create policy "방문자 상담 신청" on public.consult_reservations
  for insert to anon, authenticated
  with check (
    status = 'new'
    and assigned_to is null
    and char_length(student_name) between 1 and 40
    and (phone is null or char_length(phone) <= 30)
    and (school is null or char_length(school) <= 60)
    and (memo is null or char_length(memo) <= 1000)
    and (guardian is null or guardian in ('with', 'alone'))
  );

-- 2) 통합 운영 시스템 설정값 (문구 등)
create table if not exists public.system_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

insert into public.system_settings (key, value)
values (
  'consult_submit_message',
  E'상담 신청이 접수됐습니다.\n\n남겨주신 연락처로 학원에서 확인 후 연락드릴게요.\n급하신 경우 063-283-7771 로 전화 주세요.'
)
on conflict (key) do nothing;

drop trigger if exists system_settings_touch on public.system_settings;
create trigger system_settings_touch
  before update on public.system_settings
  for each row execute function public.touch_updated_at();

alter table public.system_settings enable row level security;

do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'system_settings'
  loop
    execute format('drop policy %I on public.system_settings', pol.policyname);
  end loop;
end
$$;

-- 문구는 방문자 화면에도 보여야 해서 읽기는 모두 허용, 수정은 '통합 운영' 권한자만
create policy "누구나 읽기" on public.system_settings
  for select to anon, authenticated using (true);
create policy "통합 운영 권한자만 수정" on public.system_settings
  for all to authenticated
  using (public.admin_can('system'))
  with check (public.admin_can('system'));

commit;
