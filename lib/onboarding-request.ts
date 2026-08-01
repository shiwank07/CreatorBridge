export type OnboardingResponse = { response: Response; result: { error?: string; code?: string; retryable?: boolean } };

const pause = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export async function submitOnboardingWithBusyRetry(url: string, payload: unknown): Promise<OnboardingResponse> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = (await response.json().catch(() => ({}))) as OnboardingResponse["result"];
    if (!(response.status === 503 && result.code === "DATABASE_CONNECTING" && result.retryable && attempt === 0)) return { response, result };
    await pause(250);
  }
  throw new Error("Onboarding retry exhausted.");
}
