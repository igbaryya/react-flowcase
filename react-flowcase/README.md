# React Flowcase (`react-flowcase`)

A React library for building visual, automated walkthroughs: a virtual cursor you can drive across the page, awaitable click/input primitives that surface async handler results back to your runner, a declarative flow-step API with cancellation, and drop-in UI for editing / visualizing / generating code from flows.

> Status: pre-1.0. APIs may change.

## Install

```bash
npm install react-flowcase
```

Peer deps: `react ^18 || ^19`, `react-dom ^18 || ^19`. No runtime dependencies.

## Quick start

```tsx
import {
    VirtualCursor,
    useVirtualCursor,
    useAwaitableClick,
    useCursorFlow,
    type FlowStep,
} from 'react-flowcase';

function MyForm() {
    const cursor = useVirtualCursor();
    const { run, cancel, running } = useCursorFlow(cursor);

    const handleSubmit = async () => {
        // ...returns whatever you want the automation to await
        return { ok: true };
    };
    const trackedSubmit = useAwaitableClick(handleSubmit);

    const start = () =>
        run([
            { type: 'input', element: '#fullName', value: 'Ada Lovelace' },
            { type: 'input', element: '#email', value: 'ada@example.com' },
            { type: 'select', element: '#country', value: 'UK' },
            { type: 'click', element: '#submit' },
        ] satisfies FlowStep[]);

    return (
        <>
            <form id="my-form">
                <input id="fullName" name="fullName" />
                <input id="email" name="email" />
                <select id="country" name="country">
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                </select>
                <button id="submit" type="button" onClick={trackedSubmit}>
                    Submit
                </button>
            </form>
            <button onClick={running ? cancel : start}>
                {running ? 'Stop' : 'Run automation'}
            </button>
            <VirtualCursor
                position={cursor.position}
                visible={cursor.visible}
            />
        </>
    );
}
```

## Recording flows in dev mode

You don't have to author flows by hand. The library ships a dev-only recorder that watches you click and type, picks stable selectors for everything you touch, and emits a copy-pastable `FlowStep[]`.

### 1. Drop the panel in once, gated on dev

Mount `<FlowRecorder />` somewhere near your app root. Gate it on `import.meta.env.DEV` (Vite) / `process.env.NODE_ENV !== 'production'` (Next/CRA/Webpack) so it never ships to production:

```tsx
// src/main.tsx (Vite)
import { FlowRecorder } from 'react-flowcase';

function Root() {
    return (
        <>
            <App />
            {import.meta.env.DEV && <FlowRecorder />}
        </>
    );
}
```

```tsx
// app/layout.tsx (Next.js)
import dynamic from 'next/dynamic';

const FlowRecorder = dynamic(
    () => import('react-flowcase').then((m) => m.FlowRecorder),
    { ssr: false },
);

export default function Layout({ children }) {
    return (
        <>
            {children}
            {process.env.NODE_ENV !== 'production' && <FlowRecorder />}
        </>
    );
}
```

That's it — a small floating panel docks at the bottom-right of every page.

### 2. Use it

Three ways to drive it, in order of ergonomics:

**Hotkeys (default, work anywhere in your app):**

| Shortcut         | Action                                             |
| ---------------- | -------------------------------------------------- |
| `Alt+Shift+R`    | Toggle recording (on/off)                          |
| `Alt+Shift+I`    | Toggle the inspector / element picker              |
| `Esc`            | Exit inspector mode                                |

The hotkeys auto-expand the panel if it was collapsed. They're deliberately `Alt+Shift+_` to avoid colliding with the browser's own `Cmd/Ctrl+Shift+I` DevTools binding.

**Panel buttons:** click ● Record / ⊕ Inspect / Clear / Copy code.

