import { Geist, Geist_Mono, Manrope } from "next/font/google";

import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--marketing-font-display",
});

const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--marketing-font-body",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--marketing-font-mono",
});

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${manrope.variable} ${geistSans.variable} ${geistMono.variable} marketing-shell`}>
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
