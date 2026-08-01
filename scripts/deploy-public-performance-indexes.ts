import { config } from "dotenv";
import { type Collection, type IndexDescriptionInfo, MongoClient } from "mongodb";

config({ path: process.env.INDEX_ENV_FILE?.trim() || ".env.local" });
config();

type IndexKey = Record<string, 1 | -1>;
type IndexDefinition = { collection: string; name: string; key: IndexKey };

const apply = process.argv.includes("--apply");
const confirmProduction = process.argv.includes("--confirm-production");

export const requiredPublicPerformanceIndexes: IndexDefinition[] = [
  {
    collection: "users",
    name: "public_role_onboarding_status_featured_createdAt",
    key: { role: 1, onboardingComplete: 1, accountStatus: 1, isFeatured: 1, createdAt: -1 },
  },
  {
    collection: "brandinquiries",
    name: "collaboration_creatorUsername_status",
    key: { creatorUsername: 1, status: 1 },
  },
];

function sameKey(left: Record<string, unknown>, right: Record<string, unknown>) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function overlappingIndexes(indexes: IndexDescriptionInfo[], definition: IndexDefinition) {
  const fields = Object.keys(definition.key);
  return indexes
    .filter((index) => index.name !== "_id_" && !sameKey(index.key, definition.key))
    .filter((index) => {
      const existingFields = Object.keys(index.key);
      const sharedPrefixLength = Math.min(existingFields.length, fields.length);
      return sharedPrefixLength > 0 && existingFields.slice(0, sharedPrefixLength).every((field, position) => field === fields[position]);
    })
    .map((index) => ({ name: index.name, key: index.key }));
}

async function inspectIndex(collection: Collection, definition: IndexDefinition) {
  const indexes = await collection.listIndexes().toArray();
  const sameName = indexes.find((index) => index.name === definition.name);
  const sameDefinition = indexes.find((index) => sameKey(index.key, definition.key));
  const overlaps = overlappingIndexes(indexes, definition);

  if (sameName && !sameKey(sameName.key, definition.key)) {
    return {
      status: "conflict" as const,
      conflict: { reason: "name_exists_with_different_key", existingName: sameName.name, existingKey: sameName.key },
      overlaps,
    };
  }
  if (sameDefinition) {
    return {
      status: sameDefinition.name === definition.name ? "existing" as const : "duplicate_definition" as const,
      existingName: sameDefinition.name,
      overlaps,
    };
  }
  return { status: "missing" as const, overlaps };
}

async function main() {
  if (apply && !confirmProduction) {
    throw new Error("Applying indexes requires both --apply and --confirm-production.");
  }
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("MONGODB_URI is required.");

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5_000 });
  await client.connect();
  try {
    const database = process.env.MONGODB_DB_NAME?.trim() ? client.db(process.env.MONGODB_DB_NAME?.trim()) : client.db();
    const inspections = [];
    for (const definition of requiredPublicPerformanceIndexes) {
      const collection = database.collection(definition.collection);
      const inspection = await inspectIndex(collection, definition);
      inspections.push({ definition, collection, inspection });
    }

    const blocked = inspections.some(({ inspection }) => inspection.status === "conflict");
    const reports = [];
    for (const { definition, collection, inspection } of inspections) {
      let status: string = inspection.status;
      if (inspection.status === "missing" && apply && !blocked) {
        await collection.createIndex(definition.key, { name: definition.name });
        status = "created";
      }

      reports.push({
        collection: collection.collectionName,
        indexName: definition.name,
        key: definition.key,
        status,
        ...(inspection.status === "duplicate_definition" ? { duplicateIndexName: inspection.existingName } : {}),
        ...(inspection.status === "conflict" ? { conflict: inspection.conflict } : {}),
        overlappingIndexes: inspection.overlaps,
      });
    }

    process.stdout.write(`${JSON.stringify({
      mode: apply ? "apply" : "dry-run",
      destructive: false,
      droppedIndexes: 0,
      database: database.databaseName,
      reports,
    }, null, 2)}\n`);

    if (blocked) throw new Error("Index deployment blocked by a conflicting existing index name. No indexes were dropped.");
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Index deployment failed."}\n`);
  process.exitCode = 1;
});
