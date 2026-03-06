/**
 * blocker.ts — Pre-blocks non-essential scripts and iframes before consent is given.
 * Runs synchronously as early as possible (before DOMContentLoaded).
 */

const ATTR_CATEGORY = 'data-ck-category';
const ATTR_SRC = 'data-ck-src';
const ATTR_ORIGINAL_TYPE = 'data-ck-original-type';
const NECESSARY_CATEGORY = 'necessary';

function blockElement(el: HTMLScriptElement | HTMLIFrameElement): void {
  const category = el.getAttribute(ATTR_CATEGORY);
  if (!category || category === NECESSARY_CATEGORY) return;

  if (el instanceof HTMLScriptElement) {
    const src = el.src || el.getAttribute('src');
    if (src) {
      el.setAttribute(ATTR_SRC, src);
      el.removeAttribute('src');
    }
    const originalType = el.type || 'text/javascript';
    el.setAttribute(ATTR_ORIGINAL_TYPE, originalType);
    el.type = 'text/plain';
  } else if (el instanceof HTMLIFrameElement) {
    const src = el.src;
    if (src && src !== 'about:blank') {
      el.setAttribute(ATTR_SRC, src);
      el.src = 'about:blank';
    }
  }
}

function unblockCategory(category: string): void {
  // Unblock scripts
  document.querySelectorAll<HTMLScriptElement>(
    `script[${ATTR_CATEGORY}="${category}"][type="text/plain"]`
  ).forEach((el) => {
    const originalSrc = el.getAttribute(ATTR_SRC);
    const originalType = el.getAttribute(ATTR_ORIGINAL_TYPE) || 'text/javascript';

    // Clone the script so the browser actually executes it
    const clone = document.createElement('script');
    clone.setAttribute(ATTR_CATEGORY, category);
    clone.type = originalType;

    // Copy all other attributes
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name !== 'type' && attr.name !== ATTR_SRC && attr.name !== ATTR_ORIGINAL_TYPE) {
        clone.setAttribute(attr.name, attr.value);
      }
    });

    if (originalSrc) {
      clone.src = originalSrc;
    } else if (el.textContent) {
      clone.textContent = el.textContent;
    }

    el.parentNode?.replaceChild(clone, el);
  });

  // Unblock iframes
  document.querySelectorAll<HTMLIFrameElement>(
    `iframe[${ATTR_CATEGORY}="${category}"]`
  ).forEach((el) => {
    const originalSrc = el.getAttribute(ATTR_SRC);
    if (originalSrc) {
      el.src = originalSrc;
      el.removeAttribute(ATTR_SRC);
    }
  });
}

let observer: MutationObserver | null = null;

export function startBlocking(): void {
  // Block already-present elements
  document.querySelectorAll<HTMLScriptElement | HTMLIFrameElement>(
    `[${ATTR_CATEGORY}]`
  ).forEach((el) => blockElement(el as HTMLScriptElement | HTMLIFrameElement));

  // Watch for dynamically injected elements
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLScriptElement || node instanceof HTMLIFrameElement) {
          blockElement(node);
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}

export function stopBlocking(): void {
  observer?.disconnect();
  observer = null;
}

export function applyConsent(choices: Record<string, boolean>): void {
  stopBlocking();
  for (const [category, granted] of Object.entries(choices)) {
    if (granted && category !== NECESSARY_CATEGORY) {
      unblockCategory(category);
    }
  }
}
