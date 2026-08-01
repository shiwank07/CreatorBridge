import { getCloudflareContext } from "@opennextjs/cloudflare";

export const MAX_PROOF_FILE_SIZE = 1024 * 1024;
export const PROOF_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type ProofMime = (typeof PROOF_MIME_TYPES)[number];
type Bucket = { put(key: string, value: ArrayBuffer, options?: object): Promise<unknown>; get(key: string): Promise<{ body: ReadableStream; httpEtag?: string } | null>; delete(key: string): Promise<void> };

export function inspectProofImage(bytes: Uint8Array, declaredType: string): { mimeType: ProofMime; extension: string } | null {
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.length >= 8 && [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((v, i) => bytes[i] === v);
  const webp = bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  const actual = jpeg ? { mimeType: "image/jpeg" as const, extension: "jpg" } : png ? { mimeType: "image/png" as const, extension: "png" } : webp ? { mimeType: "image/webp" as const, extension: "webp" } : null;
  return actual?.mimeType === declaredType ? actual : null;
}

export function sanitizedFilename(value: string) {
  return value.replace(/[^A-Za-z0-9._ -]/g, "_").replace(/\.{2,}/g, ".").slice(0, 180) || "proof-image";
}

export async function uploadsBucket(): Promise<Bucket> {
  const context = await getCloudflareContext({ async: true });
  const bucket = (context.env as Record<string, unknown>).BRANZZO_UPLOADS as Bucket | undefined;
  if (!bucket) throw new Error("BRANZZO_UPLOADS R2 binding is not configured.");
  return bucket;
}
