import { Geist, Geist_Mono, Manrope } from "next/font/google";

import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { Footer } from "@/components/shared/footer";

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
      <MarketingNavbar />
      {children}
      <Footer />
    </div>
  );
}
