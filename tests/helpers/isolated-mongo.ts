const isolatedDatabasePattern = /(?:test|testing|ci|e2e|integration)/i;

export function getIsolatedMongoUri(variableName: string) {
  const uri = process.env[variableName]?.trim();
  if (!uri) return undefined;

  let databaseName = "";
  try {
    databaseName = new URL(uri).pathname.replace(/^\/+/, "").split("/", 1)[0];
  } catch {
    throw new Error(`${variableName} is not a valid MongoDB URI.`);
  }

  if (!databaseName || !isolatedDatabasePattern.test(databaseName)) {
    throw new Error(
      `${variableName} must select an explicitly isolated test, CI, E2E, or integration database.`,
    );
  }

  return uri;
}
