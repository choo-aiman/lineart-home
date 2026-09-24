@AGENTS.md

# 라인아트 미술학원 홈페이지 — Claude 작업 규칙

전북 전주 만화·애니메이션 입시 미술학원 홈페이지입니다.
GitHub: `choo-aiman/lineart-home` · 배포: Vercel · 데이터: Supabase

## 사용자에 대해
- 사용자는 **'우주T'**라고 부르세요. 학원의 전임 강사 중 한 명이며(대표 아님), 이 사이트의 **유일한 슈퍼 어드민**입니다.
- 비개발자입니다. 코드를 직접 쓰지 않고, 화면을 보며 요청합니다.
- **보안이 최우선입니다.** 앞으로 입시 관리 시스템(학생 개인정보)까지 이 사이트에 들어갈 예정입니다.
- 항상 **한국어**로, 전문용어는 쉬운 말로 풀어서 설명하세요. (예: "컴포넌트" → "화면 조각")
- 작업이 끝나면 **무엇을, 어느 파일에서, 왜** 바꿨는지 3줄 이내로 요약하세요.
- 확인할 방법을 알려주세요. (예: "브라우저에서 새로고침 후 맨 위를 보세요")

## 작업 방식
- **작게, 한 번에 하나씩.** 요청받은 것만 바꾸고, 요청하지 않은 파일은 건드리지 마세요.
- 여러 파일을 크게 바꾸거나 새 패키지를 설치해야 하면 **먼저 계획을 말하고 허락을 받으세요.**
- 요청이 모호하면 추측해서 크게 바꾸지 말고, 선택지 2~3개를 짧게 물어보세요.
- **개발 서버(npm run dev)는 사용자가 직접 켜 둡니다.** 직접 실행하지 마세요. 확인이 필요하면 `npm run build` 나 `npm run lint` 를 쓰세요.
- `node_modules`, `.next` 폴더는 읽지 마세요. (사용량 낭비. 단, AGENTS.md 가 말하는 Next.js 문서 `node_modules/next/dist/docs/` 는 필요한 부분만 읽어도 됩니다)
- 데이터베이스 구조(표, 보안 규칙)를 바꿔야 하면 SQL 을 `supabase/` 폴더에 파일로 남기고, 사용자가 Supabase 화면에서 실행하도록 안내하세요.

## 절대 하지 말 것
- `.env.local` 파일을 읽거나, 내용을 화면에 출력하거나, 수정하지 마세요. (비밀 키)
- 비밀 키를 코드에 직접 적지 마세요. 브라우저로 가는 코드에는 `NEXT_PUBLIC_` 으로 시작하는 공개 값만 쓸 수 있습니다.
- 관리자 권한 확인을 브라우저에서만 하지 마세요. 권한 확인은 반드시 **서버**(와 Supabase 보안 규칙)에서 해야 합니다.
- 비밀번호·접속 코드 같은 비밀 값을 방문자 브라우저로 보내지 마세요.
- 사용자가 요청하지 않은 파일 삭제, `git push`, `git reset --hard` 를 하지 마세요.

## 프로젝트 지도 (어디에 무엇이 있나)
| 바꾸고 싶은 것 | 파일 |
|---|---|
| 홈 화면 섹션 순서 | `app/page.tsx` |
| 학원소개 / 수업안내 / 갤러리 / 블로그 / 문의 페이지 | `app/about`, `app/lessons`, `app/gallery`, `app/blog`, `app/contact` 의 `page.tsx` |
| 사이트 제목, 폰트 불러오기, 전체 공통 틀 | `app/layout.tsx` |
| 상단 메뉴 (만화애니 ↔ 순수미술 전환 포함) | `components/Nav.jsx` |
| 하단 푸터 (관리자 접속 입구 포함) | `components/Footer.tsx` |
| 각 섹션 모양 | `components/*Section.tsx`, `ClassCards`, `StatsBanner`, `GraduatesGraph`, `BlogBanner` |
| 관리자 페이지 틀과 탭 목록 | `app/admin/page.tsx` 의 `ALL_TABS` |
| 관리자 탭별 화면 | `components/admin/Admin*.tsx` |
| Supabase 연결 | `lib/supabase.js` |
| 이미지 주소 허용 설정 | `next.config.ts` |

