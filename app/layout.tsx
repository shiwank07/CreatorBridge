import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import "@/app/globals.css";
import { hasClerkKeys } from "@/lib/clerk-config";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://branzzo.com"),
  applicationName: "Branzzo",
  title: {
    default: "Branzzo | Where Brands Meet Creators",
    template: "%s | Branzzo",
  },
  description:
    "India's creator economy marketplace for discovering creators, building creator profiles, and collecting collaboration requests.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  appleWebApp: {
    title: "Branzzo",
    capable: true,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Branzzo | Where Brands Meet Creators",
    description: "Discover creators, build trusted partnerships, and manage brand collaborations in one place.",
    siteName: "Branzzo",
    type: "website",
    images: [{ url: "/branding/branzzo-og.png", width: 1200, height: 630, alt: "Branzzo — Where Brands Meet Creators" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Branzzo | Where Brands Meet Creators",
    description: "Discover creators, build trusted partnerships, and manage brand collaborations in one place.",
    images: ["/branding/branzzo-og.png"],
  },
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
