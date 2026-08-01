const requiredNames = [
  "STAGING_URL",
  "STAGING_MONGODB_DB_NAME",
  "STAGING_MONGODB_URI",
  "STAGING_CLERK_PUBLISHABLE_KEY",
  "STAGING_CLERK_SECRET_KEY",
  "STAGING_ADMIN_EMAILS",
  "ANALYTICS_TEST_MONGODB_URI",
  "E2E_MONGODB_URI",
  "E2E_CLERK_PUBLISHABLE_KEY",
  "E2E_CLERK_SECRET_KEY",
  "E2E_CREATOR_EMAIL",
  "E2E_BRAND_EMAIL",
  "E2E_ADMIN_EMAIL",
  "E2E_CLERK_TEST_OTP",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "CLERK_STAGING_CONFIGURATION_VERIFIED",
];

const missing = requiredNames.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(`Missing required staging values: ${missing.join(", ")}`);
  process.exit(1);
}

function databaseIdentity(variableName) {
  let parsed;
  try {
    parsed = new URL(process.env[variableName]);
  } catch {
    throw new Error(`${variableName} is not a valid MongoDB URI.`);
  }

  if (!["mongodb:", "mongodb+srv:"].includes(parsed.protocol)) {
    throw new Error(`${variableName} must use a MongoDB URI scheme.`);
  }

  const name = decodeURIComponent(parsed.pathname.replace(/^\/+/, "")).trim();
  if (!name || name.includes("/")) {
    throw new Error(`${variableName} must select one explicit database.`);
  }

  const username = decodeURIComponent(parsed.username || "").trim().toLowerCase();
  if (/^(admin|administrator|atlasadmin|root|superuser)$/.test(username)) {
    throw new Error(`${variableName} appears to use an unrestricted administrative account.`);
  }

  return name;
}

const stagingDatabase = databaseIdentity("STAGING_MONGODB_URI");
const integrationDatabase = databaseIdentity("ANALYTICS_TEST_MONGODB_URI");
const e2eDatabase = databaseIdentity("E2E_MONGODB_URI");

if (stagingDatabase !== "branzzo_staging") {
  throw new Error("STAGING_MONGODB_URI must select the database named branzzo_staging.");
}
if (!/(integration|test|testing|ci)/i.test(integrationDatabase)) {
  throw new Error("ANALYTICS_TEST_MONGODB_URI must select an explicitly isolated integration database.");
}
if (!/(e2e|test|testing|ci)/i.test(e2eDatabase)) {
  throw new Error("E2E_MONGODB_URI must select an explicitly isolated E2E database.");
}
if (new Set([stagingDatabase, integrationDatabase, e2eDatabase]).size !== 3) {
  throw new Error("Staging, integration, and E2E must use three different MongoDB databases.");
}
if (/(prod|production|live|admin)/i.test(stagingDatabase)) {
  throw new Error("The staging database name looks unsafe.");
}

let stagingUrl;
try {
  stagingUrl = new URL(process.env.STAGING_URL);
} catch {
  throw new Error("STAGING_URL is not a valid URL.");
}
if (
  stagingUrl.protocol !== "https:" ||
  !/^branzzo-staging\.[a-z0-9-]+\.workers\.dev$/i.test(stagingUrl.hostname) ||
  stagingUrl.pathname !== "/" ||
  stagingUrl.search ||
  stagingUrl.hash
) {
  throw new Error("STAGING_URL must be the canonical branzzo-staging workers.dev HTTPS origin.");
}

if (!process.env.STAGING_CLERK_PUBLISHABLE_KEY.startsWith("pk_test_")) {
  throw new Error("STAGING_CLERK_PUBLISHABLE_KEY must be a Clerk test/development key.");
}
if (!process.env.STAGING_CLERK_SECRET_KEY.startsWith("sk_test_")) {
  throw new Error("STAGING_CLERK_SECRET_KEY must be a Clerk test/development key.");
}
if (!process.env.E2E_CLERK_PUBLISHABLE_KEY.startsWith("pk_test_")) {
  throw new Error("E2E_CLERK_PUBLISHABLE_KEY must be a Clerk test/development key.");
}
if (!process.env.E2E_CLERK_SECRET_KEY.startsWith("sk_test_")) {
  throw new Error("E2E_CLERK_SECRET_KEY must be a Clerk test/development key.");
}
if (
  process.env.E2E_CLERK_PUBLISHABLE_KEY !== process.env.STAGING_CLERK_PUBLISHABLE_KEY ||
  process.env.E2E_CLERK_SECRET_KEY !== process.env.STAGING_CLERK_SECRET_KEY
) {
  throw new Error("Authenticated E2E credentials must target the isolated staging Clerk instance.");
}
if (process.env.CLERK_STAGING_CONFIGURATION_VERIFIED.trim().toLowerCase() !== "true") {
  throw new Error(
    "CLERK_STAGING_CONFIGURATION_VERIFIED must attest that the workers.dev origin and application redirects are configured in the isolated Clerk instance.",
  );
}

const routeExpectations = {
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: "/onboarding",
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: "/onboarding",
};
for (const [name, expected] of Object.entries(routeExpectations)) {
  if ((process.env[name]?.trim() || expected) !== expected) {
    throw new Error(`${name} must equal ${expected}.`);
  }
}

if (process.env.STAGING_MONGODB_DB_NAME?.trim() !== "branzzo_staging") {
  throw new Error("STAGING_MONGODB_DB_NAME must equal branzzo_staging.");
}

console.log("Staging preflight passed without exposing secret values.");
console.log("Validated: Worker URL, isolated databases, Clerk key types, routes, and required credentials.");