**Programmatic** (when you're embedding the recorder in your own dev UI):

```tsx
import { useFlowRecorder, FlowRecorder } from 'react-flowcase';

function DevPanel() {
    const recorder = useFlowRecorder();
    return (
        <>
            <button onClick={() => recorder.setInspecting(true)}>
                Pick an element
            </button>
            <FlowRecorder state={recorder} />
        </>
    );
}
```

### 3. What the inspector does (vs. recording)

| Mode                   | Trigger                | What happens on click                                                  |
| ---------------------- | ---------------------- | ---------------------------------------------------------------------- |
| **Recording**          | `Alt+Shift+R`          | Real click fires; a `click` / `input` / `select` / `keypress` step is appended. |
| **Inspector**          | `Alt+Shift+I`          | Click is *suppressed* (no submit, no navigation); a `click` step is inserted. Lets you scaffold past destructive actions. |
| **Recording + Inspector** | both on             | Inspector wins on click; recording still captures `input` / `keypress`. |

The inspector also draws a blue outline + tooltip with the computed selector around whatever element you hover, so you can sanity-check selectors before committing.

### 4. Copy the result

When you've clicked your way through the flow, hit **Copy code** on the panel. You get a ready-to-paste TypeScript snippet:

```ts
const recordedFlow: FlowStep[] = [
    { type: 'click', element: '#login', wait: true },
    { type: 'input', element: '[name="email"]', value: 'ada@example.com' },
    { type: 'input', element: '[name="password"]', value: 'secret' },
    { type: 'click', element: '[data-testid="submit"]', wait: true },
];
```

Paste it into your code, wrap with `useCursorFlow(cursor).run(recordedFlow)`, and you've got a replayable automation built from a single walkthrough.

### Selector strategy

`bestSelector(el)` picks the most stable selector available, in this order:

1. `#id`
2. `[data-testid="..."]` / `[data-test="..."]` / `[data-cy="..."]`
3. `[name="..."]` (form fields)
4. `[aria-label="..."]`
5. A unique stable class
6. Structural `:nth-of-type` fallback when nothing else works

You can extend or override the strategy via `selectorOptions`:

```tsx
<FlowRecorder
    selectorOptions={{
        testIdAttribute: 'data-qa',         // your team's convention
        ignoreClasses: /^css-[a-z0-9]+$/,   // skip emotion / styled hashes
    }}
/>
```

### Customizing the panel

```tsx
<FlowRecorder
    position="top-right"                   // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    initialCollapsed                       // start collapsed; hotkeys still work
    showInspector={false}                  // hide the Inspect button
    inspectShortcut={{ key: 'p', meta: true, shift: true }}  // ⌘+Shift+P
    recordShortcut={false}                 // disable the record hotkey
    ignore={(el) => el.closest('[data-no-record]') !== null}
/>
```

The `RecorderShortcut` type:

```ts
interface RecorderShortcut {
    key: string;            // matched case-insensitively against KeyboardEvent.key
    alt?: boolean;
    shift?: boolean;
    ctrl?: boolean;
    meta?: boolean;         // Cmd on macOS
}
```

Pass `false` to either shortcut prop to disable it entirely.

### What the recorder captures

| You do                                    | Step emitted                                   |
| ----------------------------------------- | ---------------------------------------------- |
| Click any interactive element             | `{ type: 'click', element, wait: true }`       |
| Type into an `<input>` / `<textarea>`     | `{ type: 'input', element, value }` (consecutive keystrokes coalesce) |
| Change a `<select>`                        | `{ type: 'select', element, value }`           |
| Press `Enter`, `Esc`, `Tab`, arrows, etc. | `{ type: 'keypress', key, modifiers }`         |

Mouse-only events like `hover` and timing primitives like `delay` / `waitFor` aren't observable from the DOM — add those by hand once the recorder gives you the skeleton.

## Cursor visibility

`useVirtualCursor` accepts an options object that controls when the cursor is auto-shown / -hidden in response to flow lifecycle:

```ts
const cursor = useVirtualCursor({
    initial: { x: 0, y: 0 },
    visibility: 'onStart', // 'always' | 'onStart' (default) | 'never'
    autoHide: true,        // default: hide when the run settles
});
```

| `visibility` | Initial | On flow start | On flow end (if `autoHide`) |
| ------------ | ------- | ------------- | --------------------------- |
| `'always'`   | shown   | (already shown) | stays shown               |
| `'onStart'`  | hidden  | shown         | hidden                      |
| `'never'`    | hidden  | (stays hidden) | (stays hidden)             |

`cursor.show()` / `cursor.hide()` always work and override the policy until the next lifecycle event. The flow's start/end hooks are part of the `CursorController` contract (`onFlowStart?` / `onFlowEnd?`), so the cursor reacts automatically when used with `useCursorFlow` or `runFlow` — no extra wiring needed.

## Cross-page persistence

Flows can survive page navigation (e.g. Login → redirect → Dashboard) using session/local storage:

```tsx
import {
    useCursorFlow,
    useVirtualCursor,
    createSessionStoragePersistence,
    type FlowStep,
} from 'react-flowcase';

// 1. Create persistence once (e.g. in a shared module)
const persistence = createSessionStoragePersistence('login-flow');

// 2. Define the FULL cross-page flow
const fullFlow: FlowStep[] = [
    // Login page steps
    { type: 'input', element: '#username', value: 'admin' },
    { type: 'input', element: '#password', value: 'secret' },
    { type: 'click', element: '#login-btn' },
    // Dashboard page steps (after redirect)
    { type: 'delay', duration: 2000 },   // give the page time to render
    { type: 'click', element: '#menu-settings' },
    { type: 'click', element: '#logout' },
];

// 3. Use the same hook setup on EVERY page in the flow
function MyPage() {
    const cursor = useVirtualCursor();
    const { run, running, pendingState } = useCursorFlow(cursor, {
        persistence,
        flow: fullFlow,      // Required for auto-resume
        flowOptions: { ... }, // Optional: onStepEvent, etc.
    });

    // On Login page: button calls run(fullFlow)
    // On Dashboard page: hook sees pendingState, auto-resumes from step 3
}
```

**How it works:**
- Before each step starts, state is saved to storage (step index + timestamp)
- When the hook mounts and finds saved state, it slices the flow and auto-resumes
- On completion (success or failure), storage is cleared

**API:**
- `createSessionStoragePersistence(key)` — clears when tab closes (recommended for same-session flows)
- `createLocalStoragePersistence(key)` — survives browser restarts
- `pendingState` — non-null when resuming; use for UI feedback ("Resuming...")
- `clearPersistence()` — abandon a partial flow and start fresh

**Caveats:**
- Functions (`assert`, `value: (prev) => ...`) aren't persisted — the flow definition must exist in code on every page
- The hook waits 100ms after mount before resuming, giving the page time to render target elements
- If a step's element doesn't exist yet (slow-loading page), the step fails with `'element-not-found'` — use `moveOnFailure` or add a wait step if needed

## Cancellation

`useCursorFlow` owns an internal `AbortController`. Calling `cancel()` propagates the abort signal through every async layer:

- `tween` cancels the active `requestAnimationFrame`.
- `typeInto` breaks out of the keystroke loop between characters.
- `moveToElement` races any in-flight awaitable click against the abort signal.
- `runFlow` checks the signal between steps and immediately after each step's primitive returns.

When a run is cancelled, `runFlow` resolves with:

```ts
{ completed: false, lastOutcome: <last>, failure: { step, reason: 'cancelled' } }
```

and fires `onStepEvent({ phase: 'cancelled', step, index })` for the step that was running.

**Caveat:** if cancellation happens while the runner is awaiting a click handler that you registered via `useAwaitableClick`, the handler still runs to completion — we can only abandon the await, not abort arbitrary user code. State changes the handler makes will still apply.

You can also pass your own `AbortSignal` via `options.signal`; aborting either it or calling `cancel()` ends the run.

```ts
const { run, cancel } = useCursorFlow(cursor);

// External signal:
const ctrl = new AbortController();
await run(steps, { signal: ctrl.signal });

// Or just:
cancel();
```

## Element targeting

Every flow step targets one element via `element: ElementTarget`. Three accepted shapes:

```ts
type ElementTarget =
    | string                                       // CSS selector
    | HTMLElement                                  // raw element
    | { readonly current: HTMLElement | null };    // React ref
```

| Form | Example | Resolved via |
| --- | --- | --- |
| Selector | `'#submit'`, `'.btn-primary'`, `'[name="email"]'`, `'form button[type=submit]'` | `document.querySelectorAll(selector)` |
| Ref | `submitRef` (from `useRef<HTMLButtonElement>(null)`) | `ref.current` |
| Raw element | `document.querySelector('...') as HTMLElement` | used directly |

### Multi-match policy

If a selector matches more than one element and you didn't tell us which one to pick, the runner takes match `[0]` and emits a `console.warn` so you spot the ambiguity. To silence it (or pick a different match), set `index`:

```ts
{ type: 'click', element: '.row .delete', index: 2 } // 3rd match
```

`index` only applies to selector targets. Refs and raw elements ignore it.

### Awaitable clicks don't need ids

`useAwaitableClick(handler)` keys its inflight promise by the actual DOM element (via `event.currentTarget`), not by a string id. So you can use any selector — `.submit`, `[data-test=save]`, a ref — and `wait` will see the promise that handler returned.

### Failures

| Cause | `failure.reason` | `onStepEvent` phase |
| --- | --- | --- |
| Selector matched nothing / ref was empty | `'element-not-found'` | `'element-not-found'` |
| Numeric `wait` elapsed before handler settled | `'timeout'` | `'timeout'` |
| `assert` returned `false` | `'assertion-failed'` | `'assertion-failed'` |
| Run was cancelled | `'cancelled'` | `'cancelled'` |

All four respect `step.moveOnFailure` — set it to skip to the next step instead of aborting the flow.

## Flow steps

```ts
type FlowStep =
    | { type: 'click'; element: ElementTarget; index?: number; wait?: boolean | number; ... }
    | { type: 'input'; element: ElementTarget; index?: number; value: string | ((prev) => string); charDelayMs?: number; append?: boolean; ... }
    | { type: 'select'; element: ElementTarget; index?: number; value: string | ((prev) => string); ... }
    | { type: 'delay'; duration: number };
```

Every element-targeting step also accepts `move?: { duration, easing }`, `assert?: (outcome) => boolean`, and `moveOnFailure?: boolean`.

The `value` of `input` / `select` can be a function `(prevOutcome) => string` — it receives the resolved value of the previous step, letting you chain results (e.g. confirm-password fields).

### Delay step

A pure pause — waits `duration` ms without moving the cursor or targeting any element. Useful for waiting after page navigation, giving animations time to settle, or adding dramatic pauses in demos:

```ts
{ type: 'delay', duration: 3000 }  // wait 3 seconds
```

Unlike element steps, `delay` has no `element`, `assert`, or `moveOnFailure` — it just waits. Cancellation (`signal.abort()`) interrupts it early.

### waitFor step

A polled wait for a real condition (preferred over `delay` whenever you can express what you're waiting for). Two mutually-exclusive modes:

**Element mode** — wait until a target matches a state:

```ts
{ type: 'waitFor', element: '#user-menu' }                     // visible (default)
{ type: 'waitFor', element: '#submit', state: 'enabled' }
{ type: 'waitFor', element: '.modal', state: 'detached' }      // wait for it to close
{ type: 'waitFor', element: '#row', state: 'attached', moveTo: true }
```

States:

| `state` | Matches when... |
| --- | --- |
| `'visible'` (default) | element is in the DOM, `display`/`visibility`/`opacity` aren't hidden, and `getBoundingClientRect()` has non-zero size. |
| `'attached'` | element exists in the DOM (regardless of styles). |
| `'enabled'` | attached AND not `disabled` / `aria-disabled="true"`. |
| `'detached'` | element is `null` or no longer in the document — i.e. wait for it to go away. |

**Condition mode** — wait until any predicate returns truthy:

```ts
{ type: 'waitFor', condition: () => store.getState().ready,    timeout: 8000 }
{ type: 'waitFor', condition: async () => (await fetch('/api/ready')).ok }
```

Common options:

| Option | Default | Notes |
| --- | --- | --- |
| `timeout` | `5000` | Max time to wait in ms. On timeout: `failure.reason === 'timeout'`, `StepEvent` phase `'timeout'`. |
| `pollInterval` | `50` | How often to re-evaluate the predicate / re-resolve the target. |
| `moveTo` | `false` | After the wait succeeds, slide the cursor over the resolved element (element mode only, never for `'detached'`). |
| `moveOnFailure` | `false` | On timeout, continue to the next step instead of aborting the flow. |
| `index` | `0` | Multi-match index for string selectors. |

`waitFor` respects `cancel()` / external `AbortSignal` between every poll. The exported `waitFor()` async helper is the same primitive, usable outside flows:

```ts
import { waitFor, isWaitTimeoutError } from 'react-flowcase';

try {
    await waitFor(() => document.querySelector('#user-menu') !== null, {
        timeout: 8000,
        signal: ctrl.signal,
    });
} catch (err) {
    if (isWaitTimeoutError(err)) console.warn('Menu never appeared');
}
```

### Click `wait` — boolean or timeout

`wait` on a click step controls how long the runner waits for the target's awaitable click handler:

| `wait` | Behavior |
| --- | --- |
| `true` (default) / omitted | Wait forever for the handler to settle. |
| `false` | Fire-and-forget. Do not wait, outcome is `undefined`. |
| `number` | Wait up to N ms. If the handler hasn't settled by then, the step fails with `failure.reason === 'timeout'` (or moves on when `moveOnFailure` is set). `onStepEvent` fires `phase: 'timeout'`. |

The timeout race lives in `useVirtualCursor.moveToElement`, which throws `MoveTimeoutError` when the deadline is hit. `runFlow` catches it. If you call `moveToElement` directly with a numeric `wait`, catch the error yourself (or use the `isMoveTimeoutError` guard).

**Caveat:** like cancellation, a numeric `wait` only stops the runner waiting — the click handler itself keeps running. Any state it eventually sets will still apply.

`FlowRunOptions`:

```ts
interface FlowRunOptions {
    onStep?: (step, outcome) => void;
    onAssertFail?: (step, outcome) => void;
    onStepEvent?: (e: StepEvent) => void; // start | success | assertion-failed | timeout | cancelled
    signal?: AbortSignal;
}
```

## UI helpers

All three are pure-presentational, fully styled inline (no CSS import needed):

- `<FlowConfigViewer flow={...} editable onChange={...} />` — schema-driven, tabbed editor (**Overall** / **Flow** / **Run options**). Object props get their own tab (`flow`, `runOptions`); primitive cursor settings (`visibility`, `autoHide`) collapse into **Overall**. Tabs only render when their data is present. Supports add / delete / drag-to-reorder steps and edit per-step callbacks via `new Function(src)`. Pass `cursorOptions` + `onCursorOptionsChange` to enable the Overall tab.
- `<FlowConfigModal open onClose ... />` — wraps the viewer in a native `<dialog>` with backdrop, Done/Reset buttons. Accepts every `FlowConfigViewer` prop.
- `<FlowStepsIndicator flow={...} statuses={...} />` — compact vertical step list with `pending` / `running` (pulsing) / `success` (green ✓) / `failed` (red ✗) / `cancelled` (amber ⏸) icons. Drive it with:
    ```ts
    import { applyStepEvent } from 'react-flowcase';
    const [statuses, setStatuses] = useState({});
    run(flow, { onStepEvent: (e) => setStatuses((s) => applyStepEvent(s, e)) });
    ```
- `<FlowCodePreview flow={...} template="full" cursorOptions={...} renderCode={...} />` — generates a TypeScript source string (minimal or full component scaffold) from the live flow. When `cursorOptions` is passed, the `'full'` template emits them inside the generated `useVirtualCursor({...})` call. Pass `renderCode` to plug in any syntax highlighter (the library itself stays dependency-free).

The pure code-generation helpers — `generateFlowCode()` and `generateFullExample()` — are exported separately if you want to skip the component shell.

## Editing function values — security note

`FlowConfigViewer`'s function editor evaluates user input via `new Function(...)`. This is appropriate for developer-facing tools (you're already running arbitrary handlers you wrote) but **must not** be exposed to untrusted user input. There is no sandbox.

## API surface

**Cursor**
- `<VirtualCursor position={...} visible cursor?={...} size?={28} loading?={false} />` — visual cursor element. The default is a blue-to-white gradient pointer with a soft glow (visible on light and dark UIs). Pass `cursor` to override:
    - `cursor="/icons/aim.png"` — image src, rendered as `<img>`.
    - `cursor={<MyCustomSvg />}` — any ReactNode rendered as-is.
    - `cursor={({ size }) => <span style={{ fontSize: size }}>👆</span>}` — render function called with the resolved `size`.

    The wrapper handles positioning, sizing, and `pointer-events: none`. Your cursor content should be intrinsic (no `position: fixed` of its own) and fill 100% / honor `size`.

    Pass `loading={true}` to show a spinning loader beside the cursor — use this during `waitFor` or `delay` steps to indicate the automation is waiting. The loader renders at the bottom-right of the cursor.

    For settings-driven cursor swaps (URL editable from a UI), use the `appearance` option on `useVirtualCursor` instead — see below.

### Editable cursor via `appearance`

`useVirtualCursor` accepts an `appearance?: string` option (image URL or data URL) and exposes it on the hook result as `cursor.appearance`. Forward it to `<VirtualCursor>`:

```tsx
const cursor = useVirtualCursor({
    visibility: 'onStart',
    autoHide: true,
    appearance: '/icons/aim.svg', // editable from the settings modal
});

<VirtualCursor
    position={cursor.position}
    visible={cursor.visible}
    cursor={cursor.appearance}
/>
```

Because `appearance` is a primitive string in `UseVirtualCursorOptions`, the `FlowConfigViewer` / `FlowConfigModal` **Overall** tab renders it as an editable text input out of the box — users can paste any URL (including `data:image/svg+xml;base64,...`) to swap the cursor live. For richer cursors (ReactNode / render function), pass the `cursor` prop to `<VirtualCursor>` directly.
- `useVirtualCursor(options?)` — owns position/visibility, exposes `moveTo(x, y, opts?)` and `moveToElement(id, opts?)`. Options: `initial`, `visibility`, `autoHide` (see [Cursor visibility](#cursor-visibility)). `opts` accepts `signal` for cancellation.

**Awaitable events**
- `useAwaitableClick(id, handler)` — registers a click handler so its return value flows back through the automation.
- `trackInvocation`, `getInflight`, `clearInflight` — lower-level registry primitives.

**Flow**
- `useCursorFlow(cursor)` — returns `{ run, cancel, running }`.
- `runFlow(cursor, steps, options?)` — pure async runner, usable without React.
- `FlowConfigViewer`, `FlowConfigModal`, `FlowStepsIndicator`, `FlowCodePreview` — UI components.
- `generateFlowCode`, `generateFullExample` — pure source generators.
- `applyStepEvent` — reducer that maps a `StepEvent` to a `Record<index, StepStatus>`.
- `STEP_TYPES`, `STEP_SCHEMAS`, `RUN_OPTIONS_SCHEMA`, `createDefaultStep` — registry powering the generic editor.

**Recorder (dev mode)**
- `<FlowRecorder />` — floating dev-mode panel with record / inspect / copy. Mount once, gated on `import.meta.env.DEV`. See [Recording flows in dev mode](#recording-flows-in-dev-mode).
- `useFlowRecorder(options?)` — the underlying hook (`flow`, `recording`, `inspecting`, `start`, `stop`, `clear`, `toggleInspect`, `push`, `removeAt`, ...).
- `<InspectorOverlay target selectorOptions? />` — the blue outline + selector tooltip, usable on its own.
- `bestSelector(el, options?)`, `closestInteractive(el)`, `describeRecordedElement(el)` — selector / introspection helpers.

**Primitives**
- `typeInto(id, value, opts?)` — char-by-char typing into `<input>` / `<textarea>`, React-safe, accepts `signal`.
- `selectOption(id, value)` — programmatic `<select>` change that fires React's `onChange`.
- `setNativeValue(el, value)`, `sleep(ms, signal?)` — DOM helpers.
- `tween(opts)`, `easeInOutCubic`, `linear` — animation primitives, accept `signal`.

## Migration: 0.x

### `useCursorFlow` now returns an object

```diff
- const runFlow = useCursorFlow(cursor);
- await runFlow(steps, options);
+ const { run, cancel, running } = useCursorFlow(cursor);
+ await run(steps, options);
+ // cancel() to stop, `running` for UI state
```

The standalone `runFlow(cursor, steps, options?)` is unchanged.

### `useVirtualCursor` takes an options object and defaults to hidden

```diff
- const cursor = useVirtualCursor({ x: 100, y: 50 }); // positional initial
+ const cursor = useVirtualCursor({ initial: { x: 100, y: 50 } });
```

The default `visibility` is now `'onStart'` (was always visible). If you want the previous behavior:

```ts
const cursor = useVirtualCursor({ visibility: 'always' });
```

### `STEP_SCHEMAS` / `RUN_OPTIONS_SCHEMA` shape change

These exports moved from `ReadonlyArray<string>` to `ReadonlyArray<ConfigPropSchema>` (so prop metadata like `enumValues` and `valueKinds` can travel with the key). If you iterate them, switch from `key` to `schema.key`:

```diff
- STEP_SCHEMAS.click.map((key) => render(key, step[key]))
+ STEP_SCHEMAS.click.map((schema) => render(schema.key, step[schema.key]))
```

### `ClickStep.wait` is now `boolean | number`

Existing boolean usage is unchanged. To bound a stuck handler, pass `number` (ms):

```ts
{ type: 'click', element: '#submit', wait: 5000 } // fail after 5s
```

When the timeout fires, the step resolves to `failure.reason === 'timeout'` (or skips on `moveOnFailure`). `onStepEvent` fires `phase: 'timeout'`. The `FlowStepsIndicator` shows it as a distinct **timeout** status (clock icon, amber).

### `elementId` → `element` + flexible targets

Steps no longer take an `elementId: string`. They take `element: ElementTarget` (selector / ref / HTMLElement). Convert your existing string ids by prefixing with `#`:

```diff
- { type: 'click', elementId: 'submit' }
+ { type: 'click', element: '#submit' }
```

Or switch to richer selectors / refs:

```ts
{ type: 'click', element: '[data-test="save"]' }
{ type: 'click', element: submitRef }
```

See [Element targeting](#element-targeting) for the full picture, including the multi-match `index` prop.

### `useAwaitableClick` no longer takes an `id`

The registry is now keyed by the clicked DOM element. Drop the first argument:

```diff
- const onClick = useAwaitableClick('submit', handleSubmit);
+ const onClick = useAwaitableClick(handleSubmit);
```

Your target element doesn't need an `id` attribute anymore — anything resolvable by `element` works.

### `typeInto` / `selectOption` take an element, not an id

These primitives now accept `HTMLElement | null` directly. `runFlow` resolves once and passes the element down. If you call them yourself:

```diff
- await typeInto('email', 'a@b.com');
+ await typeInto(document.querySelector('#email'), 'a@b.com');
+ // or
+ await typeInto(resolveTarget('#email').element, 'a@b.com');
```

### `MoveTimeoutError.elementId` → `target`

`MoveTimeoutError` carries the human-readable target string (whatever `describeTarget(target)` produced), not a DOM id:

```diff
- err.elementId
+ err.target
```

## License

MIT
