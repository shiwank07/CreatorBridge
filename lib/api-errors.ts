import { NextResponse } from "next/server";

export class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export async function parseJsonBody(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new HttpError("Request body must be valid JSON.", 400);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDuplicateKeyError(error: unknown) {
  return isRecord(error) && error.code === 11000;
}

function duplicateKeyMessage(error: unknown) {
  if (!isRecord(error) || !isRecord(error.keyPattern)) {
    return "A record with these details already exists.";
  }

  if ("username" in error.keyPattern) return "That username is already taken.";
  if ("email" in error.keyPattern) return "That email is already linked to another account.";
  if ("clerkId" in error.keyPattern) return "That Clerk user is already linked.";
  if ("userId" in error.keyPattern) return "A profile already exists for this account.";

  return "A record with these details already exists.";
}

function isMongoUnavailableError(error: unknown) {
  if (!isRecord(error)) return false;

  const name = typeof error.name === "string" ? error.name : "";
  const message = error instanceof Error ? error.message : "";

  return (
    message.includes("MONGODB_URI") ||
    name.includes("MongoNetworkError") ||
    name.includes("MongoParseError") ||
    name.includes("MongooseServerSelectionError") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND") ||
    message.includes("ETIMEOUT") ||
    message.toLowerCase().includes("authentication failed") ||
    message.toLowerCase().includes("bad auth")
  );
}

export function handleRouteError(error: unknown, context: string, fallbackMessage = "Something went wrong.") {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (isDuplicateKeyError(error)) {
    return NextResponse.json({ error: duplicateKeyMessage(error) }, { status: 409 });
  }

  if (isMongoUnavailableError(error)) {
    console.error(context, error);
    const message = error instanceof Error && error.message.includes("MONGODB_URI")
      ? "MongoDB is not configured yet."
      : "Database is unavailable. Check MongoDB Atlas configuration and network access.";

    return NextResponse.json({ error: message }, { status: 503 });
  }

  console.error(context, error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
