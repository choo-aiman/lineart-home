-- ============================================================
-- 상담 신청: 신규생 / 재원생 구분 추가
-- - 재원생은 이름·연락처·보호자 동반·희망 일시·문의 내용만 받음
-- 먼저 05~08 이 실행돼 있어야 합니다.
-- ============================================================
begin;

alter table public.consult_reservations
  add column if not exists visitor_type text not null default 'new';  -- new = 신규생, enrolled = 재원생

drop policy if exists "방문자 상담 신청" on public.consult_reservations;
create policy "방문자 상담 신청" on public.consult_reservations
  for insert to anon, authenticated
  with check (
    status = 'new'
    and assigned_to is null
    and visitor_type in ('new', 'enrolled')
    and char_length(student_name) between 1 and 40
    and (phone is null or char_length(phone) <= 30)
    and (memo is null or char_length(memo) <= 1000)
    and (guardian is null or guardian in ('with', 'alone'))
    and (guardian_name is null or char_length(guardian_name) <= 40)
    and (guardian_relation is null or guardian_relation in ('모', '부', '기타'))
    and (guardian_phone is null or char_length(guardian_phone) <= 30)
    and (student_type is null or student_type in ('middle', 'high', 'ged', 'retake', 'etc'))
    and (grade is null or grade between 1 and 3)
    and (age is null or age between 10 and 30)
    and (purpose is null or purpose in ('highschool', 'university', 'hobby'))
  );

commit;
