import type { MoveOptions, Position } from '../cursor/types';
import { describeTarget, type ElementTarget } from '../cursor/target';

interface FlowStepBase {
    /**
     * Target element for this step. Accepts a CSS selector string
     * (`'#submit'`, `'.btn-primary'`, `'[name="email"]'`), a React-style ref
     * (`{ current: HTMLElement | null }`), or a raw `HTMLElement`.
     */
    element: ElementTarget;
    /**
     * For string selectors that match multiple elements, picks which one to
     * use (zero-based). Defaults to `0`. Setting `index` also silences the
     * multi-match `console.warn` (you've told us the ambiguity is intentional).
     */
    index?: number;
    /**
     * If the step fails (assertion, timeout, or missing element), continue to
     * the next step instead of aborting the flow. Defaults to false.
     */
    moveOnFailure?: boolean;
    /** Animation overrides for the cursor move to this element. */
    move?: MoveOptions;
}

/** A step that moves the cursor to an element and clicks it. */
export interface ClickStep<T = unknown> extends FlowStepBase {
    type: 'click';
    /**
     * Controls how long to wait for the target's awaitable click handler to
     * settle before resolving this step.
     *
     * - `true` (default) — wait forever.
     * - `false` — fire-and-forget, do not wait.
     * - `number` — wait up to N ms. If the handler hasn't settled by then the
     *   step fails with `failure.reason === 'timeout'` (or moves on when
     *   `moveOnFailure` is set).
     */
    wait?: boolean | number;
    assert?: (result: T | undefined) => boolean;
}

/** A step that moves the cursor to an input/textarea and types into it. */
export interface InputStep extends FlowStepBase {
    type: 'input';
    /** Either a fixed string or a fn that derives it from the previous outcome. */
    value: string | ((prevOutcome: unknown) => string);
    /** Milliseconds between keystrokes. Defaults to 50ms. */
    charDelayMs?: number;
    /** Append to the current value instead of replacing it. */
    append?: boolean;
    assert?: (typed: string | undefined) => boolean;
}

/** A step that moves the cursor to a <select> and chooses an option. */
export interface SelectStep extends FlowStepBase {
    type: 'select';
    /** Either a fixed option value or a fn deriving it from the previous outcome. */
    value: string | ((prevOutcome: unknown) => string);
    assert?: (selected: string | undefined) => boolean;
}

/**
 * A pure delay step — pauses for `duration` ms without moving the cursor or
 * targeting any element. Useful for waiting after a page navigation, giving
 * animations time to settle, or adding dramatic pauses in demos.
 */
export interface DelayStep {
    type: 'delay';
    /** Milliseconds to wait before continuing to the next step. */
    duration: number;
}

/** Element states a `waitFor` step can poll for. Defaults to `'visible'`. */
export type WaitForState = 'attached' | 'visible' | 'enabled' | 'detached';

/**
 * Wait for an element to reach a state — or for an arbitrary condition to
 * return truthy — before continuing. Unlike `delay`, this step polls the DOM
 * (or your predicate) until the deadline. Use it whenever you'd otherwise
 * guess at a delay duration: lazy-loaded data, animated reveals, modals that
 * mount on click.
 *
 * Two mutually-exclusive modes:
 * - **Element**: pass `element` (+ optional `state`). The runner polls until
 *   `resolveTarget(element)` matches `state`.
 * - **Condition**: pass `condition: () => boolean | Promise<boolean>`. The
 *   runner polls the predicate.
 *
 * On timeout the step fails with `failure.reason === 'timeout'` (`StepEvent`
 * phase `'timeout'`). Respects `moveOnFailure`.
 *
 * The cursor stays put while waiting; pass `moveTo: true` to slide it over
 * the resolved element once it's ready (element mode only).
 */
export interface WaitForStep {
    type: 'waitFor';
    /** Element target. Mutually exclusive with `condition`. */
    element?: ElementTarget;
    /** Element state to poll for. Defaults to `'visible'`. */
    state?: WaitForState;
    /** Multi-match index for string selectors. Defaults to 0. */
    index?: number;
    /** Predicate. Mutually exclusive with `element`. */
    condition?: () => boolean | Promise<boolean>;
    /** Max time to wait in ms. Defaults to 5000. */
    timeout?: number;
    /** Polling interval in ms. Defaults to 50. */
    pollInterval?: number;
    /** Move the cursor to the element once ready (element mode only). */
    moveTo?: boolean;
    /** Animation overrides for the optional `moveTo` motion. */
    move?: MoveOptions;
    /** Continue to the next step on timeout instead of aborting the flow. */
    moveOnFailure?: boolean;
}

