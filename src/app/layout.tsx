import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { buildGoogleFontsURL, getExternalFontCDNUrls } from "@/constants/fonts";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "크리에이티브 스튜디오",
  description: "상세페이지 · 폰트 디자인 · 사진 콘텐츠를 한곳에서",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Load all Korean Google Fonts CSS (lightweight — actual fonts loaded on-demand) */}
        <link rel="stylesheet" href={buildGoogleFontsURL()} />
        {/* Load external CDN fonts (Pretendard, Spoqa Han Sans Neo, D2Coding) */}
        {getExternalFontCDNUrls().map((url) => (
          <link key={url} rel="stylesheet" href={url} />
        ))}
      </head>
      <body className={`${notoSansKR.variable} ${notoSansKR.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