### 화면 모드
- 사이트는 `mode` 값으로 두 가지 모습을 보여줍니다: `ani`(만화·애니메이션), `fine`(순수미술).
- 주소 뒤에 `?mode=fine` 처럼 붙어서 페이지를 넘어가도 유지됩니다. 새 섹션도 `mode` 를 받아 두 모드를 모두 고려하세요.

### 데이터베이스 표 (Supabase)
`site_content`(홈·소개 문구), `about_slides`, `instructors`, `facilities`, `lesson_schedules`, `tuition_info`,
`hashtags`, `gallery`, `blog_links`, `blog_banners`, `board_posts`(문의 게시판), `contact_cards`, `graduates`(합격자), `admin_users`(관리자)
- 사진 파일은 Supabase Storage 의 `images` 보관함에 저장합니다.

### 사용하지 않는 것으로 보이는 파일 (지우기 전 사용자 확인)
`components/admin/AdminPanel.tsx`, `components/admin/AdminLogin.tsx`, `components/admin/tabs/AdminUsers.tsx`

## 관리자 권한 구조
- 로그인은 **구글 로그인**(Supabase Auth, PKCE)만 사용합니다. 접속 코드 방식은 폐지했습니다.
- `admin_users` 표의 `email` 에 등록된 구글 계정만 관리자입니다. 로그인 후 DB 함수 `admin_whoami()` 로 확인합니다.
- **슈퍼 어드민(level 1)은 우주T 1명뿐**입니다. 관리자 추가·삭제·권한 변경은 슈퍼 어드민만 가능합니다. (DB 규칙 + 트리거로 강제)
- 다른 관리자(level 2)의 직책(`role`): 원장, 전임 강사, 준전임 강사, 보조 강사 등. 직책은 이름표일 뿐이고,
  **실제 권한은 `permissions`(탭 키를 쉼표로 나열)로 슈퍼 어드민이 사람마다 정합니다.**
- 권한의 진짜 문지기는 **Supabase 보안 규칙(RLS)** 입니다. 화면에서 탭을 숨기는 건 편의용일 뿐입니다.
  - DB 함수: `admin_can('탭키')`, `is_admin()`, `is_super_admin()` — 정의는 `supabase/01_google_admin_prepare.sql`
  - 표별 규칙: `supabase/02_lockdown.sql` (표 ↔ 탭 권한 연결표가 여기 있음)
- **새 관리자 탭을 만들면**: `app/admin/page.tsx` 의 `ALL_TABS`, `components/admin/AdminUsers.tsx` 의 `PERMISSION_TABS`,
  그리고 새 SQL 파일로 해당 표의 RLS 규칙까지 반드시 같이 추가하세요.
- **새 표를 만들면** 반드시 RLS 를 켜고 규칙을 같이 작성하세요. 학생 정보 같은 민감한 표는 "누구나 읽기" 규칙을 절대 넣지 마세요.
- 문의 게시판 목록·열람은 DB 함수 `board_list()`, `board_open(id, 비밀번호)` 로만 합니다. 비밀번호는 암호화되어 저장됩니다.

## 디자인 규칙
- 지금은 색·글꼴이 각 화면 조각 안에 `style={{ ... }}` 로 직접 적혀 있습니다. 새로 만드는 부분도 **주변 코드와 같은 방식**으로 맞추세요.
- 주로 쓰는 값: 메인 분홍 `#FF1659`, 남색 `#515883`, 검정 `#1A1A1A`, 회색 배경 `#F5F5F5`, 글꼴 `Pretendard`, 제목용 `Black Han Sans`.
- 색을 한 곳(`app/globals.css`)으로 모으는 정리는 사용자가 요청할 때 **섹션 하나씩** 진행하세요.
- 모바일(390px)과 데스크톱(1440px) 모두에서 깨지지 않게 만드세요.

## 기술 스택
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase + Vercel
- 경로 별칭: `@/` = 프로젝트 최상위 폴더
- 드래그로 순서 바꾸기: `@dnd-kit`

## 배포 전 확인
- `npm run build` 가 에러 없이 끝나는지 확인하세요.
- Vercel 에 `.env.local` 과 같은 환경변수가 등록돼 있어야 한다고 알려주세요.
