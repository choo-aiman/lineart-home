import type { Metadata } from "next";
import { Black_Han_Sans } from "next/font/google";
import "./globals.css";

// Black Han Sans — 학원 이름 로고에 사용
const blackHanSans = Black_Han_Sans({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-black-han-sans",
});

export const metadata: Metadata = {
  title: "라인아트 미술학원",
  description: "전북 전주 만화·애니 & 회화 입시 전문 미술학원",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${blackHanSans.variable} h-full antialiased`}
    >
      <head>
        {/* Pretendard — Bold(700)와 Medium(500)으로 사용 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css"
        />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "'Pretendard', sans-serif", fontWeight: 500 }}
      >
        {children}
      </body>
    </html>
  );
}