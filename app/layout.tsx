// layout.tsx에 Footer 컴포넌트 추가 + viewport 스케일 0.9 적용
// 이유: 푸터 전역 삽입 + 브라우저 기본 비율을 110% 느낌으로 조정

import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "라인아트 미술학원",
  description: "전북 전주 만화·애니메이션 전문 입시 미술학원",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=0.9" />
        <link
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Pretendard:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}