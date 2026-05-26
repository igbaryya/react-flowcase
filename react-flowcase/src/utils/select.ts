import { setNativeValue } from './dom';

/**
 * Programmatically select an option in a `<select>` element so React's
 * `onChange` fires. Returns the resulting value, or `undefined` if the
 * element is missing or not a `<select>`.
 *
 * Takes an `HTMLElement` directly (not a selector) so callers resolve once
 * and avoid redundant DOM lookups. Use `resolveTarget(target)` first if you
 * have a selector / ref.
 */
export function selectOption(
    element: HTMLElement | null,
    value: string,
): string | undefined {
    if (!(element instanceof HTMLSelectElement)) return undefined;

    setNativeValue(element, value);
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return element.value;
}
