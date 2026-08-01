import "dotenv/config";
import { createClerkClient } from "@clerk/nextjs/server";
import mongoose from "mongoose";

import { reconcileClerkUsers } from "../lib/clerk-reconciliation";

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const ids = args.filter((value) => value.startsWith("--user-id=")).map((value) => value.slice("--user-id=".length)).filter(Boolean);
  const limitArg = args.find((value) => value.startsWith("--limit="));
  const limit = Number(limitArg?.slice("--limit=".length) || 25);
  if (!process.env.CLERK_SECRET_KEY || !process.env.MONGODB_URI) throw new Error("CLERK_SECRET_KEY and MONGODB_URI are required.");
  if (process.env.NODE_ENV === "production" && apply && ids.length !== 1) {
    throw new Error("Production apply mode requires exactly one explicit --user-id.");
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const results = await reconcileClerkUsers({ clerk, clerkUserIds: ids, limit, dryRun: !apply });
  for (const result of results) console.log(`${result.clerkUserId}: ${result.outcome}`);
  console.log(`${apply ? "Apply" : "Dry-run"} reconciliation complete for ${results.length} user(s).`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Clerk reconciliation failed.");
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
