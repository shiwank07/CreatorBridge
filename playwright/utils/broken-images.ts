import { expect, type Page } from '@playwright/test';

export type BrokenImage = {
  index: number;
  alt: string;
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  reason: string;
};

export async function findBrokenVisibleImages(page: Page): Promise<BrokenImage[]> {
  return page.locator('img').evaluateAll((images) =>
    images.flatMap((node, index) => {
      const image = node as HTMLImageElement;
      const style = window.getComputedStyle(image);
      const rect = image.getBoundingClientRect();
      const visible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        Number(style.opacity) > 0 &&
        rect.width > 0 &&
        rect.height > 0;

      if (!visible) return [];

      const inViewport =
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth;
      const src = image.currentSrc || image.getAttribute('src') || '';
      const unloaded = image.naturalWidth <= 0 || image.naturalHeight <= 0;

      if (image.loading === 'lazy' && !inViewport && unloaded) return [];

      const reasons = [
        !src ? 'empty src' : '',
        image.naturalWidth <= 0 ? 'naturalWidth is 0' : '',
        image.naturalHeight <= 0 ? 'naturalHeight is 0' : '',
      ].filter(Boolean);

      return reasons.length
        ? [{
            index,
            alt: image.alt || '(no alt text)',
            src: src || '(empty)',
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            reason: reasons.join(', '),
          }]
        : [];
    }),
  );
}

export async function assertNoBrokenVisibleImages(page: Page): Promise<void> {
  const broken = await findBrokenVisibleImages(page);
  const report = broken
    .map(
      (image) =>
        `${image.index}. alt=${JSON.stringify(image.alt)} src=${JSON.stringify(image.src)} ` +
        `size=${image.naturalWidth}x${image.naturalHeight}: ${image.reason}`,
    )
    .join('\n');

  expect(broken, `Broken visible images${report ? `:\n${report}` : ''}`).toEqual([]);
}
