import { expect, type Locator, type Page } from '@playwright/test';

type LocatorInput = string | Locator;

export type ElementBox = {
  index: number;
  text: string;
  box: { x: number; y: number; width: number; height: number };
};

export type ElementOverlap = {
  first: ElementBox;
  second: ElementBox;
};

function asLocator(page: Page, selectorOrLocator: LocatorInput): Locator {
  return typeof selectorOrLocator === 'string'
    ? page.locator(selectorOrLocator)
    : selectorOrLocator;
}

export async function assertNoHorizontalPageOverflow(
  page: Page,
  tolerance = 2,
): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(
    dimensions.scrollWidth,
    `Horizontal page overflow: scrollWidth=${dimensions.scrollWidth}, clientWidth=${dimensions.clientWidth}, tolerance=${tolerance}`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + tolerance);
}

export async function findElementOverlaps(
  page: Page,
  selectorOrLocator: LocatorInput,
): Promise<ElementOverlap[]> {
  const locator = asLocator(page, selectorOrLocator);

  return locator.evaluateAll((nodes) => {
    const visible = nodes
      .map((node, index) => {
        const element = node as HTMLElement;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          node: element,
          index,
          text: (element.innerText || element.getAttribute('aria-label') || element.tagName)
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 120),
          box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          visible:
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            Number(style.opacity) > 0 &&
            rect.width > 0 &&
            rect.height > 0,
        };
      })
      .filter((item) => item.visible);

    const overlaps: ElementOverlap[] = [];
    for (let firstIndex = 0; firstIndex < visible.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < visible.length; secondIndex += 1) {
        const first = visible[firstIndex];
        const second = visible[secondIndex];
        if (first.node.contains(second.node) || second.node.contains(first.node)) continue;

        const intersects =
          first.box.x < second.box.x + second.box.width &&
          first.box.x + first.box.width > second.box.x &&
          first.box.y < second.box.y + second.box.height &&
          first.box.y + first.box.height > second.box.y;

        if (intersects) {
          overlaps.push({
            first: { index: first.index, text: first.text, box: first.box },
            second: { index: second.index, text: second.text, box: second.box },
          });
        }
      }
    }
    return overlaps;
  });
}

export async function assertElementsDoNotOverlap(
  page: Page,
  selectorOrLocator: LocatorInput,
): Promise<void> {
  const overlaps = await findElementOverlaps(page, selectorOrLocator);
  const report = overlaps
    .map(
      ({ first, second }) =>
        `[${first.index}] ${JSON.stringify(first.text)} ${JSON.stringify(first.box)} overlaps ` +
        `[${second.index}] ${JSON.stringify(second.text)} ${JSON.stringify(second.box)}`,
    )
    .join('\n');

  expect(overlaps, `Overlapping elements${report ? `:\n${report}` : ''}`).toEqual([]);
}

export async function assertElementsInsideViewport(
  page: Page,
  selectorOrLocator: LocatorInput,
  tolerance = 2,
): Promise<void> {
  const locator = asLocator(page, selectorOrLocator);
  const outside = await locator.evaluateAll((nodes, allowedTolerance) =>
    nodes.flatMap((node, index) => {
      const element = node as HTMLElement;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const visible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        Number(style.opacity) > 0 &&
        rect.width > 0 &&
        rect.height > 0;
      const intersectsVerticalViewport = rect.bottom > 0 && rect.top < window.innerHeight;
      if (!visible || !intersectsVerticalViewport) return [];

      // Judge the pixels that are actually exposed. A control in an intentional
      // overflow scroller can have a larger layout rect while its painted area
      // remains correctly clipped inside the viewport.
      let visibleLeft = rect.left;
      let visibleRight = rect.right;
      let ancestor = element.parentElement;
      while (ancestor) {
        const ancestorStyle = window.getComputedStyle(ancestor);
        if (/(auto|scroll|hidden|clip)/.test(ancestorStyle.overflowX)) {
          const ancestorRect = ancestor.getBoundingClientRect();
          visibleLeft = Math.max(visibleLeft, ancestorRect.left);
          visibleRight = Math.min(visibleRight, ancestorRect.right);
        }
        ancestor = ancestor.parentElement;
      }

      if (visibleRight <= visibleLeft) return [];

      // Vertical clipping at the fold is normal for a scrolling document. For
      // controls intersecting the current viewport, flag horizontal escape.
      const isOutside =
        visibleLeft < -allowedTolerance ||
        visibleRight > window.innerWidth + allowedTolerance;
      if (!isOutside) return [];

      return [{
        index,
        text: (element.innerText || element.getAttribute('aria-label') || element.tagName)
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 120),
        box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        viewport: { width: window.innerWidth, height: window.innerHeight },
      }];
    }), tolerance);

  const report = outside
    .map(
      (item) =>
        `[${item.index}] ${JSON.stringify(item.text)} box=${JSON.stringify(item.box)} viewport=${JSON.stringify(item.viewport)}`,
    )
    .join('\n');

  expect(outside, `Elements outside viewport${report ? `:\n${report}` : ''}`).toEqual([]);
}

export async function assertChildrenInsideContainer(
  page: Page,
  containers: LocatorInput,
  childSelector = 'a, button, input, select, textarea, [role="status"], [role="alert"]',
  tolerance = 2,
): Promise<void> {
  const outside = await asLocator(page, containers).evaluateAll(
    (containerNodes, { selector, allowedTolerance }) =>
      containerNodes.flatMap((containerNode, containerIndex) => {
        const container = containerNode as HTMLElement;
        const containerRect = container.getBoundingClientRect();

        return Array.from(container.querySelectorAll<HTMLElement>(selector)).flatMap(
          (child, childIndex) => {
            const style = getComputedStyle(child);
            const rect = child.getBoundingClientRect();
            const visible =
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              Number(style.opacity) > 0 &&
              rect.width > 0 &&
              rect.height > 0;
            if (!visible) return [];

            const escapes =
              rect.left < containerRect.left - allowedTolerance ||
              rect.right > containerRect.right + allowedTolerance ||
              rect.top < containerRect.top - allowedTolerance ||
              rect.bottom > containerRect.bottom + allowedTolerance;
            if (!escapes) return [];

            return [{
              containerIndex,
              childIndex,
              text: (child.innerText || child.getAttribute('aria-label') || child.tagName)
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 120),
              container: {
                x: containerRect.x,
                y: containerRect.y,
                width: containerRect.width,
                height: containerRect.height,
              },
              child: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            }];
          },
        );
      }),
    { selector: childSelector, allowedTolerance: tolerance },
  );

  const report = outside
    .map(
      (item) =>
        `container[${item.containerIndex}] child[${item.childIndex}] ${JSON.stringify(item.text)} ` +
        `child=${JSON.stringify(item.child)} container=${JSON.stringify(item.container)}`,
    )
    .join('\n');

  expect(outside, `Children outside container${report ? `:\n${report}` : ''}`).toEqual([]);
}
