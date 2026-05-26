import { useCallback, useEffect, useRef, useState } from 'react';
import { runFlow } from './runFlow';
import type { FlowPersistence, PersistedFlowState } from './persistence';
import type {
    CursorController,
    FlowResult,
    FlowRunOptions,
    FlowStep,
} from './types';

export interface UseCursorFlowOptions {
    /**
     * Persistence backend for cross-page flow resumption. When provided:
     * - State is saved before each step starts
     * - On mount, if saved state exists and `flow` is provided, the flow
     *   auto-resumes from the persisted step index
     * - State is cleared on completion (success or failure)
     *
     * Use `createSessionStoragePersistence(key)` or
     * `createLocalStoragePersistence(key)` for the common cases.
     */
    persistence?: FlowPersistence;
    /**
     * Full flow definition for auto-resume. Required if you want the hook to
     * automatically continue a persisted flow on mount. The hook slices from
     * `persistedState.stepIndex` and runs the remainder.
     *
     * Define the complete cross-page flow (e.g. Login steps + Dashboard steps)
     * and pass the same definition on every page. The library handles picking
     * up where it left off.
     */
    flow?: FlowStep[];
    /**
     * Run options for auto-resume. Your `onStepEvent` / `onStep` callbacks are
     * merged with the internal persistence handler.
     */
    flowOptions?: FlowRunOptions;
}

export interface UseCursorFlowResult {
    /**
     * Start a flow. If another run is in flight, it is cancelled first.
     * Resolves with the run's `FlowResult` once it settles (success, failure,
     * or cancellation).
     *
     * When persistence is enabled, state is saved before each step. If you
     * want a fresh start (ignoring any persisted state), call
     * `clearPersistence()` first.
     */
    run: (steps: FlowStep[], options?: FlowRunOptions) => Promise<FlowResult>;
    /** Cancel the currently-running flow. No-op if nothing is in flight. */
    cancel: () => void;
    /** True while a run is in flight. */
    running: boolean;
    /**
     * Non-null when there's persisted state from a previous session. Exposed
     * for UI feedback (e.g. "Resuming from step 3..."). Automatically cleared
     * once the resumed flow completes.
     */
    pendingState: PersistedFlowState | null;
    /**
     * Manually clear persisted state. Useful when you want to abandon a
     * partially-completed flow and start fresh.
     */
    clearPersistence: () => void;
}

/**
 * React wrapper around `runFlow` with built-in cancellation and optional
 * cross-page persistence. The hook owns its own `AbortController`; calling
 * `cancel()` aborts it and stops the run between (and where possible inside)
 * steps.
 *
 * ## Persistence / Cross-page flows
 *
 * To continue a flow after page navigation (e.g. Login → redirect → Dashboard):
 *
 * 1. Create a persistence backend once:
 *    ```ts
 *    const persistence = createSessionStoragePersistence('my-flow');
 *    ```
 *
 * 2. Define the full cross-page flow:
 *    ```ts
 *    const fullFlow: FlowStep[] = [
 *      // Login steps
 *      { type: 'input', element: '#user', value: 'admin' },
 *      { type: 'click', element: '#login' },
 *      // Dashboard steps (after redirect)
 *      { type: 'click', element: '#menu' },
 *    ];
 *    ```
 *
 * 3. Pass both to the hook on every page:
 *    ```tsx
 *    const { run, running } = useCursorFlow(cursor, {
 *      persistence,
 *      flow: fullFlow,
 *    });
 *    ```
 *
 * On the first page, call `run(fullFlow)` to start. When the page navigates
 * and the new page mounts, the hook sees the persisted state and auto-resumes
 * from wherever it left off.
 */
