/** Human-readable help text for flow / run / cursor config props. */
export const PROP_DESCRIPTIONS = {
    element:
        'Target element: CSS selector (#id, .class, [name="…"]), React ref, or HTMLElement.',
    index:
        'When a selector matches multiple elements, pick which one (zero-based). Default 0.',
    wait:
        'How long to wait for the click handler to settle. true = forever, false = skip, number = timeout in ms.',
    move: 'Animation overrides for cursor motion (duration, easing). JSON object.',
    moveOnFailure:
        'If the step fails (timeout, missing element, assertion), continue to the next step instead of aborting.',
    assert:
        'Optional predicate run on the step outcome. Return false to fail the step.',
    value:
        'Value to type or select. Can be a fixed string or a function (prev) => string.',
    charDelayMs:
        'Milliseconds between keystrokes when typing. Default 50ms.',
    append: 'Append to the current field value instead of replacing it.',
    duration:
        'Milliseconds to wait. On delay steps: pause before continuing. On hover: linger time after arriving.',
    state:
        'Element state to poll for: attached, visible, enabled, or detached. Default visible.',
    condition:
        'Custom predicate polled until truthy. Mutually exclusive with element.',
    timeout: 'Maximum time to wait in ms before the step fails. Default 5000.',
    pollInterval:
        'How often to re-check the element or condition in ms. Default 50.',
    moveTo:
        'Move the cursor to the target once ready (waitFor / keypress). Default true when element is set.',
    key: 'Key to press: a character (a, 1) or a named key (Enter, Escape, Tab, ArrowDown).',
    modifiers:
        'Modifier keys held during the keypress: shift, ctrl, alt, meta. JSON array.',
    repeat: 'How many times to repeat the keypress. Default 1.',
    interval: 'Milliseconds between key repeats. Default 80.',
    container:
        'Scrollable container selector or element. Used with by / to deltas.',
    by: 'Relative scroll delta as JSON: { x?, y? }.',
    to: 'Absolute scroll position as JSON: { x?, y? }.',
    behavior: 'Scroll animation: auto (instant) or smooth.',
    block:
        'scrollIntoView alignment when targeting an element: start, center, end, nearest.',
    settleMs:
        'Pause after scrolling in ms. Default 350 for smooth, 0 for auto.',
    onStep:
        'Callback invoked after each step with (step, outcome). Function body.',
    onAssertFail:
        'Callback when a step assertion fails with (step, outcome). Function body.',
    autoScroll:
        'Scroll off-screen targets into view before every targeting step.',
    visibility:
        'When to show the cursor: always, onStart (default), or never (manual only).',
    autoHide:
        'Hide the cursor when the flow ends. Ignored when visibility is always.',
    appearance:
        'Cursor image URL or data URL. Omit for the built-in gradient pointer.',
} as const;

export type PropDescriptionKey = keyof typeof PROP_DESCRIPTIONS;

export function propDescription(
    key: string,
    override?: string,
): string | undefined {
    if (override) return override;
    return PROP_DESCRIPTIONS[key as PropDescriptionKey];
}
