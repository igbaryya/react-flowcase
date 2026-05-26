export type EasingFn = (t: number) => number;

export const easeInOutCubic: EasingFn = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const linear: EasingFn = (t) => t;

export interface TweenOptions {
    duration?: number;
    easing?: EasingFn;
    onUpdate: (progress: number) => void;
    /** If provided, aborting the signal cancels the tween mid-flight. */
    signal?: AbortSignal;
}

export interface TweenHandle {
    promise: Promise<void>;
    cancel: () => void;
}

export function tween({
    duration = 600,
    easing = easeInOutCubic,
    onUpdate,
    signal,
}: TweenOptions): TweenHandle {
    let rafId = 0;
    let cancelled = false;
    let resolveFn: () => void = () => {};
    let onAbort: (() => void) | null = null;

    const cancel = () => {
        if (cancelled) return;
        cancelled = true;
        cancelAnimationFrame(rafId);
        if (onAbort && signal) {
            signal.removeEventListener('abort', onAbort);
            onAbort = null;
        }
        resolveFn();
    };

    const promise = new Promise<void>((resolve) => {
        resolveFn = resolve;
        if (signal?.aborted) {
            cancel();
            return;
        }
        if (signal) {
            onAbort = cancel;
            signal.addEventListener('abort', onAbort, { once: true });
        }

        const start = performance.now();
        const step = (now: number) => {
            if (cancelled) return;
            const t =
                duration <= 0 ? 1 : Math.min(1, (now - start) / duration);
            onUpdate(easing(t));
            if (t < 1) {
                rafId = requestAnimationFrame(step);
            } else {
                if (onAbort && signal) {
                    signal.removeEventListener('abort', onAbort);
                    onAbort = null;
                }
                resolve();
            }
        };

        rafId = requestAnimationFrame(step);
    });

    return { promise, cancel };
}
