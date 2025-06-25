import type { Metadata } from "next";
import localFont from "next/font/local";
import "../styles/globals.css";

const clashGrotesk = localFont({
  src: "../../public/fonts/ClashGrotesk-Variable.woff2",
  variable: "--font-clash-grotesk",
  display: "swap",
});

const uncutSans = localFont({
  src: [
    {
      path: "../../public/fonts/uncut/woff2/UncutSans-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/uncut/woff2/UncutSans-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/uncut/woff2/UncutSans-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/uncut/woff2/UncutSans-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-uncut-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bloom-ai-gaming.vercel.app'),
  title: "Bloom AI",
  description: "Real-time AI moderation for safer, positive gaming communities.",
  icons: {
    icon: "/icons/bloom-logo.svg",
    shortcut: "/icons/bloom-logo.svg",
    apple: "/icons/bloom-logo.svg",
  },
  openGraph: {
    title: "Bloom AI",
    description: "Real-time AI moderation for safer, positive gaming communities.",
    url: "https://bloom-ai-gaming.vercel.app",
    siteName: "Bloom AI",
    images: [
      {
        url: "/thumbnail.png",
        width: 1200,
        height: 630,
        alt: "Bloom AI - Keep Your Gaming Community Safe & Positive",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bloom AI",
    description: "Real-time AI moderation for safer, positive gaming communities.",
    images: ["/thumbnail.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${clashGrotesk.variable} ${uncutSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
