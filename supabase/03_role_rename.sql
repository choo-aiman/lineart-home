-- ============================================================
-- 직책 이름 정리: 기존에 저장된 직책을 새 이름으로 바꿉니다.
--   전임 강사 → 전임 / 준전임 강사 → 준전임 / 보조 강사 → 보조
-- 사이트 화면에는 영향 없음 (관리자 관리 탭에만 보이는 값)
-- ============================================================
update public.admin_users set role = '전임'   where role = '전임 강사';
update public.admin_users set role = '준전임' where role = '준전임 강사';
update public.admin_users set role = '보조'   where role = '보조 강사';
