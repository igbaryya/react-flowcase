/**
 * Elements with a programmatic `value` property React tracks via a patched
 * prototype setter.
 */
export type ValuedElement =
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement;

/**
 * Set the element's `value` via its prototype's native setter, bypassing
 * React's monkey-patched setter that would otherwise mark the change as
 * synthetic and skip firing `onChange`.
 *
 * Caller is responsible for dispatching the appropriate event(s) afterwards
 * (`input` for text fields, `change` for selects, etc.).
 */
export function setNativeValue(el: ValuedElement, value: string): void {
    const proto = Object.getPrototypeOf(el) as object;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (nativeSetter) {
        nativeSetter.call(el, value);
    } else {
        el.value = value;
    }
}

/**
 * Promise-returning `setTimeout`. If a `signal` is provided and fires before
 * the delay elapses, the promise resolves early (it does not reject). Callers
 * should check `signal.aborted` after `await sleep(...)` if they need to react.
 */
export const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
    new Promise((resolve) => {
        if (signal?.aborted) {
            resolve();
            return;
        }
        const id = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        const onAbort = () => {
            clearTimeout(id);
            resolve();
        };
        signal?.addEventListener('abort', onAbort, { once: true });
    });
