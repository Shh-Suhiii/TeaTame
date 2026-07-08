import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TeaTame",
    template: "%s | TeaTame",
  },
  description:
    "Spill the tea anonymously. Share thoughts, confessions, stories, and moments without revealing your identity.",
  applicationName: "TeaTame",
  keywords: [
    "TeaTame",
    "anonymous social app",
    "anonymous confessions",
    "anonymous chat",
    "social platform",
  ],
  metadataBase: new URL("https://teatame.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0c0611] text-white flex flex-col overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
