-- ============================================================
-- 0단계: 현재 데이터베이스 보안 상태 점검 (읽기 전용 — 아무것도 바꾸지 않음)
-- Supabase > SQL Editor 에 통째로 붙여넣고 Run → 결과 표를 캡처해서 Claude 에게 보여주세요.
-- 관리자 접속 코드 같은 비밀 값은 출력하지 않습니다.
-- ============================================================

select '1_표' as 구분, c.relname::text as 이름,
       case when c.relrowsecurity then 'RLS 켜짐' else 'RLS 꺼짐' end as 내용
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'

union all
select '2_규칙', schemaname || '.' || tablename || ' / ' || policyname,
       cmd || ' / ' || array_to_string(roles, ',') ||
       ' / using: ' || coalesce(qual, '-') || ' / check: ' || coalesce(with_check, '-')
from pg_policies
where schemaname in ('public', 'storage')

union all
select '3_관리자표_칸', column_name::text,
       data_type || ' / null허용:' || is_nullable || ' / 기본값:' || coalesce(column_default, '-')
from information_schema.columns
where table_schema = 'public' and table_name = 'admin_users'

union all
select '4_관리자_수', 'level ' || level::text, count(*)::text || '명'
from public.admin_users
group by level

union all
select '5_게시판_칸', column_name::text, data_type || ' / null허용:' || is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'board_posts'

union all
select '6_사진보관함', id::text, case when public then '공개' else '비공개' end
from storage.buckets

union all
select '7_확장기능', extname::text, extversion
from pg_extension
where extname = 'pgcrypto'

union all
select '8_함수', p.proname::text, ''
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'

order by 1, 2;
