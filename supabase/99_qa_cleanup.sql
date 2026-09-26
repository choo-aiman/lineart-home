-- ============================================================
-- QA 테스트로 만든 상담 예약 지우기
-- - 이름이 '테스트-' 로 시작하는 건과 점검용 '__probe__' 건만 지웁니다.
-- - 실제 신청은 지워지지 않아요.
-- 먼저 몇 건이 지워질지 보려면 아래 select 문만 실행해 보세요.
-- ============================================================

-- 확인용 (지우지 않고 세어만 봄)
select count(*) as 지워질_건수
  from public.consult_reservations
 where student_name like '테스트-%' or student_name = '__probe__';

-- 실제 삭제
delete from public.consult_reservations
 where student_name like '테스트-%' or student_name = '__probe__';
