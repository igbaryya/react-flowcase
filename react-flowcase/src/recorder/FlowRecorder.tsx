import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from 'react';
import { generateFlowCode } from './generateFlowCode';
import { describeStep } from '../flow/types';
import { InspectorOverlay } from './InspectorOverlay';
import {
    useFlowRecorder,
    type UseFlowRecorderOptions,
    type UseFlowRecorderResult,
    type RecordedStep,
} from './useFlowRecorder';

export type RecorderPosition =
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';

/**
 * Description of a keyboard shortcut. `key` is matched against
 * `KeyboardEvent.key` case-insensitively. Pass `false` to disable.
 */
export interface RecorderShortcut {
    key: string;
    alt?: boolean;
    shift?: boolean;
    ctrl?: boolean;
    meta?: boolean;
}

export interface FlowRecorderProps extends UseFlowRecorderOptions {
    /** Where to dock the floating panel. Defaults to `'bottom-right'`. */
    position?: RecorderPosition;
    /** Initial collapsed state. Defaults to false. */
    initialCollapsed?: boolean;
    /** Show the inspector overlay button. Defaults to true. */
    showInspector?: boolean;
    /**
     * Global hotkey that toggles inspector mode (like Chrome DevTools'
     * element picker). Defaults to `Alt+Shift+I` to avoid colliding with
     * the browser's own `Cmd/Ctrl+Shift+I`. Pass `false` to disable.
     */
    inspectShortcut?: RecorderShortcut | false;
    /**
     * Global hotkey that toggles recording on/off. Defaults to
     * `Alt+Shift+R`. Pass `false` to disable.
     */
    recordShortcut?: RecorderShortcut | false;
    /** Optional external state (for embedding inside a larger UI). */
    state?: UseFlowRecorderResult;
}

const DEFAULT_INSPECT_SHORTCUT: RecorderShortcut = {
    key: 'i',
    alt: true,
    shift: true,
};
const DEFAULT_RECORD_SHORTCUT: RecorderShortcut = {
    key: 'r',
    alt: true,
    shift: true,
};

function matchesShortcut(e: KeyboardEvent, s: RecorderShortcut): boolean {
    if (e.key.toLowerCase() !== s.key.toLowerCase()) return false;
    if (Boolean(s.alt) !== e.altKey) return false;
    if (Boolean(s.shift) !== e.shiftKey) return false;
    if (Boolean(s.ctrl) !== e.ctrlKey) return false;
    if (Boolean(s.meta) !== e.metaKey) return false;
    return true;
}

function formatShortcut(s: RecorderShortcut): string {
    const parts: string[] = [];
    if (s.meta) parts.push('⌘');
    if (s.ctrl) parts.push('Ctrl');
    if (s.alt) parts.push('Alt');
    if (s.shift) parts.push('Shift');
    parts.push(s.key.length === 1 ? s.key.toUpperCase() : s.key);
    return parts.join('+');
}

const STEP_COLOR: Record<RecordedStep['type'], string> = {
    click: '#6aa9ff',
    input: '#b084fc',
    select: '#fab259',
    keypress: '#ef93b9',
};

const PANEL_BG = '#0e1117';
const PANEL_BORDER = 'rgba(255, 255, 255, 0.08)';
const TEXT = '#e6e9ef';
const TEXT_DIM = '#9aa1b1';
const ACCENT = '#6aa9ff';
const RED = '#ef5b6b';
const GREEN = '#58c87b';

function positionStyle(pos: RecorderPosition): CSSProperties {
    const base: CSSProperties = { position: 'fixed', zIndex: 2147483645 };
    if (pos === 'top-left') return { ...base, top: 16, left: 16 };
    if (pos === 'top-right') return { ...base, top: 16, right: 16 };
    if (pos === 'bottom-left') return { ...base, bottom: 16, left: 16 };
    return { ...base, bottom: 16, right: 16 };
}

function summarizeStep(step: RecordedStep): {
    label: string;
    detail: string;
} {
    if (step.type === 'input') {
        const v = step.value as string;
        const preview = v.length > 24 ? `${v.slice(0, 24)}…` : v;
        return {
            label: describeStep(step),
            detail: `= ${JSON.stringify(preview)}`,
        };
    }
    if (step.type === 'select') {
        return {
            label: describeStep(step),
            detail: `= ${JSON.stringify(step.value)}`,
        };
    }
    if (step.type === 'keypress') {
        return { label: describeStep(step), detail: '' };
    }
    return { label: describeStep(step), detail: '' };
}

