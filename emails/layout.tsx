/* eslint-disable @next/next/no-head-element -- This file renders standalone HTML email markup, not a Next.js page. */
import type { CSSProperties, ReactNode } from "react";

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
  backgroundColor: "#0b0912",
  color: "#f7f3ff",
  fontFamily: "Inter, Segoe UI, Arial, sans-serif",
};

const shellStyle: CSSProperties = {
  width: "100%",
  backgroundColor: "#0b0912",
  padding: "32px 12px",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 600,
  backgroundColor: "#151020",
  border: "1px solid #2a1c3d",
  borderRadius: 8,
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
  color: "#c4b5fd",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0,
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "0 0 18px",
  color: "#ffffff",
  fontSize: 32,
  lineHeight: "40px",
  fontWeight: 800,
  letterSpacing: 0,
};

const textStyle: CSSProperties = {
  margin: "0 0 16px",
  color: "#ded7eb",
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
  borderRadius: 6,
  padding: "14px 20px",
  fontSize: 15,
  lineHeight: "20px",
  fontWeight: 700,
  textDecoration: "none",
};

const footerStyle: CSSProperties = {
  padding: "22px 36px 34px",
  borderTop: "1px solid #251936",
  color: "#9f94b5",
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
                borderTop: "1px solid #251936",
                color: "#a99cc1",
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
                borderTop: "1px solid #251936",
                color: "#f7f3ff",
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
                        <p style={eyebrowStyle}>Project Halo</p>
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
                        Every collaboration begins with trust.
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
