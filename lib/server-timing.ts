type TimingFields = Record<string, string | number | boolean | undefined>;

export function serverTimingsEnabled() {
  return process.env.NODE_ENV !== "production";
}

export function logServerTiming(operation: string, durationMs: number, fields: TimingFields = {}) {
  if (!serverTimingsEnabled()) return;
  console.info(JSON.stringify({
    event: "server_timing",
    operation,
    durationMs: Math.round(durationMs * 10) / 10,
    ...fields,
  }));
}

export async function withServerTiming<T>(operation: string, work: () => Promise<T>, fields: TimingFields = {}) {
  const startedAt = performance.now();
  try {
    return await work();
  } finally {
    logServerTiming(operation, performance.now() - startedAt, fields);
  }
}
