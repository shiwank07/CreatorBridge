import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import "@/app/globals.css";
import { hasClerkKeys } from "@/lib/clerk-config";

export const metadata: Metadata = {
  title: {
    default: "CreatorBridge | Where Brands Meet Creators",
    template: "%s | CreatorBridge",
  },
  description:
    "India's creator economy marketplace for discovering creators, building creator profiles, and collecting brand campaign inquiries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const html = (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );

  if (!hasClerkKeys()) return html;

  return (
    <ClerkProvider>
      {html}
    </ClerkProvider>
  );
}
