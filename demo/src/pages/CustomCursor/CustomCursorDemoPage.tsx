import { useCallback, useMemo, useState } from 'react';
import type { CursorSource, CursorVisibilityMode } from 'react-flowcase';
import { ConceptCallout } from '../common/ConceptCallout';
import { DemoPageShell } from '../common/DemoPageShell';
import {
    useDemoFlow,
    DEFAULT_CURSOR_OPTIONS,
} from '../common/useDemoFlow';
import { ReactCursorIcon } from './ReactCursorIcon';
import {
    customCursorFlow,
    customCursorFlowOptions,
} from './automationFlow';
import './custom-cursor-demo.css';

const BASE = import.meta.env.BASE_URL;

function publicAsset(path: string): string {
    const base = BASE.endsWith('/') ? BASE : `${BASE}/`;
    return `${base}${path.replace(/^\//, '')}`;
}

const LOCAL_CURSORS = [
    { id: 'local-1' as const, label: 'Flame pointer', file: 'demo1.svg' },
    { id: 'local-2' as const, label: 'Map pin', file: 'demo2.svg' },
    { id: 'local-3' as const, label: 'Crosshair', file: 'demo3.svg' },
];

/** Small, stable external asset for the “remote URL” example. */
const EXTERNAL_CURSOR_URL =
    'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f446.svg';

type CursorMode =
    | 'default'
    | 'local-1'
    | 'local-2'
    | 'local-3'
    | 'react'
    | 'external';

const INITIAL_CURSOR_OPTIONS = {
    ...DEFAULT_CURSOR_OPTIONS,
    visibility: 'always' as const,
    autoHide: false,
    initial: { x: 280, y: 220 },
    appearance: publicAsset('demo1.svg'),
};

