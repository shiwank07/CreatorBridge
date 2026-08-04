export type FutureR2Environment = {
  R2_ENDPOINT?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
};

export type FutureR2Command = {
  operation: "put" | "get" | "delete";
  input: Record<string, unknown>;
};

export type FutureR2Client = {
  send(command: FutureR2Command): Promise<Record<string, unknown>>;
};

export type FutureR2Body = ReadableStream<Uint8Array> | NodeJS.ReadableStream;

type CommandFactories = {
  put(input: Record<string, unknown>): FutureR2Command;
  get(input: Record<string, unknown>): FutureR2Command;
  delete(input: Record<string, unknown>): FutureR2Command;
};

type ClientConfiguration = {
  endpoint: string;
  region: "auto";
  credentials: { accessKeyId: string; secretAccessKey: string };
};

const requiredConfiguration = [
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
] as const;

function configurationFrom(environment: FutureR2Environment) {
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

function isProviderNotFound(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const record = error as Record<string, unknown>;
  const metadata = typeof record.$metadata === "object" && record.$metadata
    ? record.$metadata as Record<string, unknown>
    : {};
  return record.name === "NoSuchKey" || record.Code === "NoSuchKey" || metadata.httpStatusCode === 404;
}

/**
 * Test-only executable contract for the future Node R2 adapter. Production will
 * satisfy this contract by injecting S3Client and AWS SDK command constructors.
 */
export function createFutureR2ContractAdapter(input: {
  environment: FutureR2Environment;
  createClient(configuration: ClientConfiguration): FutureR2Client;
  commands: CommandFactories;
}) {
  let client: FutureR2Client | undefined;
  let bucket: string | undefined;

  function configuredClient() {
    if (!client) {
      const configuration = configurationFrom(input.environment);
      bucket = configuration.bucket;
      client = input.createClient({
        endpoint: configuration.endpoint,
        region: "auto",
        credentials: {
          accessKeyId: configuration.accessKeyId,
          secretAccessKey: configuration.secretAccessKey,
        },
      });
    }
    return { client, bucket: bucket! };
  }

  return {
    async put(key: string, body: ArrayBuffer, options: {
      contentType: string;
      originalFilename: string;
    }) {
      const configured = configuredClient();
      const result = await configured.client.send(input.commands.put({
        Bucket: configured.bucket,
        Key: key,
        Body: body,
        ContentType: options.contentType,
        Metadata: { originalFilename: options.originalFilename },
      }));
      return {
        key,
        etag: typeof result.ETag === "string" ? result.ETag : undefined,
      };
    },

    async get(key: string): Promise<{
      key: string;
      body: FutureR2Body;
      contentType?: string;
      metadata?: Record<string, string>;
      etag?: string;
    } | null> {
      const configured = configuredClient();
      try {
        const result = await configured.client.send(input.commands.get({
          Bucket: configured.bucket,
          Key: key,
        }));
        if (!result.Body) return null;
        return {
          key,
          body: result.Body as FutureR2Body,
          contentType: typeof result.ContentType === "string" ? result.ContentType : undefined,
          metadata: result.Metadata as Record<string, string> | undefined,
          etag: typeof result.ETag === "string" ? result.ETag : undefined,
        };
      } catch (error) {
        if (isProviderNotFound(error)) return null;
        throw error;
      }
    },

    async delete(key: string) {
      const configured = configuredClient();
      await configured.client.send(input.commands.delete({
        Bucket: configured.bucket,
        Key: key,
      }));
      return { key, deleted: true as const };
    },
  };
}
