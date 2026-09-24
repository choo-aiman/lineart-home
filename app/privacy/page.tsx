// 개인정보처리방침 페이지
// 이유: 구글 로그인(OAuth) 앱 게시에 필요 + 문의 게시판에서 개인정보를 받고 있어 실제로도 필요

'use client';

import { useRouter } from 'next/navigation';

const UPDATED_AT = '2026년 9월 25일';

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '1. 수집하는 정보',
    body: [
      '문의 게시판 이용 시: 닉네임, 게시글 비밀번호(암호화하여 저장), 문의 내용',
      '관리자 로그인 시: 구글 계정의 이메일 주소와 이름',
      '그 밖에 회원가입이나 별도의 개인정보 수집은 하지 않습니다.',
    ],
  },
  {
    title: '2. 이용 목적',
    body: [
      '문의에 대한 답변 및 상담 안내',
      '관리자 본인 확인과 권한 관리',
    ],
  },
  {
    title: '3. 보관 기간과 파기',
    body: [
      '문의 게시글은 학원이 삭제하거나 작성자가 삭제를 요청할 때까지 보관합니다.',
      '관리자 정보는 해당 관리자의 권한이 해제될 때 삭제합니다.',
    ],
  },
  {
    title: '4. 제3자 제공 및 처리 위탁',
    body: [
      '수집한 정보를 제3자에게 판매하거나 제공하지 않습니다.',
      '서비스 운영을 위해 다음 업체에 처리를 위탁합니다. Supabase(데이터 보관), Vercel(웹사이트 호스팅), Google(관리자 로그인 인증).',
    ],
  },
  {
    title: '5. 이용자의 권리',
    body: [
      '본인이 작성한 문의글의 열람·수정·삭제를 요청할 수 있습니다.',
      '아래 연락처로 요청하시면 확인 후 처리해 드립니다.',
    ],
  },
  {
    title: '6. 브라우저 저장 정보',
    body: [
      '관리자 로그인 상태를 유지하기 위해 브라우저 저장 공간을 사용합니다.',
      '방문자를 추적하는 광고용 쿠키는 사용하지 않습니다.',
    ],
  },
  {
    title: '7. 문의처',
    body: [
      '라인아트 미술학원',
      '전북 전주시 완산구 충경로 75 3층',
      '063-283-7771',
    ],
  },
];

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 20px 80px' }}>
        <h1 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(24px, 2vw, 32px)', fontWeight: 900, color: '#1A1A1A', marginBottom: '8px' }}>
          개인정보처리방침
        </h1>
        <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#888', marginBottom: '40px' }}>
          시행일: {UPDATED_AT}
        </p>

        {SECTIONS.map((section) => (
          <section key={section.title} style={{ marginBottom: '32px' }}>
            <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '17px', fontWeight: 700, color: '#1A1A1A', marginBottom: '12px' }}>
              {section.title}
            </h2>
            {section.body.map((line) => (
              <p
                key={line}
                style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', lineHeight: 1.8, color: '#555', marginBottom: '6px' }}
              >
                {line}
              </p>
            ))}
          </section>
        ))}

        <button
          onClick={() => router.push('/')}
          style={{
            marginTop: '20px',
            fontFamily: "'Pretendard', sans-serif",
            fontSize: '14px',
            color: '#888',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          메인으로 돌아가기
        </button>
      </div>
    </main>
  );
}
