import { writeFile } from "node:fs/promises";

const outputPath = process.argv[2];
if (!outputPath) {
  throw new Error("An output path is required.");
}

const sourceNames = {
  MONGODB_URI: "STAGING_MONGODB_URI",
  MONGODB_DB_NAME: "STAGING_MONGODB_DB_NAME",
  CLERK_SECRET_KEY: "STAGING_CLERK_SECRET_KEY",
  ADMIN_EMAILS: "STAGING_ADMIN_EMAILS",
};

for (const optional of ["CLERK_WEBHOOK_SECRET", "RESEND_API_KEY"]) {
  if (process.env[`STAGING_${optional}`]?.trim()) {
    sourceNames[optional] = `STAGING_${optional}`;
  }
}

const payload = Object.fromEntries(
  Object.entries(sourceNames).map(([target, source]) => {
    const value = process.env[source]?.trim();
    if (!value) throw new Error(`Missing required staging secret source: ${source}`);
    return [target, value];
  }),
);

await writeFile(outputPath, `${JSON.stringify(payload)}\n`, { mode: 0o600 });
console.log(`Prepared ${Object.keys(payload).length} staging secrets in the ephemeral runner directory.`);
