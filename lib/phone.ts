export function normalizePhoneNumber(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";

  const hasInternationalPrefix = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  return hasInternationalPrefix ? `+${digits}` : digits;
}

export function isValidPhoneNumber(value?: string | null) {
  const normalized = normalizePhoneNumber(value);
  if (!normalized) return true;

  return /^\+?\d{7,15}$/.test(normalized);
}