/**
 * A step that moves the cursor over an element and dispatches the standard
 * "mouse is on top of me" events (`pointerover`, `mouseover`, `pointerenter`,
 * `mouseenter`, `mousemove`) without clicking. Use it for tooltips, hover
 * menus, popovers — anything that reveals on `:hover` or `onMouseEnter`.
 *
 * `duration` controls how long the cursor lingers after the move resolves,
 * giving hover-driven UI time to settle (and for the demo to actually be
 * watchable). Defaults to 600ms.
 */
export interface HoverStep extends FlowStepBase {
    type: 'hover';
    /** Milliseconds to hold the cursor on the element after arriving. Defaults to 600. */
    duration?: number;
}

/** Modifier keys that can be combined with a `keypress` step's `key`. */
export type KeyModifier = 'shift' | 'ctrl' | 'alt' | 'meta';

/**
 * Dispatches a keyboard event sequence (`keydown` → optional `keypress` →
 * `keyup`) on the target element. If `element` is omitted, the event is
 * dispatched on `document.activeElement` (falling back to `document.body`),
 * which matches how a real user's keyboard targets the focused element.
 *
 * `key` accepts either a printable character (`'a'`, `'1'`) or a named key
 * (`'Enter'`, `'Escape'`, `'Tab'`, `'ArrowDown'`, …). For printable keys
 * inside inputs you usually want `type: 'input'` instead — `keypress` is for
 * navigation, shortcuts, and modal dismissal.
 */
export interface KeyPressStep {
    type: 'keypress';
    /** Optional target. Defaults to the currently focused element. */
    element?: ElementTarget;
    /** Multi-match index for string selectors. Defaults to 0. */
    index?: number;
    /** The key to press (e.g. `'Enter'`, `'Escape'`, `'ArrowDown'`, `'a'`). */
    key: string;
    /** Modifier keys to hold while dispatching. Empty array = no modifiers. */
    modifiers?: KeyModifier[];
    /** Repeat the keypress N times. Defaults to 1. */
    repeat?: number;
    /** Milliseconds between repeats. Defaults to 80. */
    interval?: number;
    /** Move the cursor to the target before dispatching. Defaults to true when `element` is set. */
    moveTo?: boolean;
    /** Animation overrides for the optional `moveTo` motion. */
    move?: MoveOptions;
    /** Continue to the next step on failure (e.g. missing element) instead of aborting. */
    moveOnFailure?: boolean;
}

/**
 * Scrolls the page (or a specified scrollable container) until a target
 * element is in view, or by an explicit delta / to an absolute position.
 * Exactly one of `element`, `by`, or `to` should be set.
 *
 * Useful for:
 *   - Bringing lazy-loaded items into the viewport before clicking them
 *   - Scrolling lists / dialogs / sidebars (`container` + `by`)
 *   - Jumping to the top/bottom of a page (`to: { y: 0 }`)
 */
export interface ScrollStep {
    type: 'scroll';
    /** Scroll this element into view. */
    element?: ElementTarget;
    /** Multi-match index for string selectors. Defaults to 0. */
    index?: number;
    /**
     * Scrollable container to scroll. Defaults to the document/window when
     * not provided. Used with `by` / `to`.
     */
    container?: ElementTarget;
    /** Relative scroll delta. */
    by?: { x?: number; y?: number };
    /** Absolute scroll position. */
    to?: { x?: number; y?: number };
    /** Scroll animation. Defaults to `'smooth'`. */
    behavior?: 'auto' | 'smooth';
    /** `scrollIntoView` block alignment when targeting an element. Defaults to `'center'`. */
    block?: 'start' | 'center' | 'end' | 'nearest';
    /** Milliseconds to pause after the scroll. Defaults to 350 for smooth, 0 for auto. */
    settleMs?: number;
    /** Continue to the next step on failure (e.g. missing element). */
    moveOnFailure?: boolean;
}

export type FlowStep =
    | ClickStep
    | InputStep
    | SelectStep
    | DelayStep
    | WaitForStep
    | HoverStep
    | KeyPressStep
    | ScrollStep;

/**
 * Short, human-readable label for any step's target. Handles all step types,
 * including non-targeting ones (`delay` → `"1000ms"`, `waitFor` with
 * `condition` → `"<condition>"`). Use this when logging or rendering step
 * lists so every step type produces a sensible label.
 */
