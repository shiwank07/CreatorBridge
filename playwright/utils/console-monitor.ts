import { expect, type Page } from '@playwright/test';

export type ErrorPattern = string | RegExp;

export type ConsoleError = {
  source: 'console' | 'pageerror';
  message: string;
  location?: string;
};

export type ConsoleMonitorOptions = {
  ignoredPatterns?: ErrorPattern[];
};

function matchesPattern(value: string, pattern: ErrorPattern): boolean {
  return typeof pattern === 'string' ? value.includes(pattern) : pattern.test(value);
}

export function monitorConsole(page: Page, options: ConsoleMonitorOptions = {}) {
  const errors: ConsoleError[] = [];
  const ignoredPatterns = options.ignoredPatterns ?? [];

  page.on('console', (message) => {
    if (message.type() !== 'error') return;

    const location = message.location();
    errors.push({
      source: 'console',
      message: message.text(),
      location: location.url
        ? `${location.url}${location.lineNumber ? `:${location.lineNumber}:${location.columnNumber}` : ''}`
        : undefined,
    });
  });

  page.on('pageerror', (error) => {
    errors.push({ source: 'pageerror', message: error.stack ?? error.message });
  });

  const criticalErrors = () =>
    errors.filter((error) => {
      const reportLine = `${error.source} ${error.message} ${error.location ?? ''}`;
      return !ignoredPatterns.some((pattern) => matchesPattern(reportLine, pattern));
    });

  return {
    errors: () => [...errors],
    criticalErrors,
    assertNoErrors: () => {
      const critical = criticalErrors();
      const report = critical
        .map((error, index) =>
          `${index + 1}. [${error.source}] ${error.message}${error.location ? `\n   at ${error.location}` : ''}`,
        )
        .join('\n');

      expect(critical, `Unexpected browser errors${report ? `:\n${report}` : ''}`).toEqual([]);
    },
  };
}

export type ConsoleMonitor = ReturnType<typeof monitorConsole>;
