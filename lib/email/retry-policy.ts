export const EMAIL_MAX_ATTEMPTS = 4;

export function retryDelayMs(attempts: number) {
  return Math.min(6 * 60 * 60_000, 5 * 60_000 * 2 ** Math.max(0, attempts - 1));
}