export function describeStep(step: FlowStep): string {
    if (step.type === 'delay') return `${step.duration}ms`;
    if (step.type === 'waitFor') {
        if (step.element !== undefined) {
            const state = step.state ?? 'visible';
            return `${describeTarget(step.element)} → ${state}`;
        }
        return step.condition ? '<condition>' : '<waitFor>';
    }
    if (step.type === 'keypress') {
        const target = step.element
            ? describeTarget(step.element)
            : '<focused>';
        const mods = (step.modifiers ?? []).join('+');
        const keyDesc = mods ? `${mods}+${step.key}` : step.key;
        const repeat =
            step.repeat && step.repeat > 1 ? ` ×${step.repeat}` : '';
        return `${target} ⌨ ${keyDesc}${repeat}`;
    }
    if (step.type === 'scroll') {
        if (step.element !== undefined) {
            return `scroll → ${describeTarget(step.element)}`;
        }
        if (step.by) {
            const parts: string[] = [];
            if (step.by.x !== undefined) parts.push(`x ${step.by.x}`);
            if (step.by.y !== undefined) parts.push(`y ${step.by.y}`);
            return `scroll by ${parts.join(' ')}`.trim();
        }
        if (step.to) {
            const parts: string[] = [];
            if (step.to.x !== undefined) parts.push(`x ${step.to.x}`);
            if (step.to.y !== undefined) parts.push(`y ${step.to.y}`);
            return `scroll to ${parts.join(' ')}`.trim();
        }
        return 'scroll';
    }
    return describeTarget(step.element);
}

/** Lifecycle phases reported per step. Used by `onStepEvent`. */
export type StepEventPhase =
    | 'start'
    | 'success'
    | 'assertion-failed'
    | 'timeout'
    | 'element-not-found'
    | 'target-disabled'
    | 'cancelled';

export interface StepEvent {
    phase: StepEventPhase;
    step: FlowStep;
    /** Zero-based index of the step in the flow array. */
    index: number;
    /** Present on 'success', 'assertion-failed', and 'cancelled'. */
    outcome?: unknown;
}

export interface FlowRunOptions {
    /** Invoked after every step with `(step, outcome)`. */
    onStep?: (step: FlowStep, outcome: unknown) => void;
    /** Invoked when a step's assertion fails. */
    onAssertFail?: (step: FlowStep, outcome: unknown) => void;
    /**
     * Fine-grained per-step lifecycle events. Fired in order:
     * `start` (before the cursor moves) → one of `success` / `assertion-failed`
     * / `cancelled`. Use this to drive live UI such as step indicators.
     */
    onStepEvent?: (event: StepEvent) => void;
    /**
     * Abort the flow between (and where possible inside) steps. When the
     * signal fires `runFlow` resolves with `completed: false` and
     * `failure.reason === 'cancelled'`. Click handlers already in flight
     * still run to completion (we can't kill user code), but the runner stops
     * awaiting them.
     */
    signal?: AbortSignal;
    /**
     * When true, every targeting step calls `scrollIntoView({ block: 'nearest' })`
     * on its element before the cursor moves to it — so off-screen targets are
     * brought into the viewport automatically. Defaults to false to preserve
     * the existing zero-side-effect behavior. Per-step `scroll` steps still
     * work either way.
     */
    autoScroll?: boolean;
}

export interface FlowFailure {
    step: FlowStep;
    reason:
        | 'assertion-failed'
        | 'unknown-step-type'
        | 'cancelled'
        | 'timeout'
        | 'element-not-found'
        | 'target-disabled';
    /** Underlying error, when one was thrown (e.g. `MoveTimeoutError`). */
    cause?: unknown;
}

export interface FlowResult {
    completed: boolean;
    lastOutcome: unknown;
    failure?: FlowFailure;
}

/**
 * The minimum surface a flow runner needs from a cursor. `useVirtualCursor`'s
 * return value is structurally compatible.
 */
export interface CursorController {
    moveToElement: <T = unknown>(
        target: ElementTarget,
        options?: {
            click?: boolean;
            wait?: boolean | number;
        } & MoveOptions,
    ) => Promise<T | undefined>;
    /**
     * Current cursor screen position. Optional so non-React controllers can
     * skip it; `useCursorFlow` reads this when persistence is enabled so the
     * cursor location survives page reloads.
     */
    position?: Position;
    /**
     * Optional lifecycle hook: called by `runFlow` immediately before the
     * first step. Cursors use this to apply visibility policies like
     * "show on flow start".
     */
    onFlowStart?: () => void;
    /**
     * Optional lifecycle hook: called by `runFlow` after the flow settles
     * (success, failure, or cancellation), via a `finally` block, so it
     * always fires exactly once per run.
     */
    onFlowEnd?: () => void;
}
