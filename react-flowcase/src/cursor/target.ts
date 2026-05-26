/**
 * Anything you can hand to a flow step / `moveToElement` to identify a target
 * in the DOM.
 *
 * - `string` — a CSS selector (e.g. `'#submit'`, `'.btn-primary'`,
 *   `'[name="email"]'`, `'form button[type=submit]'`). Resolved via
 *   `document.querySelectorAll(...)`.
 * - `HTMLElement` — a direct DOM reference. Useful when you already have a
 *   handle (e.g. from `document.querySelector` or a test harness).
 * - `{ current: HTMLElement | null }` — a React-style ref object, so you can
 *   pass a `useRef` directly without dereferencing.
 */
export type ElementTarget =
    | string
    | HTMLElement
    | { readonly current: HTMLElement | null };

export interface ResolveResult {
    /** The resolved element, or `null` if missing. */
    element: HTMLElement | null;
    /**
     * Total match count for selector targets (1 for ref/HTMLElement, or 0 if
     * the ref is null). Use this to detect ambiguous selectors.
     */
    matchCount: number;
    /** The index that was used to pick from a multi-match. */
    usedIndex: number;
}

function isRef(
    target: object,
): target is { readonly current: HTMLElement | null } {
    return (
        'current' in target &&
        (target as { current: unknown }).current !== undefined
    );
}

/**
 * Resolves an `ElementTarget` to a concrete `HTMLElement` (or `null`).
 *
 * For string selectors, `document.querySelectorAll` is used so multi-match
 * detection is possible. `index` picks which match to take (defaults to `0`).
 * For refs / direct elements, `index` is ignored and `matchCount` is `1` (or
 * `0` when the ref is empty).
 */
export function resolveTarget(
    target: ElementTarget,
    index = 0,
): ResolveResult {
    if (typeof target === 'string') {
        // Guard against running outside the DOM (SSR, tests without jsdom).
        if (typeof document === 'undefined') {
            return { element: null, matchCount: 0, usedIndex: index };
        }
        const matches = document.querySelectorAll<HTMLElement>(target);
        return {
            element: matches.item(index) ?? null,
            matchCount: matches.length,
            usedIndex: index,
        };
    }
    if (target instanceof HTMLElement) {
        return { element: target, matchCount: 1, usedIndex: 0 };
    }
    if (isRef(target)) {
        const el = target.current;
        return {
            element: el,
            matchCount: el ? 1 : 0,
            usedIndex: 0,
        };
    }
    return { element: null, matchCount: 0, usedIndex: index };
}

/**
 * Returns a short, human-readable label for a target. Used by editor / step
 * indicators when displaying a step's target without resolving it. Accepts
 * `undefined` so callers iterating the `FlowStep` union (where `waitFor` may
 * omit `element`) don't need their own narrowing.
 */
export function describeTarget(target: ElementTarget | undefined): string {
    if (target === undefined) return '<no target>';
    if (typeof target === 'string') return target;
    if (target instanceof HTMLElement) return describeElement(target);
    if (isRef(target)) {
        return target.current
            ? `ref → ${describeElement(target.current)}`
            : 'ref → (empty)';
    }
    return '<invalid target>';
}

/**
 * `<tag#id.cls1.cls2>` short-form for an element. Trimmed to keep it readable
 * in tight UI.
 */
export function describeElement(el: HTMLElement): string {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const cls = el.classList.length
        ? '.' + Array.from(el.classList).slice(0, 2).join('.')
        : '';
    return `<${tag}${id}${cls}>`;
}
