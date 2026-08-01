import type { CSSProperties, ReactNode } from "react";

export { default as EmailLayout, EmailDetails as EmailMetadataRow, EmailText } from "./layout";

export function EmailHeader({ children }: { children: ReactNode }) {
  return <div style={{ marginBottom: 20 }}>{children}</div>;
}

export function EmailFooter({ children }: { children: ReactNode }) {
  return <p style={{ margin: "22px 0 0", color: "#71677d", fontSize: 13, lineHeight: "20px" }}>{children}</p>;
}

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  const style: CSSProperties = {
    display: "inline-block", padding: "14px 20px", borderRadius: 6,
    backgroundColor: "#7c3aed", color: "#ffffff", fontWeight: 700, textDecoration: "none",
  };
  return <a href={href} style={style}>{children}</a>;
}

export function EmailCard({ children }: { children: ReactNode }) {
  return (
    <div style={{ margin: "20px 0", padding: 18, border: "1px solid #e5dff0", borderRadius: 8, backgroundColor: "#faf8fc" }}>
      {children}
    </div>
  );
}

export function EmailDivider() {
  return <hr style={{ margin: "24px 0", border: 0, borderTop: "1px solid #e9e3f0" }} />;
}
