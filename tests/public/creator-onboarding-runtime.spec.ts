import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

import { createBrowserDraftId } from "../../lib/browser-draft-id";
import { preparePlatformAccounts } from "../../lib/creator-platforms";

const componentSource = readFileSync(resolve(process.cwd(), "components/forms/creator-onboarding-form.tsx"), "utf8");
const validAccount = { platform: "instagram" as const, customPlatformName: "", handle: "", profileUrl: "https://instagram.com/creator", audienceType: "followers" as const, audienceCount: 10, isPrimary: true };

test("draft IDs use randomUUID when the browser provides it", () => {
  const nativeId = "12345678-1234-4123-8123-123456789abc" as `${string}-${string}-${string}-${string}-${string}`;
  const id = createBrowserDraftId({ randomUUID: () => nativeId, getRandomValues: <T extends ArrayBufferView | null>(value: T) => value });
  expect(id).toBe(nativeId);
});

test("draft IDs fall back to getRandomValues as unique RFC 4122-style UUIDs", () => {
  let seed = 0;
  const crypto = { getRandomValues: <T extends ArrayBufferView | null>(value: T) => { const bytes = value as Uint8Array; bytes.forEach((_, index) => { bytes[index] = (seed + index) & 0xff; }); seed += 17; return value; } };
  const ids = [createBrowserDraftId(crypto), createBrowserDraftId(crypto), createBrowserDraftId(crypto)];
  expect(new Set(ids).size).toBe(3);
  for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("initial render is deterministic and random IDs are created only by the add action", () => {
  expect(componentSource).toContain('const INITIAL_PLATFORM_ACCOUNT_DRAFT_ID = "initial-platform-account"');
  expect(componentSource).toContain("[emptyPlatformAccount(INITIAL_PLATFORM_ACCOUNT_DRAFT_ID, true)]");
  expect(componentSource).toContain("emptyPlatformAccount(createBrowserDraftId())");
  expect(componentSource).not.toContain("crypto.randomUUID");
  expect(componentSource).toContain("key={account.id}");
  expect(componentSource).not.toContain("key={index}");
});

test("new client draft IDs are replaced while saved IDs remain stable", () => {
  const injected = preparePlatformAccounts([{ ...validAccount, id: "another-creators-account" }]);
  expect(injected[0].id).not.toBe("another-creators-account");
  const saved = preparePlatformAccounts([{ ...validAccount, id: "owned-saved-account" }], new Set(["owned-saved-account"]));
  expect(saved[0].id).toBe("owned-saved-account");
});
