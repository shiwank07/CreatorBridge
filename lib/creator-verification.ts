import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const CREATOR_VERIFICATION_CODE_TTL_MS = 24 * 60 * 60 * 1000;
export const CREATOR_VERIFICATION_GENERATION_WINDOW_MS = 60 * 60 * 1000;
export const CREATOR_VERIFICATION_MAX_GENERATIONS = 5;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCreatorVerificationCode() {
  const bytes = randomBytes(8);
  let suffix = "";
  for (let index = 0; index < bytes.length; index += 1) suffix += ALPHABET[bytes[index] % ALPHABET.length];
  return `BZ-${suffix}`;
}

export function hashCreatorVerificationCode(code: string, salt = randomBytes(16).toString("hex")) {
  return { salt, hash: createHash("sha256").update(`${salt}:${code.trim().toUpperCase()}`).digest("hex") };
}

export function matchesCreatorVerificationCode(code: string, salt: string, expectedHash: string) {
  const actual = Buffer.from(hashCreatorVerificationCode(code, salt).hash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function creatorVerificationExpiry(now = new Date()) {
  return new Date(now.getTime() + CREATOR_VERIFICATION_CODE_TTL_MS);
}

export function isCreatorVerificationExpired(expiresAt: Date | string, now = new Date()) {
  return new Date(expiresAt).getTime() <= now.getTime();
}
