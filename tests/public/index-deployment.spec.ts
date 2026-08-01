import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const script = fs.readFileSync(path.join(process.cwd(), "scripts/deploy-public-performance-indexes.ts"), "utf8");

test("public performance index deployment is dry-run by default and explicitly confirmed for apply", () => {
  expect(script).toContain('process.argv.includes("--apply")');
  expect(script).toContain('process.argv.includes("--confirm-production")');
  expect(script).toContain("Applying indexes requires both --apply and --confirm-production.");
});

test("public performance index deployment declares exact collections, keys, and stable names", () => {
  expect(script).toContain('collection: "users"');
  expect(script).toContain('name: "public_role_onboarding_status_featured_createdAt"');
  expect(script).toContain("key: { role: 1, onboardingComplete: 1, accountStatus: 1, isFeatured: 1, createdAt: -1 }");
  expect(script).toContain('collection: "brandinquiries"');
  expect(script).toContain('name: "collaboration_creatorUsername_status"');
  expect(script).toContain("key: { creatorUsername: 1, status: 1 }");
});

test("public performance index deployment inspects duplicates and conflicts and never drops", () => {
  expect(script).toContain("duplicate_definition");
  expect(script).toContain("name_exists_with_different_key");
  expect(script).toContain("overlappingIndexes");
  expect(script).not.toMatch(/\.dropIndex\s*\(|\.dropIndexes\s*\(/);
  expect(script).toContain("droppedIndexes: 0");
});
