import { expect, type Page, type Request } from '@playwright/test';
import type { ErrorPattern } from './console-monitor';

export type NetworkFailure = {
  kind: 'requestfailed' | 'server-response';
  method: string;
  url: string;
  status?: number;
  reason: string;
  resourceType: string;
};

export type NetworkMonitorOptions = {
  ignoredUrlPatterns?: ErrorPattern[];
};

function matchesPattern(value: string, pattern: ErrorPattern): boolean {
  return typeof pattern === 'string' ? value.includes(pattern) : pattern.test(value);
}

function isHarmlessAbort(request: Request, reason: string): boolean {
  return reason.includes('ERR_ABORTED') && ['document', 'image'].includes(request.resourceType());
}

export function monitorNetwork(page: Page, options: NetworkMonitorOptions = {}) {
  const failures: NetworkFailure[] = [];
  const ignoredUrlPatterns = options.ignoredUrlPatterns ?? [];

  page.on('requestfailed', (request) => {
    const reason = request.failure()?.errorText ?? 'Unknown request failure';
    if (isHarmlessAbort(request, reason)) return;

    failures.push({
      kind: 'requestfailed',
      method: request.method(),
      url: request.url(),
      reason,
      resourceType: request.resourceType(),
    });
  });

  page.on('response', (response) => {
    if (response.status() < 500) return;

    const request = response.request();
    failures.push({
      kind: 'server-response',
      method: request.method(),
      url: response.url(),
      status: response.status(),
      reason: `HTTP ${response.status()} ${response.statusText()}`.trim(),
      resourceType: request.resourceType(),
    });
  });

  const criticalFailures = () =>
    failures.filter(
      (failure) =>
        !ignoredUrlPatterns.some((pattern) => matchesPattern(failure.url, pattern)),
    );

  return {
    failures: () => [...failures],
    criticalFailures,
    assertNoCriticalFailures: () => {
      const critical = criticalFailures();
      const report = critical
        .map(
          (failure, index) =>
            `${index + 1}. [${failure.kind}] ${failure.method} ${failure.url}\n` +
            `   ${failure.status ? `status=${failure.status}; ` : ''}type=${failure.resourceType}; reason=${failure.reason}`,
        )
        .join('\n');

      expect(critical, `Critical network failures${report ? `:\n${report}` : ''}`).toEqual([]);
    },
  };
}

export type NetworkMonitor = ReturnType<typeof monitorNetwork>;
