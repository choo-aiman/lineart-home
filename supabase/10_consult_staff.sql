-- ============================================================
-- 담당 강사 목록 함수
-- - 상담예약 관리에서 담당 강사를 고를 때 쓰는 목록
-- - 원장 / 전임 / 준전임 직책의 활성 관리자만 나옴 (보조는 제외)
-- - 관리자 명단 전체를 보여주지 않고 이름·직책만 돌려줌 ('통합 운영' 권한자만 호출 가능)
-- 먼저 01 이 실행돼 있어야 합니다.
-- ============================================================
begin;

create or replace function public.consult_staff()
returns setof json
language sql stable security definer
set search_path = ''
as $$
  select json_build_object('name', a.name, 'role', a.role)
    from public.admin_users a
   where public.admin_can('system')
     and a.is_active
     and a.role in ('원장', '전임', '준전임')
   order by
     case a.role when '원장' then 1 when '전임' then 2 else 3 end,
     a.name
$$;

revoke all on function public.consult_staff() from public, anon;
grant execute on function public.consult_staff() to authenticated;

commit;
