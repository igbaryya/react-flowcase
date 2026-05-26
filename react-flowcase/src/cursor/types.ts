import type { EasingFn } from '../utils/animation';

export interface Position {
    x: number;
    y: number;
}

export interface MoveOptions {
    duration?: number;
    easing?: EasingFn;
    /** Aborts the cursor movement (and any awaited click result) mid-flight. */
    signal?: AbortSignal;
}

export interface MoveToElementOptions extends MoveOptions {
    /** Programmatically click the target element after the cursor arrives. */
    click?: boolean;
    /**
     * Controls how long to wait for the target's awaitable click handler to
     * settle before resolving. Only meaningful when `click === true` and the
     * target's onClick was registered via `useAwaitableClick`.
     *
     * - `true` (default) — wait forever for the handler to settle.
     * - `false` — fire-and-forget, do not wait at all.
     * - `number` — wait up to N ms; if the handler hasn't settled by then,
     *   the promise rejects with `MoveTimeoutError`. Use this to guard
     *   against hanging handlers.
     */
    wait?: boolean | number;
}
