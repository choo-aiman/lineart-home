-- ============================================================
-- ⚠️ 상담 예약 · 상담 기록 전체 삭제 (테스트 데이터 정리용)
-- 되돌릴 수 없습니다. 실행 전에 아래 1)번 조회로 무엇이 지워지는지 꼭 확인하세요.
-- ============================================================

-- 1) 먼저 이것만 실행해서 확인하세요 (아무것도 지우지 않음)
select '상담 예약' as 구분, count(*) as 건수 from public.consult_reservations
union all
select '상담 기록', count(*) from public.counsel_records;

-- 지워질 상담 예약 목록 (실제 학부모 신청이 섞여 있지 않은지 확인)
select id, student_name as 이름, phone as 연락처, channel as 경로,
       to_char(created_at, 'MM-DD HH24:MI') as 신청일
  from public.consult_reservations
 order by created_at desc;


-- ============================================================
-- 2) 위에서 확인이 끝났으면, 아래 두 줄만 블록으로 선택해서 실행하세요
-- ============================================================
-- delete from public.counsel_records;
-- delete from public.consult_reservations;
