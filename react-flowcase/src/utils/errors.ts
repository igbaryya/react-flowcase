/**
 * Thrown by `useVirtualCursor.moveToElement` when a numeric `wait` deadline
 * elapses before the target's awaitable click handler settles. `runFlow`
 * catches this and translates it into a `failure.reason === 'timeout'`.
 *
 * Callers using `moveToElement` directly should catch this if they pass a
 * numeric `wait`.
 */
export class MoveTimeoutError extends Error {
    readonly __isMoveTimeout = true as const;
    readonly target: string;
    readonly timeoutMs: number;

    constructor(target: string, timeoutMs: number) {
        super(`Wait for ${target} timed out after ${timeoutMs}ms`);
        this.name = 'MoveTimeoutError';
        this.target = target;
        this.timeoutMs = timeoutMs;
    }
}

/** Type guard usable across realms (does not rely on `instanceof`). */
export function isMoveTimeoutError(err: unknown): err is MoveTimeoutError {
    return (
        typeof err === 'object' &&
        err !== null &&
        (err as { __isMoveTimeout?: boolean }).__isMoveTimeout === true
    );
}

/**
 * Thrown by `useVirtualCursor.moveToElement` when the target element is
 * disabled at the moment we'd dispatch the click. Browsers silently ignore
 * clicks on disabled form controls, so detecting this up front lets the flow
 * fail loudly instead of a confusing "success" with no side effects.
 *
 * Detected via the native `disabled` property (on `<button>`, `<input>`,
 * `<select>`, `<textarea>`, `<fieldset>`, `<option>`) and `aria-disabled="true"`.
 *
 * `runFlow` catches this and translates it into `failure.reason === 'target-disabled'`.
 */
export class TargetDisabledError extends Error {
    readonly __isTargetDisabled = true as const;
    readonly target: string;

    constructor(target: string) {
        super(`Cannot click disabled element: ${target}`);
        this.name = 'TargetDisabledError';
        this.target = target;
    }
}

export function isTargetDisabledError(
    err: unknown,
): err is TargetDisabledError {
    return (
        typeof err === 'object' &&
        err !== null &&
        (err as { __isTargetDisabled?: boolean }).__isTargetDisabled === true
    );
}

/**
 * Detect whether an element is "disabled" in a way that would silently swallow
 * a synthetic click. Covers native form-control `disabled` and ARIA's
 * `aria-disabled="true"`.
 */
export function isElementDisabled(el: Element): boolean {
    if ('disabled' in el && (el as { disabled?: boolean }).disabled === true) {
        return true;
    }
    if (el.getAttribute('aria-disabled') === 'true') return true;
    return false;
}

/**
 * Thrown by `waitFor` (and the `'waitFor'` flow step) when the polled
 * predicate hasn't resolved truthy before the deadline. `runFlow` catches
 * this and translates it into `failure.reason === 'timeout'`.
 *
 * Callers using `waitFor` directly should catch this if they pass a non-zero
 * `timeout` (the default is 5000ms).
 */
export class WaitTimeoutError extends Error {
    readonly __isWaitTimeout = true as const;
    readonly description: string;
    readonly timeoutMs: number;

    constructor(description: string, timeoutMs: number) {
        super(`waitFor(${description}) timed out after ${timeoutMs}ms`);
        this.name = 'WaitTimeoutError';
        this.description = description;
        this.timeoutMs = timeoutMs;
    }
}

export function isWaitTimeoutError(err: unknown): err is WaitTimeoutError {
    return (
        typeof err === 'object' &&
        err !== null &&
        (err as { __isWaitTimeout?: boolean }).__isWaitTimeout === true
    );
}
