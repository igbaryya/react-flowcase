import { useCallback, useEffect, useRef, useState } from 'react';
import type { FlowStep, KeyModifier } from '../flow/types';
import {
    bestSelector,
    closestInteractive,
    type BestSelectorOptions,
} from './selectorBuilder';

/**
 * Subset of `FlowStep` that the recorder can actually emit from observing
 * DOM events. `delay` and `waitFor` aren't observable, so we don't
 * synthesize them — users add those by hand after copying the flow.
 */
export type RecordedStep = Extract<
    FlowStep,
    { type: 'click' | 'input' | 'select' | 'keypress' }
>;

export type RecorderCaptureKind = 'click' | 'input' | 'select' | 'keypress';

export interface UseFlowRecorderOptions {
    /** Which interaction types to record. Defaults to all four. */
    capture?: RecorderCaptureKind[];
    /**
     * Predicate to skip events. Useful for ignoring elements inside your
     * own dev tooling. Receives the element that would otherwise be
     * recorded; return `true` to ignore.
     */
    ignore?: (el: Element) => boolean;
    /** Selector strategy overrides forwarded to `bestSelector`. */
    selectorOptions?: BestSelectorOptions;
    /** Auto-start recording on mount. Defaults to false. */
    autoStart?: boolean;
    /** Called every time a step is appended (or the last step is updated). */
    onChange?: (flow: RecordedStep[]) => void;
}

export interface UseFlowRecorderResult {
    /** Current recorded flow. */
    flow: RecordedStep[];
    /** True while DOM events are being observed. */
    recording: boolean;
    /** True while the user has the element-picker overlay armed. */
    inspecting: boolean;
    /** Element currently under the inspector crosshair, when active. */
    hoveredElement: Element | null;
    start: () => void;
    stop: () => void;
    /** Drops all recorded steps. */
    clear: () => void;
    /** Toggle the inspector overlay (pick-to-insert mode). */
    toggleInspect: () => void;
    setInspecting: (next: boolean) => void;
    /** Programmatically append a step (e.g. from a custom picker). */
    push: (step: RecordedStep) => void;
    /** Remove the step at the given index. */
    removeAt: (index: number) => void;
}

const NAMED_KEYS = new Set([
    'Enter',
    'Escape',
    'Tab',
    'Backspace',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'PageUp',
    'PageDown',
]);

// Stable module-level reference so the default `capture` array doesn't change
// on every render — that would force the recording effect to tear down and
// re-attach its document listeners every render, which can interleave badly
// with React's own synthetic-event dispatch (the practical symptom being
// "controlled inputs feel unresponsive" while recording is on).
const DEFAULT_CAPTURE: RecorderCaptureKind[] = [
    'click',
    'input',
    'select',
    'keypress',
];

function readModifiers(e: KeyboardEvent): KeyModifier[] {
    const mods: KeyModifier[] = [];
    if (e.shiftKey) mods.push('shift');
    if (e.ctrlKey) mods.push('ctrl');
    if (e.altKey) mods.push('alt');
    if (e.metaKey) mods.push('meta');
    return mods;
}

/**
 * Observes DOM interactions and turns them into a `FlowStep[]`. Designed
 * to run in development: attach the listeners with `start()`, click and
 * type your way through your UI, then read `flow` to get a copy-pastable
 * automation script.
 *
 * Coalescing: consecutive `input` events on the same field are merged
 * into one step whose `value` is the final value. Switching to a
 * different field starts a fresh step.
 */
