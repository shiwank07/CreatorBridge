import { NextResponse } from "next/server";

import { hasMongoUri, verifyDBConnection } from "@/lib/db";

export const dynamic = "force-dynamic";

type MongoHealthDiagnostics = {
  hasMongoUri: boolean;
  uriStartsWithMongoSrv: boolean;
  uriHasDbName: boolean;
  uriHasAngleBrackets: boolean;
  uriHasTrailingSpaces: boolean;
};

function getMongoHealthDiagnostics(): MongoHealthDiagnostics {
  const uri = process.env.MONGODB_URI ?? "";
  const trimmedUri = uri.trim();

  return {
    hasMongoUri: hasMongoUri(),
    uriStartsWithMongoSrv: trimmedUri.startsWith("mongodb+srv://"),
    uriHasDbName: getUriHasDbName(trimmedUri),
    uriHasAngleBrackets: uri.includes("<") || uri.includes(">"),
    uriHasTrailingSpaces: uri.length !== uri.trimEnd().length,
  };
}

function getUriHasDbName(uri: string) {
  if (!uri) return false;

  try {
    const parsedUri = new URL(uri);
    return parsedUri.pathname.length > 1 && Boolean(parsedUri.pathname.slice(1).trim());
  } catch {
    const uriWithoutQuery = uri.split(/[?#]/, 1)[0];
    const uriWithoutScheme = uriWithoutQuery.replace(/^mongodb(?:\+srv)?:\/\//i, "");
    const pathStart = uriWithoutScheme.indexOf("/");

    return pathStart >= 0 && Boolean(uriWithoutScheme.slice(pathStart + 1).trim());
  }
}

function getErrorName(error: unknown) {
  const name = getErrorProperty(error, "name");
  return typeof name === "string" && name ? name : null;
}

function getErrorProperty(error: unknown, property: string) {
  if (typeof error !== "object" || error === null || !(property in error)) {
    return null;
  }

  return (error as Record<string, unknown>)[property] ?? null;
}

function getErrorCode(error: unknown) {
  const code = getErrorProperty(error, "code");
  return typeof code === "number" || typeof code === "string" ? code : null;
}

function getErrorCodeName(error: unknown) {
  const codeName = getErrorProperty(error, "codeName");
  return typeof codeName === "string" && codeName ? codeName : null;
}

function getErrorCause(error: unknown) {
  return getErrorProperty(error, "cause");
}

function getErrorMessage(error: unknown) {
  const message = getErrorProperty(error, "message");

  if (typeof message === "string") {
    return message;
  }

  return typeof error === "string" ? error : null;
}

function sanitizeMongoErrorMessage(message: string) {
  return message
    .replace(/\bmongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, "[redacted MongoDB connection string]")
    .replace(/\bhttps?:\/\/[^\s"'<>]+/gi, "[redacted URL]")
    .replace(/\bMONGODB_URI\b/g, "MongoDB connection string")
    .replace(/(^|[\s'"\[(,{])[^:@\s]+:[^@\s]+@/g, "$1[redacted-credentials]@")
    .replace(/\b(user(?:name)?|password|pwd|pass)\s*[:=]\s*(?:"[^"]*"|'[^']*'|`[^`]*`|[^\s,;}]+)/gi, "$1=[redacted]")
    .replace(/\b(for user|user)\s+(?:"[^"]*"|'[^']*'|`[^`]*`|[^\s,;@]+)/gi, "$1 [redacted]")
    .replace(/\b(host(?:name)?|address|server|srvHost)\s*[:=]\s*(?:"[^"]*"|'[^']*'|`[^`]*`|[^\s,;}]+)/gi, "$1=[redacted-host]")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{2,5})?\b/g, "[redacted-host]")
    .replace(/\[[0-9a-f:.]+\](?::\d{2,5})?/gi, "[redacted-host]")
    .replace(/\blocalhost(?::\d{2,5})?\b/gi, "[redacted-host]")
    .replace(/(^|[\s'"\[(,{:=@])((?:_?[a-z0-9-]+\.)+[a-z0-9-]{2,})(?::\d{2,5})?(?=$|[\s'"\])},;])/gi, "$1[redacted-host]")
    .replace(/(^|[\s'"\[(,{:=@])([a-z0-9-]+:\d{2,5})(?=$|[\s'"\])},;])/gi, "$1[redacted-host]")
    .trim();
}

function getFullErrorMessage(error: unknown) {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;

  for (let depth = 0; depth < 4 && current && !seen.has(current); depth += 1) {
    seen.add(current);

    const name = getErrorName(current);
    const message = getErrorMessage(current);

    if (message) {
      const detail = name && !message.startsWith(`${name}:`) ? `${name}: ${message}` : message;
      parts.push(depth === 0 ? detail : `Caused by ${detail}`);
    }

    current = getErrorCause(current);
  }

  return parts.length ? sanitizeMongoErrorMessage(parts.join(" | ")) : null;
}

function getSanitizedErrorMessage(error: unknown) {
  const name = getErrorName(error) ?? "";
  const message = getErrorMessage(error) ?? "";
  const lowerMessage = message.toLowerCase();

  if (message.includes("MONGODB_URI")) {
    return "MongoDB is not configured yet.";
  }

  if (name.includes("MongoParseError")) {
    return "MongoDB URI could not be parsed. Check the scheme, database name, placeholder brackets, and trailing spaces.";
  }

  if (lowerMessage.includes("authentication failed") || lowerMessage.includes("bad auth")) {
    return "MongoDB authentication failed. Check the username, password, and auth database.";
  }

  if (
    name.includes("MongoNetworkError") ||
    name.includes("ServerSelectionError") ||
    lowerMessage.includes("econnrefused") ||
    lowerMessage.includes("enotfound") ||
    lowerMessage.includes("etimeout")
  ) {
    return "MongoDB connection failed. Check Atlas network access, DNS, credentials, and database availability.";
  }

  return "Database health check failed. Check MongoDB configuration and availability.";
}

function getMongoErrorDetails(error: unknown) {
  const cause = getErrorCause(error);

  return {
    errorName: getErrorName(error),
    errorCode: getErrorCode(error),
    errorCodeName: getErrorCodeName(error),
    errorCauseName: getErrorName(cause),
    errorCauseCode: getErrorCode(cause),
    fullErrorMessage: getFullErrorMessage(error),
    sanitizedErrorMessage: getSanitizedErrorMessage(error),
  };
}

const emptyMongoErrorDetails = {
  errorName: null,
  errorCode: null,
  errorCodeName: null,
  errorCauseName: null,
  errorCauseCode: null,
  fullErrorMessage: null,
  sanitizedErrorMessage: null,
};

export async function GET() {
  const diagnostics = getMongoHealthDiagnostics();

  try {
    if (!diagnostics.hasMongoUri) {
      return NextResponse.json(
        {
          ok: false,
          configured: false,
          ...diagnostics,
          ...emptyMongoErrorDetails,
          fullErrorMessage: "MongoDB connection string is not configured.",
          sanitizedErrorMessage: "MongoDB is not configured yet.",
        },
        { status: 503 },
      );
    }

    const status = await verifyDBConnection();

    return NextResponse.json({
      ok: true,
      configured: true,
      ...diagnostics,
      readyState: status.readyState,
      ...emptyMongoErrorDetails,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: diagnostics.hasMongoUri,
        ...diagnostics,
        ...getMongoErrorDetails(error),
      },
      { status: 503 },
    );
  }
}
