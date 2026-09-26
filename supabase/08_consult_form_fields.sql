-- ============================================================
-- 상담 신청 폼 항목 추가
-- - 보호자 정보(성함/관계/연락처)
-- - 학생 구분(중학생·고등학생·검정고시·N수생·기타)과 학년 또는 나이
-- - 상담 목적(고등학교 입시 / 대학교 입시 / 취미)
-- 먼저 05, 06, 07 이 실행돼 있어야 합니다.
-- ============================================================
begin;

alter table public.consult_reservations add column if not exists guardian_name     text;
alter table public.consult_reservations add column if not exists guardian_relation text;  -- 모 / 부 / 기타
alter table public.consult_reservations add column if not exists guardian_phone    text;
alter table public.consult_reservations add column if not exists student_type      text;  -- middle / high / ged / retake / etc
alter table public.consult_reservations add column if not exists grade             smallint; -- 1~3학년
alter table public.consult_reservations add column if not exists age               smallint; -- 10~30세
alter table public.consult_reservations add column if not exists purpose           text;  -- highschool / university / hobby

-- 방문자 신청 규칙 (값 범위까지 데이터베이스에서 확인)
drop policy if exists "방문자 상담 신청" on public.consult_reservations;
create policy "방문자 상담 신청" on public.consult_reservations
  for insert to anon, authenticated
  with check (
    status = 'new'
    and assigned_to is null
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
