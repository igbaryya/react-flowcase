import { typeInto } from '../utils/typing';
import { selectOption } from '../utils/select';
import { sleep } from '../utils/dom';
import {
    isElementDisabled,
    isMoveTimeoutError,
    isTargetDisabledError,
    isWaitTimeoutError,
} from '../utils/errors';
import { dispatchKeyPress } from '../utils/keypress';
import { waitFor } from '../utils/waitFor';
import {
    describeTarget,
    resolveTarget,
    type ElementTarget,
} from '../cursor/target';
import type {
    CursorController,
    FlowResult,
    FlowRunOptions,
    FlowStep,
    WaitForState,
} from './types';

/** Dispatches the standard "mouse arrives" event sequence on the target. */
function dispatchHover(el: HTMLElement): void {
    const init: MouseEventInit = { bubbles: true, cancelable: true };
    el.dispatchEvent(new PointerEvent('pointerover', init));
    el.dispatchEvent(new MouseEvent('mouseover', init));
    el.dispatchEvent(new PointerEvent('pointerenter', init));
    el.dispatchEvent(new MouseEvent('mouseenter', init));
    el.dispatchEvent(new MouseEvent('mousemove', init));
}

/**
 * Returns true if the element is at least partially in the viewport. Used
 * by `autoScroll` to skip scrolling when not needed.
 */
function isInViewport(el: HTMLElement): boolean {
    if (typeof window === 'undefined') return true;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return (
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < vh &&
        rect.left < vw
    );
}

/**
 * Brings `el` into the viewport if it isn't already, waits a short tick for
 * the scroll to settle, and respects the abort signal.
 */
async function ensureInViewport(
    el: HTMLElement,
    signal: AbortSignal | undefined,
): Promise<void> {
    if (isInViewport(el)) return;
    el.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    // One animation frame is enough for layout-only (non-smooth) scrolls.
    await sleep(16, signal);
}

/**
 * Executes a `scroll` step. When `targetElement` is provided (the resolved
 * `step.element`), uses `scrollIntoView`. Otherwise interprets `by` / `to`
 * against the optional `container` element, falling back to `window`.
 */
async function performScrollStep(
    step: Extract<FlowStep, { type: 'scroll' }>,
    signal: AbortSignal | undefined,
    targetElement?: HTMLElement,
): Promise<void> {
    const behavior = step.behavior ?? 'smooth';
    const block = step.block ?? 'center';

    if (targetElement) {
        targetElement.scrollIntoView({ behavior, block });
    } else {
        const container = step.container
            ? resolveTarget(step.container, step.index ?? 0).element
            : null;
        const scroller: { scrollTo: (opts: ScrollToOptions) => void } | null =
            container ?? (typeof window !== 'undefined' ? window : null);
        if (!scroller) return;

        if (step.to) {
            scroller.scrollTo({
                left: step.to.x,
                top: step.to.y,
                behavior,
            });
        } else if (step.by) {
            // window has scrollBy too; same shape.
            const target = scroller as unknown as {
                scrollBy?: (opts: ScrollToOptions) => void;
            };
            target.scrollBy?.({
                left: step.by.x,
                top: step.by.y,
                behavior,
            });
        }
    }

    const settleMs = step.settleMs ?? (behavior === 'smooth' ? 350 : 0);
    if (settleMs > 0) await sleep(settleMs, signal);
}

function resolveValue(
    value: string | ((prev: unknown) => string),
    prev: unknown,
): string {
    return typeof value === 'function' ? value(prev) : value;
}

/**
 * Resolves a step's target and emits a `console.warn` when the selector
 * matched multiple elements AND the step didn't explicitly pick one via
 * `index`. Returns the element, or `null` if nothing matched / ref was empty.
 */
function resolveStepTarget(
    target: ElementTarget | undefined,
    index: number | undefined,
): HTMLElement | null {
    if (target === undefined) return null;
    const result = resolveTarget(target, index ?? 0);
    if (
        typeof target === 'string' &&
        result.matchCount > 1 &&
        index === undefined
    ) {
        // eslint-disable-next-line no-console
        console.warn(
            `[runFlow] selector ${JSON.stringify(target)} matched ${result.matchCount} elements; using the first. Set step.index to pick a specific match (or use a more specific selector).`,
        );
    }
    return result.element;
}

