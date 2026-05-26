import { setNativeValue, sleep } from './dom';

export interface TypeIntoOptions {
    /** Milliseconds between keystrokes. Defaults to 50ms. */
    charDelayMs?: number;
    /** Append to the element's current value instead of replacing it. */
    append?: boolean;
    /** Focus the element before typing. Defaults to true. */
    focus?: boolean;
    /**
     * Aborts typing between keystrokes. The element is left holding whatever
     * was typed up to the abort, and the resolved string reflects that.
     */
    signal?: AbortSignal;
}

type EditableElement = HTMLInputElement | HTMLTextAreaElement;

function isEditable(el: Element | null): el is EditableElement {
    return (
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
    );
}

function writeAndNotify(el: EditableElement, value: string): void {
    setNativeValue(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Simulates a user typing `value` into `element`, one character at a time.
 * Works against controlled and uncontrolled React inputs because it goes
 * through the prototype's native setter and dispatches a bubbling `input`
 * event that React's delegated `onChange` listens for.
 *
 * Returns the final value written, or `undefined` if the target is not an
 * `<input>` or `<textarea>`.
 *
 * Note: this takes an `HTMLElement` directly (not a selector) so callers
 * resolve once and avoid redundant DOM lookups. Use `resolveTarget(target)`
 * if you need to go from a selector / ref to an element first.
 */
export async function typeInto(
    element: HTMLElement | null,
    value: string,
    options?: TypeIntoOptions,
): Promise<string | undefined> {
    if (!isEditable(element)) return undefined;

    const charDelayMs = options?.charDelayMs ?? 50;
    const shouldFocus = options?.focus !== false;
    const append = options?.append === true;
    const signal = options?.signal;

    if (shouldFocus) element.focus();
    if (!append) writeAndNotify(element, '');

    let current = append ? element.value : '';
    for (const char of value) {
        if (signal?.aborted) break;
        current += char;
        writeAndNotify(element, current);
        if (charDelayMs > 0) await sleep(charDelayMs, signal);
        if (signal?.aborted) break;
    }

    element.dispatchEvent(new Event('change', { bubbles: true }));
    return current;
}
