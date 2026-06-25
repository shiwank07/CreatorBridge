export function generateUsername(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);

  return base || `creator${Date.now().toString().slice(-5)}`;
}

export function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