export function useFlowRecorder(
    options: UseFlowRecorderOptions = {},
): UseFlowRecorderResult {
    const {
        capture = DEFAULT_CAPTURE,
        ignore,
        selectorOptions,
        autoStart = false,
        onChange,
    } = options;

    const [flow, setFlow] = useState<RecordedStep[]>([]);
    const [recording, setRecording] = useState<boolean>(autoStart);
    const [inspecting, setInspecting] = useState<boolean>(false);
    const [hoveredElement, setHoveredElement] = useState<Element | null>(null);

    const flowRef = useRef<RecordedStep[]>([]);
    flowRef.current = flow;
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const ignoreRef = useRef(ignore);
    ignoreRef.current = ignore;
    // Read inspecting via a ref inside the recording listeners so toggling
    // the inspector doesn't tear down and rebuild the document-level
    // listeners (which would otherwise create a brief window with no
    // listeners and cause subtle ordering glitches with React events).
    const inspectingRef = useRef(inspecting);
    inspectingRef.current = inspecting;

    const emit = useCallback((next: RecordedStep[]) => {
        flowRef.current = next;
        setFlow(next);
        onChangeRef.current?.(next);
    }, []);

    const push = useCallback(
        (step: RecordedStep) => {
            emit([...flowRef.current, step]);
        },
        [emit],
    );

    const replaceLast = useCallback(
        (step: RecordedStep) => {
            const cur = flowRef.current;
            if (cur.length === 0) {
                emit([step]);
                return;
            }
            emit([...cur.slice(0, -1), step]);
        },
        [emit],
    );

    const removeAt = useCallback(
        (index: number) => {
            const cur = flowRef.current;
            if (index < 0 || index >= cur.length) return;
            emit([...cur.slice(0, index), ...cur.slice(index + 1)]);
        },
        [emit],
    );

    const clear = useCallback(() => emit([]), [emit]);

    const start = useCallback(() => setRecording(true), []);
    const stop = useCallback(() => setRecording(false), []);
    const toggleInspect = useCallback(
        () => setInspecting((cur) => !cur),
        [],
    );

    // Recording listeners ---------------------------------------------------
    useEffect(() => {
        if (!recording || typeof document === 'undefined') return;

        const shouldIgnore = (el: Element | null): boolean => {
            if (!el) return true;
            // Skip the recorder's own UI by convention.
            if (el.closest('[data-rca-recorder]')) return true;
            return ignoreRef.current ? ignoreRef.current(el) : false;
        };

        const onClick = (event: MouseEvent) => {
            if (!capture.includes('click')) return;
            // When the user is picking with the inspector overlay we
            // suppress the underlying click and add the step ourselves
            // — that handler is wired below.
            if (inspectingRef.current) return;
            const target = event.target as Element | null;
            if (shouldIgnore(target)) return;
            const interactive = closestInteractive(target);
            if (!interactive) return;
            // <label> "for" clicks also fire on the associated control; we'd
            // rather record the control directly.
            if (interactive instanceof HTMLLabelElement && interactive.control) {
                push({
                    type: 'click',
                    element: bestSelector(
                        interactive.control,
                        selectorOptions,
                    ),
                    wait: true,
                });
                return;
            }
            push({
                type: 'click',
                element: bestSelector(interactive, selectorOptions),
                wait: true,
            });
        };

        const onInput = (event: Event) => {
            if (!capture.includes('input')) return;
            const target = event.target as Element | null;
            if (shouldIgnore(target)) return;
            if (
                !(target instanceof HTMLInputElement) &&
                !(target instanceof HTMLTextAreaElement)
            ) {
                return;
            }
            // Skip checkboxes / radios — they're better represented as clicks.
            if (
                target instanceof HTMLInputElement &&
                (target.type === 'checkbox' || target.type === 'radio')
            ) {
                return;
            }
            const selector = bestSelector(target, selectorOptions);
            const value = target.value;
            const cur = flowRef.current;
            const last = cur[cur.length - 1];
            if (
                last &&
                last.type === 'input' &&
                last.element === selector
            ) {
                replaceLast({ ...last, value });
            } else {
                push({ type: 'input', element: selector, value });
            }
        };

        const onChange = (event: Event) => {
            if (!capture.includes('select')) return;
            const target = event.target as Element | null;
            if (shouldIgnore(target)) return;
            if (!(target instanceof HTMLSelectElement)) return;
            push({
                type: 'select',
                element: bestSelector(target, selectorOptions),
                value: target.value,
            });
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (!capture.includes('keypress')) return;
            if (!NAMED_KEYS.has(event.key)) return;
            const target = event.target as Element | null;
            if (shouldIgnore(target)) return;
            // For typing into an input, Enter on the input is usually
            // captured well enough as a keypress without an element so
            // the recorded flow targets the focused field.
            push({
                type: 'keypress',
                key: event.key,
                modifiers: readModifiers(event),
            });
        };

        document.addEventListener('click', onClick, true);
        document.addEventListener('input', onInput, true);
        document.addEventListener('change', onChange, true);
        document.addEventListener('keydown', onKeyDown, true);

        return () => {
            document.removeEventListener('click', onClick, true);
            document.removeEventListener('input', onInput, true);
            document.removeEventListener('change', onChange, true);
            document.removeEventListener('keydown', onKeyDown, true);
        };
    }, [recording, capture, push, replaceLast, selectorOptions]);

    // Inspector overlay listeners ------------------------------------------
    useEffect(() => {
        if (!inspecting || typeof document === 'undefined') return;

        const shouldSkip = (el: Element | null): boolean => {
            if (!el) return true;
            if (el.closest('[data-rca-recorder]')) return true;
            return ignoreRef.current ? ignoreRef.current(el) : false;
        };

        const onMove = (event: MouseEvent) => {
            const target = event.target as Element | null;
            if (shouldSkip(target)) {
                setHoveredElement(null);
                return;
            }
            const el = closestInteractive(target) ?? target;
            setHoveredElement(el ?? null);
        };

        const onClick = (event: MouseEvent) => {
            const target = event.target as Element | null;
            if (shouldSkip(target)) return;
            const el = closestInteractive(target);
            if (!el) return;
            // Picking should not trigger the underlying handler.
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            push({
                type: 'click',
                element: bestSelector(el, selectorOptions),
                wait: true,
            });
        };

        const onLeave = () => setHoveredElement(null);

        document.addEventListener('mousemove', onMove, true);
        document.addEventListener('click', onClick, true);
        document.addEventListener('mouseleave', onLeave, true);

        return () => {
            document.removeEventListener('mousemove', onMove, true);
            document.removeEventListener('click', onClick, true);
            document.removeEventListener('mouseleave', onLeave, true);
            setHoveredElement(null);
        };
    }, [inspecting, push, selectorOptions]);

    return {
        flow,
        recording,
        inspecting,
        hoveredElement,
        start,
        stop,
        clear,
        toggleInspect,
        setInspecting,
        push,
        removeAt,
    };
}
