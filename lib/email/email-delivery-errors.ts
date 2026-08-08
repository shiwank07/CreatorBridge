export function isDeliveryKeyDuplicateError(error: unknown): boolean {
  if (typeof error !== "object" || !error || !("code" in error) || error.code !== 11000) return false;
  if (!("keyPattern" in error) || typeof error.keyPattern !== "object" || !error.keyPattern) return false;
  return "deliveryKey" in error.keyPattern;
}
