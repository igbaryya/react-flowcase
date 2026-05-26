/**
 * Picks the most stable CSS selector for a DOM element — the kind of
 * selector a hand-written automation flow would target. Stability is
 * preferred over brevity: an `id` beats a `data-testid`, a `data-testid`
 * beats a `name`, and unique structural fallbacks come last.
 *
 * Used by the flow recorder to label each interaction it observes; the
 * resulting selector is also displayed in inspector tooltips so a user
 * can hover any element and learn how the library would target it.
 */

function cssEscape(value: string): string {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
        return CSS.escape(value);
    }
    return value.replace(/(["\\\]])/g, '\\$1');
}

function isUniqueInDocument(selector: string): boolean {
    try {
        return document.querySelectorAll(selector).length === 1;
    } catch {
        return false;
    }
}

/**
 * Class names that almost certainly reflect transient UI state rather than
 * identity. We skip these when looking for a stable single-class selector
 * so we don't generate flows that break the moment a button toggles into
 * its `active` style.
 */
const UNSTABLE_CLASS_RE =
    /^(active|hover|hovered|focus|focused|focus-visible|selected|open|closed|expanded|collapsed|hidden|invisible|sr-only|disabled|loading|pending|error|success|warning|busy|drag|dragging|dragover|highlighted|on|off)$/i;

const TEST_ATTRS = [
    'data-testid',
    'data-test-id',
    'data-test',
    'data-cy',
    'data-qa',
] as const;

export interface BestSelectorOptions {
    /**
     * Override the attribute priority list. Defaults to:
     * `id` → test attributes → `name` → `aria-label` → unique class → structural.
     */
    prefer?: ReadonlyArray<
        'id' | 'name' | 'aria-label' | (typeof TEST_ATTRS)[number]
    >;
    /**
     * Maximum depth for the structural fallback. Deeper selectors are
     * fragile to DOM reshuffling, so we cap at 5 ancestors by default.
     */
    maxStructuralDepth?: number;
}

/**
 * Returns a CSS selector string that uniquely (or nearly so) identifies
 * `el` in its current document. Falls back to a `tag:nth-of-type(N)`
 * descendant chain when no semantic attribute is available.
 */
export function bestSelector(
    el: Element,
    options: BestSelectorOptions = {},
): string {
    // 1. id — the strongest signal, even when not technically unique.
    if (el.id) return `#${cssEscape(el.id)}`;

    const tag = el.tagName.toLowerCase();

    // 2. dedicated test-hook attributes
    for (const attr of TEST_ATTRS) {
        const v = el.getAttribute(attr);
        if (v) {
            const s = `[${attr}="${cssEscape(v)}"]`;
            if (isUniqueInDocument(s)) return s;
        }
    }

    // 3. form `name` — common for inputs, selects, textareas
    const name = el.getAttribute('name');
    if (name) {
        const s = `${tag}[name="${cssEscape(name)}"]`;
        if (isUniqueInDocument(s)) return s;
    }

    // 4. accessible name via aria-label
    const aria = el.getAttribute('aria-label');
    if (aria) {
        const s = `[aria-label="${cssEscape(aria)}"]`;
        if (isUniqueInDocument(s)) return s;
    }

    // 5. Unique stable class — skip transient UI-state classes.
    if (el instanceof HTMLElement && el.className) {
        const classes = el.className.trim().split(/\s+/).filter(Boolean);
        for (const cls of classes) {
            if (UNSTABLE_CLASS_RE.test(cls)) continue;
            const s = `.${cssEscape(cls)}`;
            if (isUniqueInDocument(s)) return s;
        }
    }

    // 6. Structural fallback
    return structuralSelector(el, options.maxStructuralDepth ?? 5);
}

function structuralSelector(el: Element, maxDepth: number): string {
    const parts: string[] = [];
    let cur: Element | null = el;
    let depth = 0;
    while (cur && cur.nodeType === 1 && depth < maxDepth) {
        if (cur === document.documentElement || cur === document.body) break;
        const tag = cur.tagName.toLowerCase();
        const parent: Element | null = cur.parentElement;
        if (!parent) {
            parts.unshift(tag);
            break;
        }
        const siblings = Array.from(parent.children).filter(
            (c) => c.tagName === cur!.tagName,
        );
        if (siblings.length === 1) {
            parts.unshift(tag);
        } else {
            const idx = siblings.indexOf(cur) + 1;
            parts.unshift(`${tag}:nth-of-type(${idx})`);
        }
        // Early exit — once we hit something with an id, lock the chain
        // to that ancestor so we don't drift further up.
        if (parent.id) {
            parts.unshift(`#${cssEscape(parent.id)}`);
            return parts.join(' > ');
        }
        cur = parent;
        depth += 1;
    }
    return parts.join(' > ');
}

/**
 * Walks up from `start` looking for the nearest "interactive" ancestor —
 * a button, link, form control, or anything with role=button. Recorders
 * usually want to target the meaningful clickable, not the inner `<span>`
 * that happened to be the literal `event.target`.
 */
export function closestInteractive(start: Element | null): HTMLElement | null {
    let cur: Element | null = start;
    while (cur) {
        if (cur instanceof HTMLElement) {
            const tag = cur.tagName;
            if (
                tag === 'BUTTON' ||
                tag === 'A' ||
                tag === 'INPUT' ||
                tag === 'SELECT' ||
                tag === 'TEXTAREA' ||
                tag === 'LABEL' ||
                tag === 'SUMMARY' ||
                cur.hasAttribute('role') ||
                cur.tabIndex >= 0 ||
                cur.onclick !== null
            ) {
                return cur;
            }
        }
        cur = cur.parentElement;
    }
    return start instanceof HTMLElement ? start : null;
}

/**
 * Human-readable label for an element, used in the inspector tooltip and
 * the recorded step list. `<button data-testid="save">Save</button>` →
 * `"button.save · Save"`.
 */
export function describeRecordedElement(el: Element): string {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const testId = el.getAttribute('data-testid');
    const idPart = id || (testId ? `[${testId}]` : '');
    const text = (el.textContent ?? '').trim().slice(0, 32);
    const textPart = text ? ` · ${text}${text.length === 32 ? '…' : ''}` : '';
    return `${tag}${idPart}${textPart}`;
}
