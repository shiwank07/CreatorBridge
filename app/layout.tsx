import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import "@/app/globals.css";
import { hasClerkKeys } from "@/lib/clerk-config";
import { GLOBAL_STRUCTURED_DATA, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, SOCIAL_IMAGE } from "@/lib/seo";

export const viewport = {
  themeColor: "#05050d",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  category: "business",
  creator: SITE_NAME,
  publisher: SITE_NAME,
  title: { default: SITE_TITLE, template: "%s | Branzzo" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icons/icon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#8b5cf6" }],
  },
  appleWebApp: { title: SITE_NAME, capable: true, statusBarStyle: "black-translucent" },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [{ url: SOCIAL_IMAGE, width: 1200, height: 630, alt: "Branzzo creator marketplace for brands and creators" }],
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION, images: [SOCIAL_IMAGE] },
  manifest: "/manifest.webmanifest",
  other: { "msapplication-config": "/browserconfig.xml", "msapplication-TileColor": "#05050d" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const html = (
    <html lang="en" className="dark">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: GLOBAL_STRUCTURED_DATA,
          }}
        />
        <div aria-hidden="true" className="ambient-noise" />
        {children}
      </body>
    </html>
  );

  if (!hasClerkKeys()) return html;

  return (
    <ClerkProvider
      localization={{
        signIn: {
          start: {
            title: "Sign in to Branzzo",
          },
        },
        signUp: {
          start: {
            title: "Create your Branzzo account",
          },
        },
        unstable__errors: {
          form_password_length_too_short: "Use at least 8 characters.",
          form_password_not_strong_enough:
            "Choose a less predictable password that does not use your name, email, common words, or familiar patterns.",
          form_password_pwned:
            "This password appears in a known data breach. Choose a unique password you do not use elsewhere.",
          form_password_validation_failed:
            "This password does not meet the security requirements. Avoid personal information, common passwords, and predictable patterns.",
          form_password_incorrect: "The password is incorrect. Try again or reset your password.",
        },
      }}
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