export function CustomCursorDemoPage() {
    const [mode, setMode] = useState<CursorMode>('local-1');
    const [cursorSize, setCursorSize] = useState(32);

    const flowState = useDemoFlow({
        initialFlow: customCursorFlow,
        initialRunOptions: customCursorFlowOptions,
        defaultCursorOptions: INITIAL_CURSOR_OPTIONS,
    });
    const { running, setCursorOptions, cursorOptions } = flowState;

    const applyMode = useCallback(
        (next: CursorMode) => {
            setMode(next);
            setCursorOptions((prev) => {
                const base = { ...prev };
                if (next === 'default') {
                    return { ...base, appearance: undefined };
                }
                if (next === 'react') {
                    return { ...base, appearance: undefined };
                }
                if (next === 'external') {
                    return { ...base, appearance: EXTERNAL_CURSOR_URL };
                }
                const file =
                    LOCAL_CURSORS.find((c) => c.id === next)?.file ??
                    'demo1.svg';
                return { ...base, appearance: publicAsset(file) };
            });
        },
        [setCursorOptions],
    );

    const cursorVisual = useMemo((): CursorSource | undefined => {
        if (mode === 'react') {
            return ({ size }) => <ReactCursorIcon size={size} />;
        }
        return undefined;
    }, [mode]);

    const activeReadout = useMemo(() => {
        switch (mode) {
            case 'default':
                return (
                    <>
                        <strong>Built-in</strong> — omit the{' '}
                        <code>cursor</code> prop; gradient pointer from the
                        library.
                    </>
                );
            case 'react':
                return (
                    <>
                        <strong>ReactNode</strong> —{' '}
                        <code>
                            {'cursor={({ size }) => <ReactCursorIcon size={size} /> }'}
                        </code>
                    </>
                );
            case 'external':
                return (
                    <>
                        <strong>External URL</strong> —{' '}
                        <code>cursor.appearance</code> ={' '}
                        <code>{EXTERNAL_CURSOR_URL}</code>
                    </>
                );
            default: {
                const file =
                    LOCAL_CURSORS.find((c) => c.id === mode)?.file ?? '';
                return (
                    <>
                        <strong>Local public asset</strong> —{' '}
                        <code>cursor.appearance</code> ={' '}
                        <code>{publicAsset(file)}</code>
                    </>
                );
            }
        }
    }, [mode]);

    const updateVisibility = (visibility: CursorVisibilityMode) => {
        setCursorOptions((prev) => ({ ...prev, visibility }));
    };

    const updateAutoHide = (autoHide: boolean) => {
        setCursorOptions((prev) => ({ ...prev, autoHide }));
    };

    const visibility = cursorOptions.visibility ?? 'onStart';
    const autoHide = cursorOptions.autoHide ?? true;

    return (
        <DemoPageShell
            title="Custom cursors"
            description={
                <>
                    Swap the virtual cursor with local SVGs from{' '}
                    <code>/public</code>, a React component, or any image URL.
                    Tune visibility and size from the settings block — or open
                    the gear modal to edit <code>appearance</code> live.
                </>
            }
            flowState={flowState}
            cursorVisual={cursorVisual}
            cursorSize={cursorSize}
            codePreview={{
                componentName: 'CustomCursorDemo',
                flowVariableName: 'customCursorFlow',
                optionsVariableName: 'customCursorFlowOptions',
                viewSource: `<VirtualCursor
    position={cursor.position}
    visible={cursor.visible}
    size={${cursorSize}}
    cursor={
        mode === 'react'
            ? ({ size }) => <ReactCursorIcon size={size} />
            : cursor.appearance
    }
/>

<button id="cursor-pick-local-1" type="button" onClick={() => setMode('local-1')}>
    /demo1.svg
</button>`,
            }}
        >
            <ConceptCallout
                headline="Three ways to theme the cursor, plus hook-level settings."
                points={[
                    {
                        api: 'cursor.appearance (string)',
                        description: (
                            <>
                                Image URL or data URL on{' '}
                                <code>useVirtualCursor</code>. Forward to{' '}
                                <code>
                                    &lt;VirtualCursor
                                    cursor=&#123;cursor.appearance&#125; /&gt;
                                </code>
                                . Editable in FlowConfigModal &rarr; Overall.
                            </>
                        ),
                    },
                    {
                        api: 'cursor prop (ReactNode)',
                        description: (
                            <>
                                Pass SVG, a component, or a render function{' '}
                                <code>
                                    (&#123; size &#125;) =&gt; ReactNode
                                </code>{' '}
                                directly on <code>VirtualCursor</code> when you
                                need more than a flat URL.
                            </>
                        ),
                    },
                    {
                        api: 'visibility · autoHide · size',
                        description: (
                            <>
                                Control when the cursor shows during a flow, whether
                                it hides on completion, and the bounding box size in
                                CSS pixels.
                            </>
                        ),
                    },
                ]}
            />

            <div className="demo-card cursor-demo-card">
                <section className="cursor-demo-section" aria-labelledby="cursor-local-heading">
                    <h2 id="cursor-local-heading" className="cursor-demo-section-title">
                        Local assets
                    </h2>
                    <p className="cursor-demo-section-desc">
                        Files in <code>demo/public/</code> — served at{' '}
                        <code>{BASE}demo1.svg</code> (respects Vite{' '}
                        <code>base</code> on GitHub Pages).
                    </p>
                    <div className="cursor-demo-picks">
                        {LOCAL_CURSORS.map((item) => {
                            const src = publicAsset(item.file);
                            const active = mode === item.id;
                            return (
                                <button
                                    key={item.id}
                                    id={`cursor-pick-${item.id}`}
                                    type="button"
                                    className={`cursor-demo-pick${active ? ' is-active' : ''}`}
                                    onClick={() => applyMode(item.id)}
                                    aria-pressed={active}
                                >
                                    <span className="cursor-demo-pick-preview">
                                        <img src={src} alt="" draggable={false} />
                                    </span>
                                    <span className="cursor-demo-pick-label">
                                        {item.label}
                                    </span>
                                    <span className="cursor-demo-pick-path">
                                        /{item.file}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section
                    className="cursor-demo-section"
                    aria-labelledby="cursor-alt-heading"
                >
                    <h2 id="cursor-alt-heading" className="cursor-demo-section-title">
                        React &amp; remote image
                    </h2>
                    <div className="cursor-demo-alt-row">
                        <button
                            id="cursor-pick-react"
                            type="button"
                            className={`cursor-demo-alt${mode === 'react' ? ' is-active' : ''}`}
                            onClick={() => applyMode('react')}
                            aria-pressed={mode === 'react'}
                        >
                            <span className="cursor-demo-alt-title">
                                Custom React icon
                            </span>
                            <p className="cursor-demo-alt-detail">
                                Inline SVG via render prop — scales with{' '}
                                <code>size</code>.
                            </p>
                            <span className="cursor-demo-pick-preview">
                                <ReactCursorIcon size={28} />
                            </span>
                        </button>
                        <button
                            id="cursor-pick-external"
                            type="button"
                            className={`cursor-demo-alt${mode === 'external' ? ' is-active' : ''}`}
                            onClick={() => applyMode('external')}
                            aria-pressed={mode === 'external'}
                        >
                            <span className="cursor-demo-alt-title">
                                External image URL
                            </span>
                            <p className="cursor-demo-alt-detail">
                                Any HTTPS URL — here a Twemoji pointing hand from
                                jsDelivr.
                            </p>
                            <span className="cursor-demo-pick-preview">
                                <img
                                    src={EXTERNAL_CURSOR_URL}
                                    alt=""
                                    draggable={false}
                                />
                            </span>
                        </button>
                    </div>
                </section>

                <section
                    className="cursor-demo-section"
                    aria-labelledby="cursor-default-heading"
                >
                    <button
                        id="cursor-pick-default"
                        type="button"
                        className={`cursor-demo-alt${mode === 'default' ? ' is-active' : ''}`}
                        onClick={() => applyMode('default')}
                        aria-pressed={mode === 'default'}
                        style={{ width: '100%' }}
                    >
                        <span className="cursor-demo-alt-title">
                            Built-in gradient pointer
                        </span>
                        <p className="cursor-demo-alt-detail">
                            Omit <code>cursor</code> / <code>appearance</code>{' '}
                            to use the library default.
                        </p>
                    </button>
                </section>

                <p className="cursor-demo-active-readout">{activeReadout}</p>

                <div className="cursor-demo-preview-zone">
                    Move the cursor over this card after picking a style. Run
                    automation to cycle through each picker automatically.
                </div>
            </div>

            <div className="demo-card cursor-demo-settings-card">
                <section
                    className="cursor-demo-section"
                    aria-labelledby="cursor-settings-heading"
                >
                    <h2
                        id="cursor-settings-heading"
                        className="cursor-demo-section-title"
                    >
                        Cursor settings
                    </h2>
                    <p className="cursor-demo-section-desc">
                        These map to <code>useVirtualCursor</code> options and
                        the Overall tab in the flow config modal.
                    </p>

                    <div className="cursor-demo-settings">
                        <div className="cursor-demo-setting-row">
                            <span className="cursor-demo-section-title" style={{ textTransform: 'none', letterSpacing: 0 }}>
                                visibility
                            </span>
                            <div
                                className="cursor-demo-visibility"
                                role="radiogroup"
                                aria-label="Cursor visibility"
                            >
                                {(
                                    [
                                        ['always', 'Always visible'],
                                        ['onStart', 'On flow start'],
                                        ['never', 'Never auto-show'],
                                    ] as const
                                ).map(([value, label]) => (
                                    <label key={value}>
                                        <input
                                            type="radio"
                                            name="cursor-visibility"
                                            value={value}
                                            checked={visibility === value}
                                            onChange={() =>
                                                updateVisibility(value)
                                            }
                                            disabled={running}
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="cursor-demo-setting-row">
                            <label className="cursor-demo-checkbox">
                                <input
                                    type="checkbox"
                                    checked={autoHide}
                                    onChange={(e) =>
                                        updateAutoHide(e.target.checked)
                                    }
                                    disabled={running || visibility === 'always'}
                                />
                                autoHide — hide when the flow ends
                            </label>
                            {visibility === 'always' && (
                                <p className="cursor-demo-section-desc">
                                    Ignored when <code>visibility</code> is{' '}
                                    <code>always</code>.
                                </p>
                            )}
                        </div>

                        <div className="cursor-demo-setting-row">
                            <label htmlFor="cursor-size-range">
                                VirtualCursor size (px)
                            </label>
                            <input
                                id="cursor-size-range"
                                className="cursor-demo-range"
                                type="range"
                                min={20}
                                max={56}
                                step={2}
                                value={cursorSize}
                                onChange={(e) =>
                                    setCursorSize(Number(e.target.value))
                                }
                                disabled={running}
                            />
                            <div className="cursor-demo-range-meta">
                                <span>20</span>
                                <span>{cursorSize}px</span>
                                <span>56</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </DemoPageShell>
    );
}