export function useCursorFlow(
    cursor: CursorController,
    options: UseCursorFlowOptions = {},
): UseCursorFlowResult {
    const { persistence, flow: autoResumeFlow, flowOptions } = options;

    // Use a ref for cursor so runInternal doesn't get recreated when the
    // cursor's position/visible state changes (which happens frequently during
    // animation). The cursor's methods are stable.
    const cursorRef = useRef(cursor);
    cursorRef.current = cursor;

    const controllerRef = useRef<AbortController | null>(null);
    const [running, setRunning] = useState(false);
    const [pendingState, setPendingState] = useState<PersistedFlowState | null>(
        () => persistence?.load() ?? null,
    );
    // Track if we've triggered an auto-resume (not just scheduled it).
    // This prevents multiple resume attempts if dependencies change.
    const autoResumeTriggeredRef = useRef(false);

    // Track the "base" step index offset when resuming a persisted flow.
    // This lets us persist the correct global index, not the sliced index.
    const stepIndexOffsetRef = useRef(0);

    const clearPersistence = useCallback(() => {
        persistence?.clear();
        setPendingState(null);
    }, [persistence]);

    const runInternal = useCallback(
        async (
            steps: FlowStep[],
            userOptions?: FlowRunOptions,
            stepIndexOffset = 0,
        ) => {
            // Supersede any in-flight run.
            controllerRef.current?.abort();
            const controller = new AbortController();
            controllerRef.current = controller;
            stepIndexOffsetRef.current = stepIndexOffset;

            // Mirror an external signal onto the internal controller.
            const externalSignal = userOptions?.signal;
            let onExternalAbort: (() => void) | null = null;
            if (externalSignal) {
                if (externalSignal.aborted) {
                    controller.abort();
                } else {
                    onExternalAbort = () => controller.abort();
                    externalSignal.addEventListener('abort', onExternalAbort, {
                        once: true,
                    });
                }
            }

            // Merge user's onStepEvent with persistence logic. When resuming
            // a sliced flow, translate the local step index to the global one
            // so consumer indicators / state line up with the original flow.
            const mergedOnStepEvent: FlowRunOptions['onStepEvent'] = (
                event,
            ) => {
                const globalIndex = event.index + stepIndexOffset;

                // Persist AFTER each step succeeds with the NEXT step index.
                // This way, if the handler navigates away mid-flow, we resume
                // from the correct step on the new page (not re-run the one
                // that just completed). Also snapshot the cursor position so
                // it can be restored on the next page without a (0,0) jump.
                if (event.phase === 'success' && persistence) {
                    persistence.save({
                        stepIndex: globalIndex + 1,
                        lastOutcome: event.outcome,
                        startedAt: Date.now(),
                        cursorPosition: cursorRef.current.position,
                    });
                }

                // Forward with the translated global index so the consumer
                // sees the index relative to the full flow.
                userOptions?.onStepEvent?.(
                    stepIndexOffset === 0
                        ? event
                        : { ...event, index: globalIndex },
                );
            };

            setRunning(true);
            try {
                const result = await runFlow(cursorRef.current, steps, {
                    ...userOptions,
                    signal: controller.signal,
                    onStepEvent: mergedOnStepEvent,
                });
                // Flow completed (success or failure) — clear persistence.
                clearPersistence();
                return result;
            } finally {
                if (externalSignal && onExternalAbort) {
                    externalSignal.removeEventListener(
                        'abort',
                        onExternalAbort,
                    );
                }
                if (controllerRef.current === controller) {
                    controllerRef.current = null;
                }
                setRunning(false);
            }
        },
        [persistence, clearPersistence],
    );

    const run = useCallback(
        (steps: FlowStep[], userOptions?: FlowRunOptions) =>
            runInternal(steps, userOptions, 0),
        [runInternal],
    );

    const cancel = useCallback(() => {
        controllerRef.current?.abort();
    }, []);

    // Store flowOptions in a ref so we can access the latest value in the
    // effect without making it a dependency (which would reset the timer).
    const flowOptionsRef = useRef(flowOptions);
    flowOptionsRef.current = flowOptions;

    // Auto-resume on mount if there's persisted state and a flow definition.
    useEffect(() => {
        if (
            !pendingState ||
            !autoResumeFlow ||
            running ||
            autoResumeTriggeredRef.current
        ) {
            return undefined;
        }

        const remainingSteps = autoResumeFlow.slice(pendingState.stepIndex);
        if (remainingSteps.length === 0) {
            // All steps already completed — clear stale state.
            clearPersistence();
            return undefined;
        }

        // Small delay to let the page finish rendering (elements need
        // to exist before we can target them).
        const timer = setTimeout(() => {
            // Double-check the ref in case cleanup ran but the timeout still fired.
            if (autoResumeTriggeredRef.current) return;
            autoResumeTriggeredRef.current = true;
            void runInternal(
                remainingSteps,
                flowOptionsRef.current,
                pendingState.stepIndex,
            );
        }, 100);

        return () => {
            clearTimeout(timer);
        };
    }, [pendingState, autoResumeFlow, running, runInternal, clearPersistence]);

    // Cleanup on unmount.
    useEffect(() => {
        return () => {
            controllerRef.current?.abort();
            controllerRef.current = null;
        };
    }, []);

    return { run, cancel, running, pendingState, clearPersistence };
}
