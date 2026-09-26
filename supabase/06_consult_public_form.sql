-- ============================================================
-- 홈페이지 상담 신청 폼 연결
-- - 방문자가 '상담 신청'을 넣을 수는 있지만, 남의 신청 내용을 볼 수는 없음
-- - 신청은 항상 '신규' 상태로만 들어오고, 담당자 지정은 관리자만 가능
-- 먼저 05_consult_reservations.sql 이 실행돼 있어야 합니다.
-- ============================================================
begin;

-- 방문자 신청 넣기 (읽기 권한은 주지 않음)
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
  );

commit;