/**
 * Floating dev-mode panel that records user interactions into a
 * `FlowStep[]`. Mount it once in your app (typically gated on
 * `import.meta.env.DEV`) and it will overlay the page in the
 * corner you choose.
 *
 * Workflow:
 *  1. Click "Record" — every click/input/select/named-keypress on the
 *     page is appended as a step.
 *  2. Click "Inspect" to enter pick-to-insert mode: hover highlights any
 *     element, clicking adds a step without firing the underlying
 *     handler. Great for scaffolding flows past destructive actions.
 *  3. Click "Copy code" — the recorded steps are turned into a
 *     copy-pastable `FlowStep[]` (via `generateFlowCode`).
 */
export function FlowRecorder(props: FlowRecorderProps) {
    // Branch on whether the caller is providing external state. We must
    // pick one branch *per mount* (Rules of Hooks): toggling `state` from
    // defined to undefined (or vice versa) across renders would crash. In
    // practice callers either fully own the recorder hook themselves and
    // pass it in, or they don't — never both for the same panel instance.
    if (props.state) {
        return <FlowRecorderPanel {...props} state={props.state} />;
    }
    return <FlowRecorderSelfManaged {...props} />;
}

function FlowRecorderSelfManaged(props: FlowRecorderProps) {
    // Strip everything that is *not* a `useFlowRecorder` option so the hook
    // doesn't receive panel-only props as part of its options bag.
    const {
        position: _position,
        initialCollapsed: _initialCollapsed,
        showInspector: _showInspector,
        inspectShortcut: _inspectShortcut,
        recordShortcut: _recordShortcut,
        state: _state,
        ...hookOptions
    } = props;
    void _position;
    void _initialCollapsed;
    void _showInspector;
    void _inspectShortcut;
    void _recordShortcut;
    void _state;
    const internal = useFlowRecorder(hookOptions);
    return <FlowRecorderPanel {...props} state={internal} />;
}

interface FlowRecorderPanelProps extends FlowRecorderProps {
    state: UseFlowRecorderResult;
}

