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
  title: "상세페이지 에디터",
  description: "Figma-like detail page editor",
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
