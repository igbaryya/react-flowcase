import type { KeyModifier } from '../flow/types';

/**
 * Names of keys that are NOT character-producing (e.g. arrows, Enter, Tab).
 * For these we skip the `keypress` event; modern browsers don't fire it for
 * non-printable keys, and node `<input>` handlers don't expect it either.
 */
const NON_PRINTABLE_KEYS = new Set([
    'Escape',
    'Tab',
    'Enter',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'PageUp',
    'PageDown',
    'Backspace',
    'Delete',
    'Insert',
    'F1',
    'F2',
    'F3',
    'F4',
    'F5',
    'F6',
    'F7',
    'F8',
    'F9',
    'F10',
    'F11',
    'F12',
]);

/**
 * Best-effort `code` derivation from a `key` value. Browsers expose both
 * properties; some apps (especially shortcut listeners) read `event.code`
 * rather than `event.key`, so we fill in the obvious mappings.
 */
function deriveCode(key: string): string {
    if (key.length === 1) {
        const upper = key.toUpperCase();
        if (upper >= 'A' && upper <= 'Z') return `Key${upper}`;
        if (key >= '0' && key <= '9') return `Digit${key}`;
        if (key === ' ') return 'Space';
    }
    return key;
}

interface KeyPressTargetState {
    /** Element to fire on. */
    element: Element;
    /** Original `value` so we can simulate Backspace / Enter natively for inputs. */
    initialValue?: string;
}

function getEventTarget(explicit?: Element | null): Element {
    if (explicit) return explicit;
    if (typeof document === 'undefined') {
        throw new Error('keypress: no document available');
    }
    return (document.activeElement as Element | null) ?? document.body;
}

function buildInit(
    key: string,
    modifiers: KeyModifier[],
): KeyboardEventInit {
    return {
        key,
        code: deriveCode(key),
        bubbles: true,
        cancelable: true,
        shiftKey: modifiers.includes('shift'),
        ctrlKey: modifiers.includes('ctrl'),
        altKey: modifiers.includes('alt'),
        metaKey: modifiers.includes('meta'),
    };
}

/**
 * Mutates a text-input's value the way a real key would, for the small set
 * of keys that affect text content: printable characters, Backspace, Delete.
 * Skips when the element is not a text-like input (so the keyboard event
 * still fires but the input is left untouched).
 */
function applyKeyToInput(
    el: Element,
    key: string,
    state: KeyPressTargetState,
): boolean {
    const isInput =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement;
    if (!isInput) return false;

    const input = el as HTMLInputElement | HTMLTextAreaElement;
    const current = input.value;
    let next: string | undefined;

    if (key.length === 1 && !NON_PRINTABLE_KEYS.has(key)) {
        next = current + key;
    } else if (key === 'Backspace') {
        next = current.slice(0, -1);
    } else if (key === 'Delete') {
        next = current; // caret-relative deletion isn't tracked here
    } else {
        return false;
    }

    if (next === undefined || next === current) return false;
    const setter =
        el instanceof HTMLInputElement
            ? Object.getOwnPropertyDescriptor(
                  HTMLInputElement.prototype,
                  'value',
              )?.set
            : Object.getOwnPropertyDescriptor(
                  HTMLTextAreaElement.prototype,
                  'value',
              )?.set;
    setter?.call(input, next);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    state.initialValue = next;
    return true;
}

export interface DispatchKeyPressOptions {
    element?: Element | null;
    key: string;
    modifiers?: KeyModifier[];
}

/**
 * Dispatches a single keypress sequence (`keydown` → optional `keypress` →
 * `keyup`) on the target. Also mutates the value of text inputs for
 * character keys and Backspace, so flows that send keys to `<input>` see
 * the typed value reflected in the DOM (and React's onChange fires).
 *
 * Returns `true` if any handler called `preventDefault()` on the `keydown`.
 */
export function dispatchKeyPress(options: DispatchKeyPressOptions): boolean {
    const modifiers = options.modifiers ?? [];
    const target = getEventTarget(options.element ?? null);
    const init = buildInit(options.key, modifiers);
    const state: KeyPressTargetState = { element: target };

    const downEvt = new KeyboardEvent('keydown', init);
    const downPrevented = !target.dispatchEvent(downEvt);

    if (!downPrevented) {
        const isPrintable =
            options.key.length === 1 && !NON_PRINTABLE_KEYS.has(options.key);
        if (isPrintable) {
            const pressEvt = new KeyboardEvent('keypress', init);
            target.dispatchEvent(pressEvt);
        }
        applyKeyToInput(target, options.key, state);
    }

    const upEvt = new KeyboardEvent('keyup', init);
    target.dispatchEvent(upEvt);

    return downPrevented;
}
