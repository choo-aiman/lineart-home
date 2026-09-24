-- ============================================================
-- 1단계: 구글 로그인 준비 (지금 운영 중인 사이트에는 영향 없음)
-- - 관리자 표에 '구글 이메일', '직책' 칸 추가 (기존 데이터는 그대로)
-- - 권한 확인 함수, 문의 게시판용 안전한 조회 함수 추가
-- 슈퍼어드민(우주T): c55024141@gmail.com
-- ============================================================

-- 1) 관리자 표에 칸 추가 -------------------------------------------------
alter table public.admin_users add column if not exists email text;
alter table public.admin_users add column if not exists role  text;
alter table public.admin_users alter column code drop not null;  -- 새 관리자는 접속 코드가 필요 없음

-- 같은 구글 메일은 한 번만 등록 가능
create unique index if not exists admin_users_email_key
  on public.admin_users (lower(email));

-- 슈퍼어드민(level 1)은 딱 한 명만 존재 가능
create unique index if not exists admin_users_single_super
  on public.admin_users ((level)) where level = 1;

-- 2) 슈퍼어드민(우주T) 구글 메일 등록 ----------------------------------------
update public.admin_users
   set email = lower('c55024141@gmail.com'),
       role  = coalesce(role, '전임 강사')
 where level = 1;

-- 3) 권한 확인 함수 ------------------------------------------------------
-- 로그인한 사람의 구글 메일 (구글로 가입 + 메일 인증된 계정만 인정)
create or replace function public.current_admin_email()
returns text
language sql stable security definer
set search_path = ''
as $$
  select lower(u.email)
    from auth.users u
   where u.id = auth.uid()
     and u.email_confirmed_at is not null
     and u.raw_app_meta_data ->> 'provider' = 'google'
$$;

-- 활성화된 관리자인가?
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a
     where lower(a.email) = public.current_admin_email()
       and a.is_active
  )
$$;

-- 슈퍼어드민인가?
create or replace function public.is_super_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a
     where lower(a.email) = public.current_admin_email()
       and a.is_active
       and a.level = 1
  )
$$;

-- 특정 관리자 탭 권한이 있는가? (슈퍼어드민은 전부 가능)
create or replace function public.admin_can(perm text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a
     where lower(a.email) = public.current_admin_email()
       and a.is_active
       and (
         a.level = 1
         or a.permissions = 'all'
         or perm = any (string_to_array(replace(coalesce(a.permissions, ''), ' ', ''), ','))
       )
  )
$$;

-- 로그인 직후 "나는 누구?" 확인 + 최근 접속 시간 기록
create or replace function public.admin_whoami()
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  r public.admin_users;
begin
  select * into r
    from public.admin_users a
   where lower(a.email) = public.current_admin_email()
     and a.is_active
   limit 1;
  if not found then
    return null;
  end if;
  update public.admin_users set last_login = now() where id = r.id;
  return json_build_object(
    'id', r.id, 'name', r.name, 'email', r.email, 'role', r.role,
    'level', r.level, 'permissions', r.permissions
  );
end
$$;

revoke all on function public.current_admin_email() from public, anon;
revoke all on function public.is_admin()            from public, anon;
revoke all on function public.is_super_admin()      from public, anon;
revoke all on function public.admin_can(text)       from public, anon;
revoke all on function public.admin_whoami()        from public, anon;
grant execute on function public.current_admin_email() to authenticated;
grant execute on function public.is_admin()            to authenticated;
grant execute on function public.is_super_admin()      to authenticated;
grant execute on function public.admin_can(text)       to authenticated;
grant execute on function public.admin_whoami()        to authenticated;

-- 4) 문의 게시판: 비밀번호를 브라우저로 보내지 않는 조회 함수 --------------------
create extension if not exists pgcrypto with schema extensions;  -- 비밀번호 암호화 도구

-- 목록: 비밀글이거나 답변 전인 글은 본문·답변을 비워서 보냄 (기존 화면 규칙과 동일)
create or replace function public.board_list()
returns setof json
language sql stable security definer
set search_path = ''
as $$
  select json_build_object(
           'id', p.id, 'created_at', p.created_at, 'mode', p.mode,
           'title', p.title, 'nickname', p.nickname,
           'is_replied', p.is_replied, 'is_secret', p.is_secret,
           'content',     case when not coalesce(p.is_secret, false) and coalesce(p.admin_reply, '') <> '' then p.content end,
           'admin_reply', case when not coalesce(p.is_secret, false) and coalesce(p.admin_reply, '') <> '' then p.admin_reply end
         )
    from public.board_posts p
   order by p.created_at desc
$$;

-- 글 열기: 비밀번호가 맞을 때만 본문·답변을 돌려줌 (틀리면 1초 지연 → 마구 대입 방지)
create or replace function public.board_open(p_id bigint, p_password text)
returns json
language plpgsql volatile security definer
set search_path = extensions, public, pg_temp  -- 암호화 도구(pgcrypto) 위치가 어느 쪽이든 찾도록
as $$
declare
  r record;
  ok boolean;
begin
  select p.content, p.admin_reply, p.password into r
    from public.board_posts p
   where p.id = p_id;
  if not found or r.password is null or p_password is null then
    perform pg_sleep(1);
    return null;
  end if;

  if r.password like '$2%' then
    ok := r.password = crypt(p_password, r.password);  -- 암호화된 비밀번호
  else
    ok := r.password = p_password;                                -- 예전 방식(암호화 전)
  end if;

  if ok then
    return json_build_object('content', r.content, 'admin_reply', r.admin_reply);
  end if;
  perform pg_sleep(1);
  return null;
end
$$;

revoke all on function public.board_list()              from public;
revoke all on function public.board_open(bigint, text)  from public;
grant execute on function public.board_list()             to anon, authenticated;
grant execute on function public.board_open(bigint, text) to anon, authenticated;
