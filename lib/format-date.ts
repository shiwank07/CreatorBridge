const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(value?: string | Date | null, fallback = "Unknown") {
  if (!value) return fallback;
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value?: string | Date | null, fallback = "Unknown") {
  if (!value) return fallback;
  return dateTimeFormatter.format(new Date(value));
}
