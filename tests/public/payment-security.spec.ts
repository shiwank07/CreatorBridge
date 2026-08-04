import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { creatorPaymentDetailsSchema } from "../../lib/validators/payment-details";
import { inspectProofImage, MAX_PROOF_FILE_SIZE } from "../../lib/private-uploads";
import {
  createFutureR2ContractAdapter,
  type FutureR2Client,
  type FutureR2Command,
  type FutureR2Environment,
} from "../helpers/future-r2-adapter-contract";

const configuredR2Environment: FutureR2Environment = {
  R2_ENDPOINT: "https://account-id.r2.example.invalid",
  R2_ACCESS_KEY_ID: "test-access-key",
  R2_SECRET_ACCESS_KEY: "test-secret-key",
  R2_BUCKET_NAME: "test-private-uploads",
};

function futureR2Harness(options: {
  environment?: FutureR2Environment;
  send?: FutureR2Client["send"];
} = {}) {
  const commands: FutureR2Command[] = [];
  const clientConfigurations: unknown[] = [];
  const client: FutureR2Client = {
    send: options.send ?? (async () => ({})),
  };
  const command = (operation: FutureR2Command["operation"]) => (input: Record<string, unknown>) => {
    const value = { operation, input };
    commands.push(value);
    return value;
  };
  const adapter = createFutureR2ContractAdapter({
    environment: options.environment ?? configuredR2Environment,
    createClient(configuration) {
      clientConfigurations.push(configuration);
      return client;
    },
    commands: {
      put: command("put"),
      get: command("get"),
      delete: command("delete"),
    },
  });
  return { adapter, commands, clientConfigurations };
}

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
  expect(route).toContain("admin.isAdmin");
  expect(route).toContain('ProofUpload.findOne({ _id: proofId, collaborationId: id })');
  expect(route).toContain('"Cache-Control": "private, no-store"');
  expect(route).toContain('"X-Content-Type-Options": "nosniff"');
  expect(route).not.toContain("searchParams.get(\"key\")");
});

test("payment route enforces owner roles, proof ownership and duplicate guards", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "app/api/collaborations/[id]/payment/route.ts"), "utf8");
  expect(route).toContain("Only the brand can mark payment sent.");
  expect(route).toContain("Only the creator can mark payment received.");
  expect(route).toContain("uploaderUserId: user._id");
  expect(route).toContain("duplicate: true");
});

test("future R2 PUT preserves the private bucket, exact key, body and metadata", async () => {
  const body = Uint8Array.from([0xff, 0xd8, 0xff]).buffer;
  const { adapter, commands } = futureR2Harness({ send: async () => ({ ETag: '"etag"' }) });

  const result = await adapter.put("collaborations/id/payment-proofs/opaque.jpg", body, {
    contentType: "image/jpeg",
    originalFilename: "payment proof.jpg",
  });

  expect(commands).toEqual([{
    operation: "put",
    input: {
      Bucket: "test-private-uploads",
      Key: "collaborations/id/payment-proofs/opaque.jpg",
      Body: body,
      ContentType: "image/jpeg",
      Metadata: { originalFilename: "payment proof.jpg" },
    },
  }]);
  expect(commands[0].input).not.toHaveProperty("ACL");
  expect(result).toEqual({ key: "collaborations/id/payment-proofs/opaque.jpg", etag: '"etag"' });
  expect(result).not.toHaveProperty("publicUrl");
});

test("future R2 GET preserves streaming bodies, content type and metadata", async () => {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(Uint8Array.from([1, 2, 3]));
      controller.close();
    },
  });
  const { adapter, commands } = futureR2Harness({
    send: async () => ({ Body: body, ContentType: "image/webp", Metadata: { originalfilename: "proof.webp" }, ETag: "etag" }),
  });

  const result = await adapter.get("collaborations/id/campaign-proofs/opaque.webp");

  expect(commands).toEqual([{
    operation: "get",
    input: { Bucket: "test-private-uploads", Key: "collaborations/id/campaign-proofs/opaque.webp" },
  }]);
  expect(result).toMatchObject({
    key: "collaborations/id/campaign-proofs/opaque.webp",
    body,
    contentType: "image/webp",
    metadata: { originalfilename: "proof.webp" },
    etag: "etag",
  });
});

