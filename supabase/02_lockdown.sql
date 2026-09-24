-- ============================================================
-- 2단계: 데이터베이스 잠그기 (새 코드가 Vercel 에 배포된 "직후"에 실행)
-- - 방문자: 사이트 내용 읽기 + 문의 글쓰기만 가능
-- - 관리자: 구글 로그인 + 자기에게 허락된 탭의 데이터만 수정 가능
-- - 관리자 명단: 슈퍼어드민만 보고 수정 가능
-- - 문의 게시판 비밀번호: 암호화해서 저장
-- 중간에 오류가 나면 전부 취소되고 원래 상태로 남습니다.
-- ============================================================
begin;

-- 1) 홈페이지 표 14개의 기존 "누구나 수정 가능" 규칙을 지우고 보안(RLS) 켜기 ------------
--    ※ portfolio_ 로 시작하는 표(다른 사이트)는 건드리지 않음
do $$
declare
  t   text;
  pol record;
begin
  foreach t in array array[
    'site_content', 'about_slides', 'instructors', 'hashtags', 'facilities',
    'lesson_schedules', 'tuition_info', 'gallery', 'contact_cards',
    'blog_links', 'blog_banners', 'graduates', 'board_posts', 'admin_users'
  ]
  loop
    for pol in
      select policyname from pg_policies
       where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;
    execute format('alter table public.%I enable row level security', t);
  end loop;
end
$$;

-- 2) 사이트 내용 표: 누구나 읽기 / 해당 탭 권한자만 수정 ------------------------
do $$
declare
  rule record;
begin
  for rule in
    select * from (values
      ('site_content',     'public.admin_can(''design'') or public.admin_can(''board'') or public.admin_can(''gallery'')'),
      ('about_slides',     'public.admin_can(''design'')'),
      ('instructors',      'public.admin_can(''design'')'),
      ('hashtags',         'public.admin_can(''design'')'),
      ('facilities',       'public.admin_can(''design'')'),
      ('lesson_schedules', 'public.admin_can(''lessons'')'),
      ('tuition_info',     'public.admin_can(''lessons'')'),
      ('gallery',          'public.admin_can(''gallery'')'),
      ('contact_cards',    'public.admin_can(''board'')'),
      ('blog_links',       'public.admin_can(''blog'')'),
      ('blog_banners',     'public.admin_can(''blog'')'),
      ('graduates',        'public.admin_can(''graduates'')')
    ) as v(tbl, cond)
  loop
    execute format(
      'create policy "누구나 읽기" on public.%I for select to anon, authenticated using (true)',
      rule.tbl);
    execute format(
      'create policy "권한 있는 관리자만 수정" on public.%I for all to authenticated using (%s) with check (%s)',
      rule.tbl, rule.cond, rule.cond);
  end loop;
end
$$;

-- 3) 문의 게시판 ---------------------------------------------------------
--    방문자는 글쓰기만 (답변을 위조해서 넣을 수 없음). 목록/열람은 board_list, board_open 함수로만.
create policy "방문자 글쓰기" on public.board_posts
  for insert to anon, authenticated
  with check (coalesce(is_replied, false) = false and admin_reply is null);

create policy "문의 관리자만 관리" on public.board_posts
  for all to authenticated
  using (public.admin_can('board'))
  with check (public.admin_can('board'));

-- 비밀번호 암호화: 새 글은 자동 암호화, 기존 글도 지금 암호화 (4자리 비밀번호는 그대로 사용 가능)
create or replace function public.board_hash_password()
returns trigger
language plpgsql security definer
set search_path = extensions, public, pg_temp
as $$
begin
  if new.password is not null and new.password not like '$2%' then
    new.password := crypt(new.password, gen_salt('bf'));
  end if;
  return new;
end
$$;

drop trigger if exists board_posts_hash_password on public.board_posts;
create trigger board_posts_hash_password
  before insert or update of password on public.board_posts
  for each row execute function public.board_hash_password();

update public.board_posts set password = password
 where password is not null and password not like '$2%';

-- 4) 관리자 명단: 슈퍼어드민만 ----------------------------------------------
create policy "슈퍼어드민만 관리" on public.admin_users
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- 슈퍼어드민 보호: 삭제·강등·비활성·메일 변경 금지, 새 슈퍼어드민 생성 금지
create or replace function public.protect_super_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.level = 1 then
      raise exception '슈퍼어드민은 삭제할 수 없어요.';
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' and new.level <> 2 then
    raise exception '새 관리자는 Lv.2 로만 추가할 수 있어요.';
  end if;

  if tg_op = 'UPDATE' then
    if old.level = 1 and (new.level <> 1 or not new.is_active
                          or lower(new.email) is distinct from lower(old.email)) then
      raise exception '슈퍼어드민의 레벨·상태·메일은 바꿀 수 없어요.';
    end if;
    if old.level <> 1 and new.level = 1 then
      raise exception '슈퍼어드민은 한 명만 둘 수 있어요.';
    end if;
  end if;

  new.email := lower(trim(new.email));
  return new;
end
$$;

drop trigger if exists admin_users_protect_super on public.admin_users;
create trigger admin_users_protect_super
  before insert or update or delete on public.admin_users
  for each row execute function public.protect_super_admin();

-- 5) 사진 보관함(images): 누구나 보기(공개 주소) / 관리자만 올리기·지우기 ----------
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       -- 'images' 보관함 규칙만 (portfolio-images 규칙은 건드리지 않음)
       and (coalesce(qual, '') like '%''images''%' or coalesce(with_check, '') like '%''images''%')
  loop
    execute format('drop policy %I on storage.objects', pol.policyname);
  end loop;
end
$$;

create policy "images 관리자 조회" on storage.objects
  for select to authenticated
  using (bucket_id = 'images' and public.is_admin());
create policy "images 관리자 업로드" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'images' and public.is_admin());
create policy "images 관리자 수정" on storage.objects
  for update to authenticated
  using (bucket_id = 'images' and public.is_admin())
  with check (bucket_id = 'images' and public.is_admin());
create policy "images 관리자 삭제" on storage.objects
  for delete to authenticated
  using (bucket_id = 'images' and public.is_admin());

commit;
