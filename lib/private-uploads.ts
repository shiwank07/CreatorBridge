import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type DeleteObjectCommandInput,
  type GetObjectCommandInput,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

export const MAX_PROOF_FILE_SIZE = 1024 * 1024;
export const PROOF_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type ProofMime = (typeof PROOF_MIME_TYPES)[number];

export type R2Environment = {
  R2_ENDPOINT?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
};

export type R2ClientConfiguration = {
  endpoint: string;
  region: "auto";
  credentials: { accessKeyId: string; secretAccessKey: string };
};

export type R2CommandClient = {
  send(command: unknown): Promise<Record<string, unknown>>;
};

export type R2CommandFactories = {
  put(input: PutObjectCommandInput): unknown;
  get(input: GetObjectCommandInput): unknown;
  delete(input: DeleteObjectCommandInput): unknown;
};

type PutOptions = {
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
};

export type UploadsBucket = {
  put(key: string, value: ArrayBuffer, options?: PutOptions): Promise<{ key: string; etag?: string }>;
  get(key: string): Promise<{
    key: string;
    body: ReadableStream<Uint8Array>;
    contentType?: string;
    customMetadata?: Record<string, string>;
    httpEtag?: string;
  } | null>;
  delete(key: string): Promise<{ key: string; deleted: true }>;
};

const requiredConfiguration = [
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
] as const;

const defaultCommandFactories: R2CommandFactories = {
  put: (input) => new PutObjectCommand(input),
  get: (input) => new GetObjectCommand(input),
  delete: (input) => new DeleteObjectCommand(input),
};

function configuredEnvironment(environment: R2Environment) {
  for (const name of requiredConfiguration) {
    if (!environment[name]?.trim()) throw new Error(`${name} is not configured.`);
  }

  return {
    endpoint: environment.R2_ENDPOINT!.trim(),
    accessKeyId: environment.R2_ACCESS_KEY_ID!.trim(),
    secretAccessKey: environment.R2_SECRET_ACCESS_KEY!.trim(),
    bucket: environment.R2_BUCKET_NAME!.trim(),
  };
}

function providerNotFound(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const record = error as Record<string, unknown>;
  const metadata = typeof record.$metadata === "object" && record.$metadata
    ? record.$metadata as Record<string, unknown>
    : {};
  const identifiers = [record.name, record.Code, record.code].filter((value): value is string => typeof value === "string");
  if (identifiers.some((value) => value === "NoSuchKey" || value === "NotFound")) return true;
  if (identifiers.length > 0) return false;
  return metadata.httpStatusCode === 404;
}

function storageFailure(operation: "put" | "get" | "delete") {
  const error = new Error(`R2 ${operation} failed.`);
  error.name = "R2StorageError";
  return error;
}

function toWebBody(body: unknown): ReadableStream<Uint8Array> {
  if (body instanceof ReadableStream) return body as ReadableStream<Uint8Array>;
  if (body instanceof Readable) return Readable.toWeb(body) as ReadableStream<Uint8Array>;
  if (body instanceof Blob) return body.stream();
  if (body && typeof body === "object" && "transformToWebStream" in body) {
    const transform = (body as { transformToWebStream?: unknown }).transformToWebStream;
    if (typeof transform === "function") {
      return transform.call(body) as ReadableStream<Uint8Array>;
    }
  }
  throw new Error("R2 returned an unsupported response body.");
}

export function createR2UploadsAdapter(options: {
  environment?: R2Environment;
  createClient?: (configuration: R2ClientConfiguration) => R2CommandClient;
  commands?: R2CommandFactories;
} = {}): UploadsBucket {
  const environment = options.environment ?? (process.env as R2Environment);
  const commands = options.commands ?? defaultCommandFactories;
  const createClient = options.createClient ?? ((configuration: R2ClientConfiguration) => {
    const client = new S3Client(configuration);
    return {
      send: (command) => client.send(command as never) as unknown as Promise<Record<string, unknown>>,
    };
  });
  let client: R2CommandClient | undefined;
  let bucket: string | undefined;

  function configuredClient(operation: "put" | "get" | "delete") {
    if (!client) {
      const configuration = configuredEnvironment(environment);
      bucket = configuration.bucket;
      try {
        client = createClient({
          endpoint: configuration.endpoint,
          region: "auto",
          credentials: {
            accessKeyId: configuration.accessKeyId,
            secretAccessKey: configuration.secretAccessKey,
          },
        });
      } catch {
        throw storageFailure(operation);
      }
    }
    return { client, bucket: bucket! };
  }

  return {
    async put(key, value, putOptions) {
      const configured = configuredClient("put");
      try {
        const result = await configured.client.send(commands.put({
          Bucket: configured.bucket,
          Key: key,
          Body: value as unknown as PutObjectCommandInput["Body"],
          ContentType: putOptions?.httpMetadata?.contentType,
          Metadata: putOptions?.customMetadata,
        }));
        return { key, etag: typeof result.ETag === "string" ? result.ETag : undefined };
      } catch {
        throw storageFailure("put");
      }
    },

    async get(key) {
      const configured = configuredClient("get");
      try {
        const result = await configured.client.send(commands.get({
          Bucket: configured.bucket,
          Key: key,
        }));
        if (!result.Body) return null;
        return {
          key,
          body: toWebBody(result.Body),
          contentType: typeof result.ContentType === "string" ? result.ContentType : undefined,
          customMetadata: result.Metadata as Record<string, string> | undefined,
          httpEtag: typeof result.ETag === "string" ? result.ETag : undefined,
        };
      } catch (error) {
        if (providerNotFound(error)) return null;
        throw storageFailure("get");
      }
    },

    async delete(key) {
      const configured = configuredClient("delete");
      try {
        await configured.client.send(commands.delete({
          Bucket: configured.bucket,
          Key: key,
        }));
        return { key, deleted: true };
      } catch {
        throw storageFailure("delete");
      }
    },
  };
}

let processUploadsBucket: UploadsBucket | undefined;

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

export async function uploadsBucket(): Promise<UploadsBucket> {
  processUploadsBucket ??= createR2UploadsAdapter();
  return processUploadsBucket;
}
