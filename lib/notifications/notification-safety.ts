export function safeNotificationActionUrl(value?: string | null) {
  const candidate = value?.trim() || "/";
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return "/";
  try {
    const parsed = new URL(candidate, "https://branzzo.invalid");
    if (parsed.origin !== "https://branzzo.invalid") return "/";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

export function notificationEntityForEvent(event: string) {
  if (event === "chat_message") return "message" as const;
  if (event.startsWith("verification_")) return "verification" as const;
  if (event === "system_update" || event === "admin_notice") return "system" as const;
  return "collaboration" as const;
}