function FlowRecorderPanel(props: FlowRecorderPanelProps) {
    const {
        position = 'bottom-right',
        initialCollapsed = false,
        showInspector = true,
        inspectShortcut = DEFAULT_INSPECT_SHORTCUT,
        recordShortcut = DEFAULT_RECORD_SHORTCUT,
        state,
    } = props;

    const [collapsed, setCollapsed] = useState(initialCollapsed);
    const [copyHint, setCopyHint] = useState<string | null>(null);

    // Esc exits inspector mode — a familiar shortcut from devtools'
    // element picker.
    useEffect(() => {
        if (!state.inspecting) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                state.setInspecting(false);
            }
        };
        document.addEventListener('keydown', onKey, true);
        return () => document.removeEventListener('keydown', onKey, true);
    }, [state.inspecting, state.setInspecting, state]);

    // Global hotkeys — toggle inspector / recording from anywhere in the
    // app without having to find the panel first. Stable refs so callers
    // can pass inline objects without churning the effect.
    const stateRef = useRef(state);
    stateRef.current = state;
    const inspectShortcutRef = useRef(inspectShortcut);
    inspectShortcutRef.current = inspectShortcut;
    const recordShortcutRef = useRef(recordShortcut);
    recordShortcutRef.current = recordShortcut;
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const onKey = (e: KeyboardEvent) => {
            const inspect = inspectShortcutRef.current;
            if (inspect && matchesShortcut(e, inspect)) {
                e.preventDefault();
                stateRef.current.toggleInspect();
                setCollapsed(false);
                return;
            }
            const record = recordShortcutRef.current;
            if (record && matchesShortcut(e, record)) {
                e.preventDefault();
                const s = stateRef.current;
                if (s.recording) s.stop();
                else s.start();
                setCollapsed(false);
            }
        };
        document.addEventListener('keydown', onKey, true);
        return () =>
            document.removeEventListener('keydown', onKey, true);
    }, []);

    const code = useMemo(
        () =>
            generateFlowCode({
                flow: state.flow,
                flowVariableName: 'recordedFlow',
                includeImports: false,
            }),
        [state.flow],
    );

    const onCopy = async () => {
        if (state.flow.length === 0) {
            setCopyHint('Nothing recorded yet');
            window.setTimeout(() => setCopyHint(null), 1600);
            return;
        }
        try {
            await navigator.clipboard.writeText(code);
            setCopyHint('Copied!');
        } catch {
            setCopyHint('Copy blocked — select manually');
        }
        window.setTimeout(() => setCopyHint(null), 1600);
    };

    return (
        <>
            <div
                data-rca-recorder="panel"
                style={{
                    ...positionStyle(position),
                    width: collapsed ? 'auto' : 360,
                    maxWidth: 'calc(100vw - 32px)',
                    background: PANEL_BG,
                    border: `1px solid ${PANEL_BORDER}`,
                    borderRadius: 12,
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
                    color: TEXT,
                    fontFamily:
                        'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    fontSize: 12.5,
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        borderBottom: collapsed
                            ? 'none'
                            : `1px solid ${PANEL_BORDER}`,
                    }}
                >
                    <span
                        aria-hidden
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: state.recording ? RED : TEXT_DIM,
                            boxShadow: state.recording
                                ? '0 0 0 4px rgba(239, 91, 107, 0.18)'
                                : 'none',
                            animation: state.recording
                                ? 'rca-recorder-pulse 1.5s ease-in-out infinite'
                                : undefined,
                        }}
                    />
                    <span style={{ fontWeight: 600 }}>Recorder</span>
                    <span style={{ color: TEXT_DIM, fontSize: 11 }}>
                        {state.flow.length}{' '}
                        {state.flow.length === 1 ? 'step' : 'steps'}
                    </span>
                    <button
                        type="button"
                        onClick={() => setCollapsed((v) => !v)}
                        style={iconBtnStyle()}
                        aria-label={collapsed ? 'Expand' : 'Collapse'}
                    >
                        {collapsed ? '▴' : '▾'}
                    </button>
                </div>

                {collapsed ? null : (
                    <>
                        <div
                            style={{
                                display: 'flex',
                                gap: 6,
                                padding: '10px 12px',
                                borderBottom: `1px solid ${PANEL_BORDER}`,
                                flexWrap: 'wrap',
                            }}
                        >
                            <button
                                type="button"
                                onClick={
                                    state.recording ? state.stop : state.start
                                }
                                style={{
                                    ...primaryBtnStyle(
                                        state.recording ? RED : GREEN,
                                    ),
                                }}
                                title={
                                    recordShortcut
                                        ? `${state.recording ? 'Stop' : 'Record'} (${formatShortcut(recordShortcut)})`
                                        : state.recording
                                            ? 'Stop recording'
                                            : 'Start recording'
                                }
                            >
                                {state.recording ? '■ Stop' : '● Record'}
                            </button>
                            {showInspector ? (
                                <button
                                    type="button"
                                    onClick={state.toggleInspect}
                                    style={ghostBtnStyle(state.inspecting)}
                                    aria-pressed={state.inspecting}
                                    title={
                                        inspectShortcut
                                            ? `Toggle element picker (${formatShortcut(inspectShortcut)})`
                                            : 'Toggle element picker'
                                    }
                                >
                                    {state.inspecting
                                        ? '⊕ Picking…'
                                        : '⊕ Inspect'}
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={state.clear}
                                style={ghostBtnStyle(false)}
                                disabled={state.flow.length === 0}
                            >
                                Clear
                            </button>
                            <div style={{ flex: 1 }} />
                            <button
                                type="button"
                                onClick={onCopy}
                                style={ghostBtnStyle(false)}
                                title="Copy as FlowStep[] code"
                            >
                                {copyHint ?? 'Copy code'}
                            </button>
                        </div>

                        <div
                            style={{
                                maxHeight: 260,
                                overflowY: 'auto',
                                padding: state.flow.length === 0 ? 0 : 6,
                            }}
                        >
                            {state.flow.length === 0 ? (
                                <div
                                    style={{
                                        padding: '18px 12px',
                                        color: TEXT_DIM,
                                        textAlign: 'center',
                                        fontSize: 12,
                                    }}
                                >
                                    {state.recording
                                        ? 'Click, type, or pick an element to start recording steps.'
                                        : 'Press Record to start capturing interactions.'}
                                </div>
                            ) : (
                                state.flow.map((step, i) => {
                                    const { label, detail } =
                                        summarizeStep(step);
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                padding: '6px 8px',
                                                borderRadius: 6,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color: TEXT_DIM,
                                                    fontFamily:
                                                        'ui-monospace, SFMono-Regular, Menlo, monospace',
                                                    fontSize: 10.5,
                                                    width: 18,
                                                    textAlign: 'right',
                                                }}
                                            >
                                                {i + 1}
                                            </span>
                                            <span
                                                style={{
                                                    color: STEP_COLOR[
                                                        step.type
                                                    ],
                                                    background: `${STEP_COLOR[step.type]}1f`,
                                                    border: `1px solid ${STEP_COLOR[step.type]}55`,
                                                    fontFamily:
                                                        'ui-monospace, SFMono-Regular, Menlo, monospace',
                                                    fontSize: 10.5,
                                                    padding: '1px 6px',
                                                    borderRadius: 4,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {step.type}
                                            </span>
                                            <span
                                                style={{
                                                    flex: 1,
                                                    minWidth: 0,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    fontFamily:
                                                        'ui-monospace, SFMono-Regular, Menlo, monospace',
                                                    fontSize: 11.5,
                                                    color: TEXT,
                                                }}
                                                title={label + ' ' + detail}
                                            >
                                                {label}
                                                {detail ? (
                                                    <span
                                                        style={{
                                                            color: TEXT_DIM,
                                                        }}
                                                    >
                                                        {' '}
                                                        {detail}
                                                    </span>
                                                ) : null}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    state.removeAt(i)
                                                }
                                                style={removeBtnStyle()}
                                                aria-label="Remove step"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {state.inspecting ? (
                            <div
                                style={{
                                    padding: '8px 12px',
                                    borderTop: `1px solid ${PANEL_BORDER}`,
                                    background: 'rgba(106, 169, 255, 0.06)',
                                    color: ACCENT,
                                    fontSize: 11,
                                }}
                            >
                                Hover any element &mdash; click to insert it
                                as a step. Press <kbd style={kbdStyle()}>Esc</kbd>{' '}
                                {inspectShortcut ? (
                                    <>
                                        or{' '}
                                        <kbd style={kbdStyle()}>
                                            {formatShortcut(inspectShortcut)}
                                        </kbd>{' '}
                                    </>
                                ) : null}
                                to exit.
                            </div>
                        ) : !state.recording &&
                          (inspectShortcut || recordShortcut) ? (
                            <div
                                style={{
                                    padding: '8px 12px',
                                    borderTop: `1px solid ${PANEL_BORDER}`,
                                    color: TEXT_DIM,
                                    fontSize: 10.5,
                                    display: 'flex',
                                    gap: 10,
                                    flexWrap: 'wrap',
                                }}
                            >
                                {recordShortcut ? (
                                    <span>
                                        <kbd style={kbdStyle()}>
                                            {formatShortcut(recordShortcut)}
                                        </kbd>{' '}
                                        record
                                    </span>
                                ) : null}
                                {inspectShortcut ? (
                                    <span>
                                        <kbd style={kbdStyle()}>
                                            {formatShortcut(inspectShortcut)}
                                        </kbd>{' '}
                                        inspect
                                    </span>
                                ) : null}
                            </div>
                        ) : null}
                    </>
                )}
            </div>

            {state.inspecting ? (
                <InspectorOverlay
                    target={state.hoveredElement}
                    selectorOptions={props.selectorOptions}
                />
            ) : null}

            <style>{KEYFRAMES}</style>
        </>
    );
}

const KEYFRAMES = `
@keyframes rca-recorder-pulse {
    0%, 100% { box-shadow: 0 0 0 4px rgba(239, 91, 107, 0.18); }
    50%      { box-shadow: 0 0 0 7px rgba(239, 91, 107, 0); }
}
`;

function iconBtnStyle(): CSSProperties {
    return {
        marginLeft: 'auto',
        background: 'transparent',
        border: `1px solid ${PANEL_BORDER}`,
        color: TEXT_DIM,
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 11,
        cursor: 'pointer',
        lineHeight: 1,
    };
}

function primaryBtnStyle(color: string): CSSProperties {
    return {
        background: color,
        color: '#0a0c11',
        border: `1px solid ${color}`,
        padding: '5px 12px',
        borderRadius: 6,
        fontSize: 11.5,
        fontWeight: 600,
        cursor: 'pointer',
    };
}

function ghostBtnStyle(active: boolean): CSSProperties {
    return {
        background: active ? 'rgba(106, 169, 255, 0.12)' : 'transparent',
        color: active ? ACCENT : TEXT,
        border: `1px solid ${active ? 'rgba(106, 169, 255, 0.4)' : PANEL_BORDER}`,
        padding: '5px 10px',
        borderRadius: 6,
        fontSize: 11.5,
        cursor: 'pointer',
    };
}

function removeBtnStyle(): CSSProperties {
    return {
        background: 'transparent',
        border: 'none',
        color: TEXT_DIM,
        fontSize: 14,
        lineHeight: 1,
        cursor: 'pointer',
        padding: '2px 6px',
        borderRadius: 4,
    };
}

function kbdStyle(): CSSProperties {
    return {
        background: 'rgba(255, 255, 255, 0.06)',
        border: `1px solid ${PANEL_BORDER}`,
        borderRadius: 4,
        padding: '0 5px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 10,
    };
}
