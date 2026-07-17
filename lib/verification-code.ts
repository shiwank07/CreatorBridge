import { randomInt } from "crypto";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const VERIFICATION_CODE_PATTERN = /^(?:BZ|CB)-[A-Z0-9]+$/;

export function formatVerificationCode(value?: string | null) {
  return value?.trim().toUpperCase() ?? "";
}

export function isVerificationCode(value?: string | null) {
  return VERIFICATION_CODE_PATTERN.test(formatVerificationCode(value));
}

export function createVerificationCode() {
  let suffix = "";
  for (let index = 0; index < 5; index += 1) {
    suffix += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return `BZ-${suffix}`;
}