test("future R2 GET accepts a Node-compatible stream without buffering it", async () => {
  const body = { pipe() { return this; } } as unknown as NodeJS.ReadableStream;
  const { adapter } = futureR2Harness({ send: async () => ({ Body: body }) });

  const result = await adapter.get("exact-object-key");

  expect(result?.body).toBe(body);
});

for (const providerError of [
  { name: "NoSuchKey" },
  { Code: "NoSuchKey" },
  { $metadata: { httpStatusCode: 404 } },
]) {
  test(`future R2 GET maps provider not-found shape to null: ${JSON.stringify(providerError)}`, async () => {
    const { adapter } = futureR2Harness({ send: async () => { throw providerError; } });
    await expect(adapter.get("missing-object-key")).resolves.toBeNull();
  });
}

test("future R2 GET maps an empty provider result to null", async () => {
  const { adapter } = futureR2Harness({ send: async () => ({}) });
  await expect(adapter.get("missing-object-key")).resolves.toBeNull();
});

test("future R2 GET does not hide non-not-found provider failures", async () => {
  const providerError = new Error("provider unavailable");
  const { adapter } = futureR2Harness({ send: async () => { throw providerError; } });
  await expect(adapter.get("exact-object-key")).rejects.toBe(providerError);
});

test("future R2 DELETE uses the configured bucket and exact key with a deterministic result", async () => {
  const { adapter, commands } = futureR2Harness();

  await expect(adapter.delete("collaborations/id/payment-proofs/opaque.jpg")).resolves.toEqual({
    key: "collaborations/id/payment-proofs/opaque.jpg",
    deleted: true,
  });
  expect(commands).toEqual([{
    operation: "delete",
    input: { Bucket: "test-private-uploads", Key: "collaborations/id/payment-proofs/opaque.jpg" },
  }]);
});

for (const missingName of ["R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"] as const) {
  test(`future R2 adapter fails clearly and safely when ${missingName} is missing`, async () => {
    const secretValues = ["private-access-value", "private-secret-value"];
    const environment = {
      ...configuredR2Environment,
      R2_ACCESS_KEY_ID: secretValues[0],
      R2_SECRET_ACCESS_KEY: secretValues[1],
      [missingName]: "",
    };
    const { adapter, clientConfigurations } = futureR2Harness({ environment });

    const error = await adapter.get("object-key").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(missingName);
    for (const secret of secretValues) expect((error as Error).message).not.toContain(secret);
    expect(clientConfigurations).toHaveLength(0);
  });
}

test("future R2 client is lazy and reused by repeated operations in one process", async () => {
  const { adapter, clientConfigurations } = futureR2Harness({
    send: async (command) => command.operation === "get" ? { Body: new ReadableStream() } : {},
  });

  expect(clientConfigurations).toHaveLength(0);
  await adapter.put("one", new ArrayBuffer(1), { contentType: "image/png", originalFilename: "one.png" });
  await adapter.get("one");
  await adapter.delete("one");

  expect(clientConfigurations).toHaveLength(1);
  expect(clientConfigurations[0]).toEqual({
    endpoint: configuredR2Environment.R2_ENDPOINT,
    region: "auto",
    credentials: {
      accessKeyId: configuredR2Environment.R2_ACCESS_KEY_ID,
      secretAccessKey: configuredR2Environment.R2_SECRET_ACCESS_KEY,
    },
  });
});

test("proof object keys remain private MongoDB fields with the existing format", () => {
  const uploadRoute = fs.readFileSync(path.join(process.cwd(), "app/api/collaborations/[id]/proofs/route.ts"), "utf8");
  const model = fs.readFileSync(path.join(process.cwd(), "lib/models/ProofUpload.ts"), "utf8");
  expect(uploadRoute).toContain('const key = `collaborations/${collaboration._id}/${folder}/${randomUUID()}.${image.extension}`');
  expect(uploadRoute).toContain("objectKey: key");
  expect(model).toContain("objectKey: { type: String, required: true, unique: true, select: false }");
});
