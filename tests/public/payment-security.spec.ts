import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { creatorPaymentDetailsSchema } from "../../lib/validators/payment-details";
import { inspectProofImage, MAX_PROOF_FILE_SIZE } from "../../lib/private-uploads";

test("valid creator payment details are normalized", () => {
  const result = creatorPaymentDetailsSchema.parse({ preferredMethod: "bank", upiId: "name@bank", accountHolderName: " Creator ", bankName: " Bank ", accountNumber: "1234 567890", ifscCode: "abcd0123456", paymentNote: " note " });
  expect(result).toMatchObject({ accountHolderName: "Creator", accountNumber: "1234567890", ifscCode: "ABCD0123456" });
});

test("invalid UPI and IFSC values are rejected", () => {
  expect(creatorPaymentDetailsSchema.safeParse({ preferredMethod: "upi", upiId: "not-upi" }).success).toBe(false);
  expect(creatorPaymentDetailsSchema.safeParse({ preferredMethod: "bank", accountHolderName: "A", bankName: "B", accountNumber: "123456", ifscCode: "INVALID" }).success).toBe(false);
});

test("JPEG PNG and WebP magic bytes are accepted only with matching MIME", () => {
  expect(inspectProofImage(Uint8Array.from([0xff,0xd8,0xff,0]), "image/jpeg")?.extension).toBe("jpg");
  expect(inspectProofImage(Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), "image/png")?.extension).toBe("png");
  expect(inspectProofImage(new TextEncoder().encode("RIFF0000WEBP"), "image/webp")?.extension).toBe("webp");
  expect(inspectProofImage(new TextEncoder().encode("<svg></svg>"), "image/svg+xml")).toBeNull();
  expect(inspectProofImage(Uint8Array.from([0xff,0xd8,0xff]), "application/octet-stream")).toBeNull();
  expect(MAX_PROOF_FILE_SIZE).toBe(1024 * 1024);
});

test("sensitive profile fields are select-false and public queries do not select payment details", () => {
  const model = fs.readFileSync(path.join(process.cwd(), "lib/models/CreatorProfile.ts"), "utf8");
  expect(model).toContain('accountNumber: { type: String, trim: true, maxlength: 34, default: "", select: false }');
  expect(model).toContain('upiId: { type: String, trim: true, maxlength: 120, default: "", select: false }');
  const publicRoute = fs.readFileSync(path.join(process.cwd(), "app/api/creators/route.ts"), "utf8");
  expect(publicRoute).not.toContain("paymentDetails");
});

test("proof access uses opaque database ID, participant authorization and private headers", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "app/api/collaborations/[id]/proofs/[proofId]/route.ts"), "utf8");
  expect(route).toContain("participantRole");
  expect(route).toContain('ProofUpload.findOne({ _id: proofId, collaborationId: id })');
  expect(route).toContain('"Cache-Control": "private, no-store"');
  expect(route).not.toContain("searchParams.get(\"key\")");
});

test("payment route enforces owner roles, proof ownership and duplicate guards", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "app/api/collaborations/[id]/payment/route.ts"), "utf8");
  expect(route).toContain("Only the brand can mark payment sent.");
  expect(route).toContain("Only the creator can mark payment received.");
  expect(route).toContain("uploaderUserId: user._id");
  expect(route).toContain("duplicate: true");
});
