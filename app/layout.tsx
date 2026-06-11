import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "BizCopilot — Business Document Intelligence",
  description:
    "Upload any business document. Get instant analysis, action items, and risk flags. Chat with your documents.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
