import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import "@/app/globals.css";
import { hasClerkKeys } from "@/lib/clerk-config";

export const metadata: Metadata = {
  title: {
    default: "Branzzo | Where Brands Meet Creators",
    template: "%s | Branzzo",
  },
  description:
    "India's creator economy marketplace for discovering creators, building creator profiles, and collecting collaboration requests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const html = (
    <html lang="en" className="dark">
      <body>
        <div aria-hidden="true" className="ambient-noise" />
        {children}
      </body>
    </html>
  );

  if (!hasClerkKeys()) return html;

  return (
    <ClerkProvider
      appearance={{
        elements: {
          cardBox:
            "text-[#f7f3ee] shadow-[0_24px_80px_rgba(0,0,0,0.36)]",
          card: "border border-[#2a3140] bg-[#11131a] text-[#f7f3ee]",
          headerTitle: "text-[#f7f3ee]",
          headerSubtitle: "text-[#abb5c7]",
          dividerLine: "bg-[#2a3140]",
          dividerText: "text-[#abb5c7]",
          formFieldLabel: "text-[#f7f3ee]",
          footer: "border-t border-[#2a3140] !bg-[#0d1118]",
          footerAction: "!bg-[#0d1118]",
          footerPages: "!bg-[#0d1118]",
          footerActionText: "text-[#abb5c7]",
          footerActionLink: "text-cyan-300 hover:text-cyan-200",
          formButtonPrimary:
            "bg-violet-600 shadow-[0_12px_28px_rgba(124,58,237,0.24)] hover:bg-violet-500",
          formFieldInput:
            "border-[#2a3140] bg-[#0b0f16] text-[#f7f3ee] focus:border-cyan-300",
          socialButtonsBlockButton:
            "border-[#2a3140] bg-white/[0.04] text-[#f7f3ee] hover:bg-white/[0.08]",
        },
      }}
    >
      {html}
    </ClerkProvider>
  );
}