/**
 * Matches an element against a `WaitForStep.state`. Returns `true` when the
 * element satisfies the requested state, `false` otherwise. `'detached'`
 * uniquely accepts `null` (the absence of the element is the success case).
 */
function matchesWaitState(
    el: HTMLElement | null,
    state: WaitForState,
): boolean {
    if (state === 'detached') return el === null || !el.isConnected;
    if (!el) return false;
    if (state === 'attached') return el.isConnected;
    if (state === 'enabled') {
        return el.isConnected && !isElementDisabled(el);
    }
    // 'visible' (default): in the DOM, rendered, and has dimensions.
    if (!el.isConnected) return false;
    if (typeof window === 'undefined') return true;
    const cs = window.getComputedStyle(el);
    if (
        cs.display === 'none' ||
        cs.visibility === 'hidden' ||
        cs.opacity === '0'
    ) {
        return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

/**
 * Runs an automation flow against a cursor controller. Pure async function -
 * no React required. Each step's outcome is forwarded to the next step's
 * `value(prev)` if provided.
 *
 * The cursor moves to every step's target first, then performs the step's
 * action (click / type / select).
 */
export async function runFlow(
    cursor: CursorController,
    steps: FlowStep[],
    options: FlowRunOptions = {},
): Promise<FlowResult> {
    cursor.onFlowStart?.();
    try {
        return await runFlowInner(cursor, steps, options);
    } finally {
        cursor.onFlowEnd?.();
    }
}

async function runFlowInner(
    cursor: CursorController,
    steps: FlowStep[],
    options: FlowRunOptions,
): Promise<FlowResult> {
    let prevOutcome: unknown = undefined;
    const signal = options.signal;

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        if (signal?.aborted) {
            options.onStepEvent?.({ phase: 'cancelled', step, index: i });
            return {
                completed: false,
                lastOutcome: prevOutcome,
                failure: { step, reason: 'cancelled' },
            };
        }

        let outcome: unknown = undefined;

        options.onStepEvent?.({ phase: 'start', step, index: i });

        // Delay steps don't target an element — handle them first.
        if (step.type === 'delay') {
            await sleep(step.duration, signal);
            if (signal?.aborted) {
                options.onStepEvent?.({
                    phase: 'cancelled',
                    step,
                    index: i,
                });
                return {
                    completed: false,
                    lastOutcome: prevOutcome,
                    failure: { step, reason: 'cancelled' },
                };
            }
            options.onStep?.(step, undefined);
            options.onStepEvent?.({
                phase: 'success',
                step,
                index: i,
                outcome: undefined,
            });
            continue;
        }

        // waitFor steps poll until ready (or until timeout). They may not
        // target an element synchronously — the whole point is to wait for
        // it to appear / become enabled / disappear.
        if (step.type === 'waitFor') {
            const hasElement = step.element !== undefined;
            const hasCondition = step.condition !== undefined;
            if (hasElement === hasCondition) {
                // Either both set or neither — misconfiguration. Fail loudly.
                options.onStepEvent?.({
                    phase: 'element-not-found',
                    step,
                    index: i,
                });
                if (!step.moveOnFailure) {
                    return {
                        completed: false,
                        lastOutcome: prevOutcome,
                        failure: {
                            step,
                            reason: 'element-not-found',
                            cause: new Error(
                                'waitFor step must specify exactly one of `element` or `condition`',
                            ),
                        },
                    };
                }
                prevOutcome = undefined;
                continue;
            }

            const desiredState: WaitForState = step.state ?? 'visible';
            const elementTarget = step.element;
            const description = elementTarget
                ? `${describeTarget(elementTarget)} → ${desiredState}`
                : 'condition';
            const predicate = elementTarget
                ? () =>
                      matchesWaitState(
                          resolveTarget(elementTarget, step.index ?? 0)
                              .element,
                          desiredState,
                      )
                  : step.condition!;

            try {
                await waitFor(predicate, {
                    timeout: step.timeout,
                    pollInterval: step.pollInterval,
                    signal,
                    description,
                });
            } catch (err) {
                if (!isWaitTimeoutError(err)) throw err;
                options.onStepEvent?.({ phase: 'timeout', step, index: i });
                if (!step.moveOnFailure) {
                    return {
                        completed: false,
                        lastOutcome: prevOutcome,
                        failure: { step, reason: 'timeout', cause: err },
                    };
                }
                prevOutcome = undefined;
                continue;
            }

            if (signal?.aborted) {
                options.onStepEvent?.({
                    phase: 'cancelled',
                    step,
                    index: i,
                });
                return {
                    completed: false,
                    lastOutcome: prevOutcome,
                    failure: { step, reason: 'cancelled' },
                };
            }

            // Optional cursor flourish: slide over the element now that it
            // exists. Skipped for condition mode and for 'detached' (there
            // is no element to move to).
            if (step.moveTo && elementTarget && desiredState !== 'detached') {
                const settled = resolveStepTarget(elementTarget, step.index);
                if (settled) {
                    await cursor.moveToElement(settled, {
                        signal,
                        ...step.move,
                    });
                }
            }

            options.onStep?.(step, undefined);
            options.onStepEvent?.({
                phase: 'success',
                step,
                index: i,
                outcome: undefined,
            });
            continue;
        }

        // keypress and scroll can run without an explicit element target —
        // keypress falls back to document.activeElement, scroll to window /
        // a named container. Handle those branches before the strict
        // element-resolution path below.
        if (step.type === 'keypress' && step.element === undefined) {
            try {
                const repeat = Math.max(1, step.repeat ?? 1);
                const interval = step.interval ?? 80;
                for (let r = 0; r < repeat; r++) {
                    dispatchKeyPress({
                        key: step.key,
                        modifiers: step.modifiers,
                    });
                    if (r < repeat - 1) {
                        await sleep(interval, signal);
                        if (signal?.aborted) break;
                    }
                }
            } catch (err) {
                if (!step.moveOnFailure) {
                    return {
                        completed: false,
                        lastOutcome: prevOutcome,
                        failure: {
                            step,
                            reason: 'element-not-found',
                            cause: err,
                        },
                    };
                }
            }
            if (signal?.aborted) {
                options.onStepEvent?.({ phase: 'cancelled', step, index: i });
                return {
                    completed: false,
                    lastOutcome: prevOutcome,
                    failure: { step, reason: 'cancelled' },
                };
            }
            options.onStep?.(step, undefined);
            options.onStepEvent?.({
                phase: 'success',
                step,
                index: i,
                outcome: undefined,
            });
            prevOutcome = undefined;
            continue;
        }

        if (step.type === 'scroll' && step.element === undefined) {
            await performScrollStep(step, signal);
            if (signal?.aborted) {
                options.onStepEvent?.({ phase: 'cancelled', step, index: i });
                return {
                    completed: false,
                    lastOutcome: prevOutcome,
                    failure: { step, reason: 'cancelled' },
                };
            }
            options.onStep?.(step, undefined);
            options.onStepEvent?.({
                phase: 'success',
                step,
                index: i,
                outcome: undefined,
            });
            prevOutcome = undefined;
            continue;
        }

        // All other step types target an element.
        const element = resolveStepTarget(step.element, step.index);
        if (!element) {
            options.onStepEvent?.({
                phase: 'element-not-found',
                step,
                index: i,
            });
            if (!step.moveOnFailure) {
                return {
                    completed: false,
                    lastOutcome: prevOutcome,
                    failure: {
                        step,
                        reason: 'element-not-found',
                    },
                };
            }
            prevOutcome = undefined;
            continue;
        }

        // Optional: bring off-screen targets into the viewport before the
        // cursor moves. Disabled by default so existing flows are unaffected.
        if (options.autoScroll) {
            await ensureInViewport(element, signal);
            if (signal?.aborted) {
                options.onStepEvent?.({
                    phase: 'cancelled',
                    step,
                    index: i,
                });
                return {
                    completed: false,
                    lastOutcome: prevOutcome,
                    failure: { step, reason: 'cancelled' },
                };
            }
        }

        switch (step.type) {
            case 'click': {
                try {
                    outcome = await cursor.moveToElement(element, {
                        click: true,
                        wait: step.wait,
                        signal,
                        ...step.move,
                    });
                } catch (err) {
                    const phase = isMoveTimeoutError(err)
                        ? ('timeout' as const)
                        : isTargetDisabledError(err)
                          ? ('target-disabled' as const)
                          : null;
                    if (phase === null) throw err;

                    options.onStepEvent?.({ phase, step, index: i });
                    if (!step.moveOnFailure) {
                        return {
                            completed: false,
                            lastOutcome: prevOutcome,
                            failure: {
                                step,
                                reason: phase,
                                cause: err,
                            },
                        };
                    }
                    prevOutcome = undefined;
                    continue;
                }
                break;
            }
            case 'input': {
                await cursor.moveToElement(element, {
                    signal,
                    ...step.move,
                });
                const value = resolveValue(step.value, prevOutcome);
                outcome = await typeInto(element, value, {
                    charDelayMs: step.charDelayMs,
                    append: step.append,
                    signal,
                });
                break;
            }
            case 'select': {
                await cursor.moveToElement(element, {
                    signal,
                    ...step.move,
                });
                const value = resolveValue(step.value, prevOutcome);
                outcome = selectOption(element, value);
                break;
            }
            case 'hover': {
                await cursor.moveToElement(element, {
                    signal,
                    ...step.move,
                });
                if (!signal?.aborted) {
                    dispatchHover(element);
                    await sleep(step.duration ?? 600, signal);
                }
                outcome = undefined;
                break;
            }
            case 'keypress': {
                if (step.moveTo !== false) {
                    await cursor.moveToElement(element, {
                        signal,
                        ...step.move,
                    });
                    if (signal?.aborted) break;
                }
                const repeat = Math.max(1, step.repeat ?? 1);
                const interval = step.interval ?? 80;
                for (let r = 0; r < repeat; r++) {
                    dispatchKeyPress({
                        element,
                        key: step.key,
                        modifiers: step.modifiers,
                    });
                    if (r < repeat - 1) {
                        await sleep(interval, signal);
                        if (signal?.aborted) break;
                    }
                }
                outcome = undefined;
                break;
            }
            case 'scroll': {
                await performScrollStep(step, signal, element);
                outcome = undefined;
                break;
            }
            default: {
                const _exhaustive: never = step;
                return {
                    completed: false,
                    lastOutcome: prevOutcome,
                    failure: {
                        step: _exhaustive,
                        reason: 'unknown-step-type',
                    },
                };
            }
        }

        // Cancellation observed mid-step: stop without firing onStep/assertion
        // — the step did not complete its intended work.
        if (signal?.aborted) {
            options.onStepEvent?.({
                phase: 'cancelled',
                step,
                index: i,
                outcome,
            });
            return {
                completed: false,
                lastOutcome: outcome,
                failure: { step, reason: 'cancelled' },
            };
        }

        options.onStep?.(step, outcome);

        const assertion = ('assert' in step ? step.assert : undefined) as
            | ((value: unknown) => boolean)
            | undefined;
        if (assertion && !assertion(outcome)) {
            options.onAssertFail?.(step, outcome);
            options.onStepEvent?.({
                phase: 'assertion-failed',
                step,
                index: i,
                outcome,
            });
            if (!step.moveOnFailure) {
                return {
                    completed: false,
                    lastOutcome: outcome,
                    failure: { step, reason: 'assertion-failed' },
                };
            }
        } else {
            options.onStepEvent?.({
                phase: 'success',
                step,
                index: i,
                outcome,
            });
        }

        prevOutcome = outcome;
    }

    return { completed: true, lastOutcome: prevOutcome };
}

// Re-export describeTarget so consumers can log step targets uniformly with
// what the runner sees, without importing from the cursor module.
export { describeTarget };
