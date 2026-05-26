import { useState } from 'react';
import { FlowRecorder, useFlowRecorder } from 'react-flowcase';
import { generateFlowCode } from '../../flow';
import { CodeBlock } from '../common/CodeBlock';
import { ConceptCallout } from '../common/ConceptCallout';
import './recorder-demo.css';

interface SignupData {
    email: string;
    name: string;
    plan: string;
    terms: boolean;
}

export function RecorderDemoPage() {
    const recorder = useFlowRecorder();

    const [data, setData] = useState<SignupData>({
        email: '',
        name: '',
        plan: 'starter',
        terms: false,
    });
    const [submittedAt, setSubmittedAt] = useState<number | null>(null);

    const code = generateFlowCode({
        flow: recorder.flow,
        flowVariableName: 'recordedFlow',
    });

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSubmittedAt(Date.now());
        window.setTimeout(() => setSubmittedAt(null), 1500);
    };

    return (
        <div className="demo-page demo-page-recorder">
            <div className="demo-page-main">
                <div className="demo-page-header">
                    <div>
                        <h1>Flow recorder</h1>
                        <p>
                            A dev-mode debugger that watches you click and
                            type, then emits a copy-pastable{' '}
                            <code>FlowStep[]</code>. Drop the{' '}
                            <code>&lt;FlowRecorder /&gt;</code> panel into
                            your app (gated on{' '}
                            <code>import.meta.env.DEV</code>) and you have a
                            live element-picker plus a recorder for the
                            whole app.
                        </p>
                    </div>
                    <div className="demo-page-header-actions">
                        <span
                            className={`recorder-status${
                                recorder.recording
                                    ? ' recorder-status-on'
                                    : ''
                            }`}
                        >
                            <span aria-hidden className="recorder-status-dot" />
                            {recorder.recording ? 'Recording' : 'Idle'}
                        </span>
                    </div>
                </div>

                <ConceptCallout
                    headline="Record once, replay forever — no setup, no selectors to invent."
                    points={[
                        {
                            api: 'bestSelector(el)',
                            description: (
                                <>
                                    Picks the most stable selector for any
                                    element: <code>#id</code> →{' '}
                                    <code>[data-testid]</code> →{' '}
                                    <code>[name]</code> →{' '}
                                    <code>[aria-label]</code> → unique class
                                    → structural{' '}
                                    <code>:nth-of-type</code> fallback.
                                </>
                            ),
                        },
                        {
                            api: 'useFlowRecorder()',
                            description: (
                                <>
                                    Capture-phase listeners on{' '}
                                    <code>click</code> / <code>input</code> /{' '}
                                    <code>change</code> /{' '}
                                    <code>keydown</code>. Consecutive
                                    keystrokes in the same input are
                                    coalesced into a single step.
                                </>
                            ),
                        },
                        {
                            api: 'Inspect mode',
                            description: (
                                <>
                                    Like browser devtools&rsquo; element
                                    picker. Hover to highlight, click to
                                    insert a step without firing the
                                    underlying handler. Press <kbd>Esc</kbd>{' '}
                                    to exit.
                                </>
                            ),
                        },
                        {
                            api: 'Dev-mode hotkeys',
                            description: (
                                <>
                                    Mount the panel once (gated on{' '}
                                    <code>import.meta.env.DEV</code>) and
                                    trigger it from anywhere:{' '}
                                    <kbd>Alt+Shift+R</kbd> toggles record,{' '}
                                    <kbd>Alt+Shift+I</kbd> opens the
                                    inspector &mdash; same idea as Chrome
                                    DevTools&rsquo; element picker. Both are
                                    configurable via <code>recordShortcut</code>{' '}
                                    and <code>inspectShortcut</code>.
                                </>
                            ),
                        },
                        {
                            api: 'generateFlowCode',
                            description: (
                                <>
                                    The same emitter used by every other
                                    demo turns the recorded flow into a
                                    one-click copy-pastable TypeScript
                                    snippet.
                                </>
                            ),
                        },
                    ]}
                />

                <div className="recorder-stage">
                    <div className="recorder-stage-header">
                        <div>
                            <h3>Sample sign-up app</h3>
                            <p>
                                Interact with this UI &mdash; the recorder
                                panel in the corner appends a step for each
                                action. Try the inspector too: click{' '}
                                <em>Inspect</em>, hover the form, and watch
                                the computed selectors light up.
                            </p>
                        </div>
                    </div>

                    <form
                        className="recorder-form"
                        onSubmit={onSubmit}
                        aria-label="Sign-up form"
                    >
                        <div className="recorder-row">
                            <label htmlFor="recorder-email">Email</label>
                            <input
                                id="recorder-email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={data.email}
                                onChange={(e) =>
                                    setData((d) => ({
                                        ...d,
                                        email: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="recorder-row">
                            <label htmlFor="recorder-name">Display name</label>
                            <input
                                id="recorder-name"
                                name="name"
                                type="text"
                                placeholder="Ada Lovelace"
                                value={data.name}
                                onChange={(e) =>
                                    setData((d) => ({
                                        ...d,
                                        name: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="recorder-row">
                            <label htmlFor="recorder-plan">Plan</label>
                            <select
                                id="recorder-plan"
                                name="plan"
                                value={data.plan}
                                onChange={(e) =>
                                    setData((d) => ({
                                        ...d,
                                        plan: e.target.value,
                                    }))
                                }
                            >
                                <option value="starter">Starter (free)</option>
                                <option value="team">Team — $12/mo</option>
                                <option value="pro">Pro — $39/mo</option>
                            </select>
                        </div>

                        <div className="recorder-tile-row">
                            <button
                                type="button"
                                data-testid="signup-google"
                                className="recorder-tile"
                                onClick={() => {
                                    /* fake oauth */
                                }}
                            >
                                Continue with Google
                            </button>
                            <button
                                type="button"
                                aria-label="Continue with GitHub"
                                className="recorder-tile"
                                onClick={() => {
                                    /* fake oauth */
                                }}
                            >
                                <span aria-hidden>◧</span> GitHub
                            </button>
                        </div>

                        <label className="recorder-check">
                            <input
                                type="checkbox"
                                name="terms"
                                checked={data.terms}
                                onChange={(e) =>
                                    setData((d) => ({
                                        ...d,
                                        terms: e.target.checked,
                                    }))
                                }
                            />
                            I agree to the terms of service.
                        </label>

                        <div className="recorder-actions">
                            <button
                                type="submit"
                                data-testid="signup-submit"
                                className="btn btn-primary"
                            >
                                Create account
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={() =>
                                    setData({
                                        email: '',
                                        name: '',
                                        plan: 'starter',
                                        terms: false,
                                    })
                                }
                            >
                                Reset
                            </button>
                            {submittedAt ? (
                                <span className="recorder-flash">
                                    Submitted at{' '}
                                    {new Date(
                                        submittedAt,
                                    ).toLocaleTimeString()}
                                </span>
                            ) : null}
                        </div>
                    </form>
                </div>

                <div className="recorder-stage">
                    <div className="recorder-stage-header">
                        <div>
                            <h3>Generated flow</h3>
                            <p>
                                The recorder turns every captured
                                interaction into a real step. Below is{' '}
                                <code>generateFlowCode</code>&rsquo;s output
                                for the steps you&rsquo;ve recorded so far.
                            </p>
                        </div>
                        <div className="recorder-stage-actions">
                            <span className="recorder-count">
                                {recorder.flow.length}{' '}
                                {recorder.flow.length === 1
                                    ? 'step'
                                    : 'steps'}
                            </span>
                            <button
                                type="button"
                                className="btn"
                                onClick={recorder.clear}
                                disabled={recorder.flow.length === 0}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    {recorder.flow.length === 0 ? (
                        <div className="recorder-empty">
                            <strong>Nothing recorded yet.</strong> Click{' '}
                            <em>Record</em> in the floating panel, then
                            interact with the form above.
                        </div>
                    ) : (
                        <CodeBlock
                            code={code}
                            language="ts"
                            filename="recorded-flow.ts"
                        />
                    )}
                </div>
            </div>

            <FlowRecorder position="bottom-right" state={recorder} />
        </div>
    );
}
