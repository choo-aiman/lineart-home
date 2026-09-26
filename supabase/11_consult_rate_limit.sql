-- ============================================================
-- 상담 신청 남용 방지: 같은 연락처로 하루 5건까지만
-- - 자동 프로그램이 신청을 쏟아붓는 것을 데이터베이스에서 막음
-- - 관리자('통합 운영' 권한)가 넣는 건 제한 없음
-- 먼저 05~09 가 실행돼 있어야 합니다.
-- ============================================================
begin;

create or replace function public.limit_consult_per_phone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_count integer;
begin
  -- 관리자가 직접 넣는 경우는 제한하지 않음
  if public.admin_can('system') then
    return new;
  end if;

  if new.phone is null then
    return new;
  end if;

  select count(*) into recent_count
    from public.consult_reservations r
   where r.phone = new.phone
     and r.created_at > now() - interval '1 day';

  if recent_count >= 5 then
    -- 화면에서 알아볼 수 있도록 약속된 문구를 사용
    raise exception 'DAILY_LIMIT_REACHED';
  end if;

  return new;
end
$$;

drop trigger if exists consult_reservations_rate_limit on public.consult_reservations;
create trigger consult_reservations_rate_limit
  before insert on public.consult_reservations
  for each row execute function public.limit_consult_per_phone();

commit;
