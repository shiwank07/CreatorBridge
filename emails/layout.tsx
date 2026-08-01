/* eslint-disable @next/next/no-head-element, @next/next/no-img-element -- This file renders standalone HTML email markup, not a Next.js page. */
import type { CSSProperties, ReactNode } from "react";
import { resolveEmailLogoUrl } from "@/lib/email/email-config";

export type HaloEmailCta = {
  label: string;
  href: string;
};

export type HaloEmailLayoutProps = {
  preview: string;
  eyebrow: string;
  title: string;
  cta: HaloEmailCta;
  children: ReactNode;
};

export type EmailDetailItem = {
  label: string;
  value?: string | number | null;
};

const bodyStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  backgroundColor: "#f4f1f8",
  color: "#251c31",
  fontFamily: "Inter, Segoe UI, Arial, sans-serif",
};

const shellStyle: CSSProperties = {
  width: "100%",
  backgroundColor: "#f4f1f8",
  padding: "32px 12px",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 600,
  backgroundColor: "#ffffff",
  border: "1px solid #e5dff0",
  borderRadius: 12,
  overflow: "hidden",
};

const contentStyle: CSSProperties = {
  padding: "40px 36px 32px",
};

const accentStyle: CSSProperties = {
  height: 4,
  backgroundColor: "#8b5cf6",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 14px",
  color: "#6d28d9",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0,
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "0 0 18px",
  color: "#24152f",
  fontSize: 32,
  lineHeight: "40px",
  fontWeight: 800,
  letterSpacing: 0,
};

const textStyle: CSSProperties = {
  margin: "0 0 16px",
  color: "#51475d",
  fontSize: 16,
  lineHeight: "26px",
};

const ctaWrapStyle: CSSProperties = {
  paddingTop: 14,
  paddingBottom: 8,
};

const ctaStyle: CSSProperties = {
  display: "inline-block",
  backgroundColor: "#8b5cf6",
  color: "#ffffff",
  borderRadius: 8,
  padding: "16px 24px",
  fontSize: 15,
  lineHeight: "20px",
  fontWeight: 700,
  textDecoration: "none",
};

const footerStyle: CSSProperties = {
  padding: "22px 36px 34px",
  borderTop: "1px solid #e9e3f0",
  color: "#71677d",
  fontSize: 13,
  lineHeight: "20px",
  textAlign: "center",
};

const preheaderStyle: CSSProperties = {
  display: "none",
  maxHeight: 0,
  overflow: "hidden",
  opacity: 0,
  color: "transparent",
  lineHeight: "1px",
};

export function EmailText({ children }: { children: ReactNode }) {
  return <p style={textStyle}>{children}</p>;
}

export function EmailBenefits({ items }: { items: string[] }) {
  return (
    <table role="presentation" cellPadding="0" cellSpacing="0" width="100%" style={{ margin: "20px 0 4px" }}>
      <tbody>
        {items.map((item) => (
          <tr key={item}>
            <td
              aria-hidden="true"
              style={{
                width: 22,
                padding: "5px 10px 5px 0",
                color: "#6d28d9",
                fontSize: 15,
                lineHeight: "22px",
                fontWeight: 700,
                verticalAlign: "top",
              }}
            >
              ✓
            </td>
            <td style={{ padding: "5px 0", color: "#51475d", fontSize: 15, lineHeight: "22px", verticalAlign: "top" }}>
              {item}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function EmailDetails({ items }: { items: EmailDetailItem[] }) {
  const visibleItems = items.filter((item) => item.value !== undefined && item.value !== null && String(item.value).trim());
  if (!visibleItems.length) return null;

  return (
    <table role="presentation" cellPadding="0" cellSpacing="0" width="100%" style={{ margin: "22px 0" }}>
      <tbody>
        {visibleItems.map((item) => (
          <tr key={item.label}>
            <td
              style={{
                width: "34%",
                padding: "12px 0",
                borderTop: "1px solid #e9e3f0",
                color: "#71677d",
                fontSize: 13,
                lineHeight: "20px",
                verticalAlign: "top",
              }}
            >
              {item.label}
            </td>
            <td
              style={{
                padding: "12px 0 12px 16px",
                borderTop: "1px solid #e9e3f0",
                color: "#251c31",
                fontSize: 14,
                lineHeight: "22px",
                verticalAlign: "top",
                wordBreak: "break-word",
              }}
            >
              {item.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function HaloEmailLayout({ preview, eyebrow, title, cta, children }: HaloEmailLayoutProps) {
  let publicLogoUrl = "";
  try { publicLogoUrl = resolveEmailLogoUrl(); } catch { /* Text fallback keeps local previews usable. */ }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          {`
            @media only screen and (max-width: 620px) {
              .halo-shell { padding: 18px 10px !important; }
              .halo-card { max-width: 100% !important; }
              .halo-content { padding: 30px 22px 24px !important; }
              .halo-footer { padding: 20px 22px 28px !important; }
              .halo-title { font-size: 26px !important; line-height: 34px !important; }
              .halo-button { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
            }
          `}
        </style>
      </head>
      <body style={bodyStyle}>
        <div style={preheaderStyle}>{preview}</div>
        <table role="presentation" cellPadding="0" cellSpacing="0" width="100%" className="halo-shell" style={shellStyle}>
          <tbody>
            <tr>
              <td align="center">
                <table role="presentation" cellPadding="0" cellSpacing="0" width="100%" className="halo-card" style={cardStyle}>
                  <tbody>
                    <tr>
                      <td style={accentStyle} />
                    </tr>
                    <tr>
                      <td className="halo-content" style={contentStyle}>
                        {publicLogoUrl ? (
                          <img src={publicLogoUrl} width="48" height="48" alt="Branzzo logo" style={{ display: "block", margin: "0 0 14px", borderRadius: 8 }} />
                        ) : (
                          <p style={eyebrowStyle}>Branzzo</p>
                        )}
                        <p style={eyebrowStyle}>{eyebrow}</p>
                        <h1 className="halo-title" style={titleStyle}>
                          {title}
                        </h1>
                        {children}
                        <div style={ctaWrapStyle}>
                          <a className="halo-button" href={cta.href} style={ctaStyle}>
                            {cta.label}
                          </a>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="halo-footer" style={footerStyle}>
                        <a href="https://branzzo.com" style={{ color: "#6d28d9" }}>branzzo.com</a>
                        {" · "}
                        <a href="mailto:support@branzzo.com" style={{ color: "#6d28d9" }}>support@branzzo.com</a>
                        <br />
                        Helping creators and brands build better partnerships.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
