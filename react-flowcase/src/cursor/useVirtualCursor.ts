import { useCallback, useEffect, useRef, useState } from 'react';
import { tween, type TweenHandle } from '../utils/animation';
import { getInflight } from '../awaitable/registry';
import {
    MoveTimeoutError,
    TargetDisabledError,
    isElementDisabled,
} from '../utils/errors';
import {
    describeTarget,
    resolveTarget,
    type ElementTarget,
} from './target';
import type { MoveOptions, MoveToElementOptions, Position } from './types';

export type MoveToElementFn = <T = unknown>(
    target: ElementTarget,
    options?: MoveToElementOptions,
) => Promise<T | undefined>;

/**
 * Policy for when the cursor is automatically made visible / hidden in
 * response to flow lifecycle events emitted by `runFlow`.
 */
export type CursorVisibilityMode = 'always' | 'onStart' | 'never';

export interface UseVirtualCursorOptions {
    /** Starting position. Defaults to `{ x: 0, y: 0 }`. */
    initial?: Position;
    /**
     * Hide the cursor automatically when a flow finishes (success, failure,
     * or cancellation). Ignored when `visibility === 'always'` since "always"
     * implies the cursor stays visible regardless.
     * Defaults to `true`.
     */
    autoHide?: boolean;
    /**
     * When to make the cursor visible automatically.
     * - `'always'`: visible from mount, never auto-hides
     * - `'onStart'`: hidden until a flow starts, then shown (default)
     * - `'never'`: never auto-shown - you control visibility manually via
     *   `show()` / `hide()`
     */
    visibility?: CursorVisibilityMode;
    /**
     * Image URL or data URL for the cursor visual. Surfaced on the hook's
     * result as `appearance` so you can pass it straight to
     * `<VirtualCursor cursor={cursor.appearance} />`.
     *
     * This is the editor-friendly form (it's a plain string, so the settings
     * modal can edit it). For ReactNode / render-function cursors, pass the
     * `cursor` prop to `<VirtualCursor>` directly instead.
     *
     * Omit to use the built-in gradient pointer.
     */
    appearance?: string;
}

export interface UseVirtualCursorResult {
    position: Position;
    visible: boolean;
    /**
     * The `appearance` option, passed through unchanged. Forward to
     * `<VirtualCursor cursor={cursor.appearance} />`.
     */
    appearance: string | undefined;
    show: () => void;
    hide: () => void;
    moveTo: (x: number, y: number, options?: MoveOptions) => Promise<void>;
    moveToElement: MoveToElementFn;
    /**
     * Lifecycle hook invoked by `runFlow` at the start of every run. You
     * generally don't call this yourself - it's part of the `CursorController`
     * contract that lets the cursor react to flow visibility policies.
     */
    onFlowStart: () => void;
    /**
     * Lifecycle hook invoked by `runFlow` after every run settles (success,
     * failure, or cancellation).
     */
    onFlowEnd: () => void;
}

const DEFAULT_POSITION: Position = { x: 0, y: 0 };

export function useVirtualCursor(
    options: UseVirtualCursorOptions = {},
): UseVirtualCursorResult {
    const {
        initial = DEFAULT_POSITION,
        autoHide = true,
        visibility = 'onStart',
        appearance,
    } = options;

    const [position, setPosition] = useState<Position>(initial);
    const [visible, setVisible] = useState<boolean>(visibility === 'always');

    const positionRef = useRef<Position>(initial);
    const activeTweenRef = useRef<TweenHandle | null>(null);

    useEffect(() => {
        return () => {
            activeTweenRef.current?.cancel();
            activeTweenRef.current = null;
        };
    }, []);

    const moveTo = useCallback<UseVirtualCursorResult['moveTo']>(
        (x, y, options) => {
            activeTweenRef.current?.cancel();

            const from = positionRef.current;
            const to: Position = { x, y };

            const handle = tween({
                ...options,
                onUpdate: (t) => {
                    const next: Position = {
                        x: from.x + (to.x - from.x) * t,
                        y: from.y + (to.y - from.y) * t,
                    };
                    positionRef.current = next;
                    setPosition(next);
                },
            });

            activeTweenRef.current = handle;
            return handle.promise;
        },
        [],
    );

    const moveToElement = useCallback(
        async (target: ElementTarget, options?: MoveToElementOptions) => {
            // Accept a pre-resolved HTMLElement directly (runFlow does this
            // after applying step.index and emitting multi-match warnings),
            // or resolve here for direct callers that pass a selector / ref.
            const element =
                target instanceof HTMLElement
                    ? target
                    : resolveTarget(target).element;
            if (!element) return undefined;

            const rect = element.getBoundingClientRect();
            const arrival = moveTo(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                options,
            );
            // Capture synchronously: moveTo() has just assigned activeTweenRef.
            const ownHandle = activeTweenRef.current;

            await arrival;

            const stillCurrent = activeTweenRef.current === ownHandle;
            if (
                options?.signal?.aborted ||
                !options?.click ||
                !stillCurrent ||
                !document.body.contains(element)
            ) {
                return undefined;
            }

            // Disabled elements silently swallow clicks. Fail loudly instead
            // of returning a misleading "success".
            if (isElementDisabled(element)) {
                throw new TargetDisabledError(describeTarget(target));
            }

            element.click();
            if (options.wait === false) return undefined;
            // React event delegation runs the onClick synchronously inside
            // `element.click()`, so any awaitable invocation it kicked off is
            // already registered by the time we read it here.
            const inflight = getInflight(element);
            if (!inflight) return undefined;

            const signal = options.signal;
            const timeoutMs =
                typeof options.wait === 'number' ? options.wait : undefined;

            // Fast path: nothing to race against.
            if (!signal && timeoutMs === undefined) return await inflight;

            // The handler's side effects still run to completion (we can't kill
            // arbitrary user code), but the awaiter resolves/rejects early so
            // the flow can stop or fail with a timeout.
            const racers: Array<Promise<unknown>> = [inflight];
            let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
            let abortHandler: (() => void) | undefined;

            if (signal) {
                racers.push(
                    new Promise<undefined>((resolve) => {
                        if (signal.aborted) {
                            resolve(undefined);
                            return;
                        }
                        abortHandler = () => resolve(undefined);
                        signal.addEventListener('abort', abortHandler, {
                            once: true,
                        });
                    }),
                );
            }
            if (timeoutMs !== undefined) {
                racers.push(
                    new Promise<never>((_, reject) => {
                        timeoutHandle = setTimeout(() => {
                            reject(
                                new MoveTimeoutError(
                                    describeTarget(target),
                                    timeoutMs,
                                ),
                            );
                        }, timeoutMs);
                    }),
                );
            }

            try {
                return (await Promise.race(racers)) as unknown;
            } finally {
                if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
                if (signal && abortHandler) {
                    signal.removeEventListener('abort', abortHandler);
                }
            }
        },
        [moveTo],
    ) as MoveToElementFn;

    const show = useCallback(() => setVisible(true), []);
    const hide = useCallback(() => setVisible(false), []);

    const onFlowStart = useCallback(() => {
        if (visibility !== 'never') setVisible(true);
    }, [visibility]);

    const onFlowEnd = useCallback(() => {
        if (autoHide && visibility !== 'always') setVisible(false);
    }, [autoHide, visibility]);

    return {
        position,
        visible,
        appearance,
        show,
        hide,
        moveTo,
        moveToElement,
        onFlowStart,
        onFlowEnd,
    };
}
