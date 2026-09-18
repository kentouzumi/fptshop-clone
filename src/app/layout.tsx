import type { Metadata } from "next";
import { Unbounded, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CompareProvider } from "@/components/CompareProvider";
import CompareFloatingBar from "@/components/CompareFloatingBar";
import "./globals.css";

const displayFont = Unbounded({
  variable: "--font-display-src",
  subsets: ["vietnamese", "latin"],
  weight: ["600", "700", "800"],
});

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-sans-src",
  subsets: ["vietnamese", "latin"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono-src",
  subsets: ["vietnamese", "latin"],
});

export const metadata: Metadata = {
  title: "FPT Shop Clone",
  description: "Website thương mại điện tử clone chức năng FPT Shop",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50">
        <CompareProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CompareFloatingBar />
        </CompareProvider>
      </body>
    </html>
  );
}
