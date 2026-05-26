import { useState } from 'react';
import { useAwaitableClick } from 'react-flowcase';
import { ConceptCallout } from '../common/ConceptCallout';
import { DemoPageShell } from '../common/DemoPageShell';
import { OutcomePanel } from '../common/OutcomePanel';
import { useDemoFlow } from '../common/useDemoFlow';
import { asyncProfileFlow, asyncProfileFlowOptions } from './automationFlow';
import './async-demo.css';

interface ProfileData {
    name: string;
    bio: string;
}

interface SaveResult {
    ok: boolean;
    data: ProfileData;
    savedAt: number;
}

const LOAD_DELAY_MS = 1500;

export function AsyncDemoPage() {
    const [loading, setLoading] = useState(false);
    const [formReady, setFormReady] = useState(false);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [saved, setSaved] = useState<SaveResult | null>(null);

    const flowState = useDemoFlow({
        initialFlow: asyncProfileFlow,
        initialRunOptions: asyncProfileFlowOptions,
        onBeforeStart: () => {
            setLoading(false);
            setFormReady(false);
            setName('');
            setBio('');
            setSaved(null);
        },
    });
    const { running, clearRunState } = flowState;

    const loadProfile = async () => {
        setLoading(true);
        await new Promise((r) => setTimeout(r, LOAD_DELAY_MS));
        setLoading(false);
        setFormReady(true);
        return { ok: true };
    };
    const trackedLoad = useAwaitableClick(loadProfile);

    const saveProfile = async (): Promise<SaveResult> => {
        await new Promise((r) => setTimeout(r, 300));
        const result: SaveResult = {
            ok: name.trim().length > 0 && bio.trim().length > 0,
            data: { name, bio },
            savedAt: Date.now(),
        };
        setSaved(result);
        return result;
    };
    const trackedSave = useAwaitableClick(saveProfile);

    const reset = () => {
        setLoading(false);
        setFormReady(false);
        setName('');
        setBio('');
        setSaved(null);
        clearRunState();
    };

    const canSave = name.trim().length > 0 && bio.trim().length > 0;

    return (
        <DemoPageShell
            title="Async / waitFor automation"
            description={
                <>
                    The runner clicks <code>Load profile</code> (fire-and-forget),
                    then <strong>waitFor</strong> polls until the lazily-rendered
                    form is visible before typing into it. A second{' '}
                    <code>waitFor</code> waits for Save to flip from disabled to
                    enabled. No fixed delays, no guessing.
                </>
            }
            flowState={flowState}
            pageOutcome={
                saved ? (
                    <OutcomePanel
                        ok={saved.ok}
                        message={
                            saved.ok
                                ? `Saved at ${new Date(saved.savedAt).toLocaleTimeString()}`
                                : 'Validation failed (name or bio empty)'
                        }
                        data={saved.data}
                    />
                ) : undefined
            }
            codePreview={{
                componentName: 'AsyncProfileAutomation',
                flowVariableName: 'asyncProfileFlow',
                optionsVariableName: 'asyncProfileFlowOptions',
                viewSource: `<button type="button" onClick={start}>
    Run automation
</button>

<button id="load-profile" type="button" onClick={loadProfile}>
    Load profile
</button>

{/* Lazily mounted after the 1.5s fetch resolves: */}
{profile ? (
    <>
        <input id="profile-name" placeholder="Name" />
        <textarea id="profile-bio" />
        <button id="profile-save" disabled={!ready}>
            Save
        </button>
    </>
) : null}`,
            }}
        >
            <ConceptCallout
                headline="Stop guessing at delays — wait for the UI to be ready."
                points={[
                    {
                        api: "type: 'waitFor'",
                        description: (
                            <>
                                A first-class step that polls until a target
                                matches a state — or a predicate flips true —
                                with a real timeout. No fixed delays.
                            </>
                        ),
                    },
                    {
                        api: "state: 'visible'",
                        description: (
                            <>
                                Default match condition. Other states:{' '}
                                <code>attached</code>, <code>enabled</code>,{' '}
                                <code>detached</code> (wait for it to go
                                away).
                            </>
                        ),
                    },
                    {
                        api: 'wait: false',
                        description: (
                            <>
                                The Load click is fire-and-forget — the
                                runner doesn&rsquo;t await its 1.5s handler.{' '}
                                <code>waitFor</code> does the right thing
                                next.
                            </>
                        ),
                    },
                    {
                        api: 'moveTo: true',
                        description: (
                            <>
                                After the wait succeeds, slide the cursor
                                over the resolved element so the next step
                                feels continuous.
                            </>
                        ),
                    },
                ]}
            />

            <div className="demo-card">
                <div className="demo-actions">
                    <button
                        id="load-profile"
                        type="button"
                        className="btn"
                        onClick={trackedLoad}
                        disabled={loading || formReady}
                    >
                        {loading
                            ? 'Loading…'
                            : formReady
                              ? 'Loaded'
                              : 'Load profile'}
                    </button>
                    <button
                        type="button"
                        className="btn"
                        onClick={reset}
                        disabled={running}
                    >
                        Reset
                    </button>
                </div>

                {loading ? (
                    <div className="async-loading">
                        <span className="async-spinner" aria-hidden />
                        <span>
                            Fetching profile data…{' '}
                            <span className="async-loading-hint">
                                ({LOAD_DELAY_MS}ms simulated network)
                            </span>
                        </span>
                    </div>
                ) : null}

                {formReady ? (
                    <div id="profile-form" className="async-form">
                        <div className="demo-row">
                            <label htmlFor="profile-name">Display name</label>
                            <input
                                id="profile-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="off"
                            />
                        </div>
                        <div className="demo-row">
                            <label htmlFor="profile-bio">Short bio</label>
                            <textarea
                                id="profile-bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                            />
                        </div>
                        <div className="demo-actions">
                            <button
                                id="profile-save"
                                type="button"
                                className="btn btn-primary"
                                onClick={trackedSave}
                                disabled={!canSave}
                                title={
                                    !canSave
                                        ? 'Fill in both fields to enable save'
                                        : 'Save profile'
                                }
                            >
                                Save profile
                            </button>
                            <span className="async-form-hint">
                                {canSave
                                    ? 'Ready to save.'
                                    : 'Save is disabled until both fields are filled — waitFor will pause here until then.'}
                            </span>
                        </div>
                    </div>
                ) : null}
            </div>

        </DemoPageShell>
    );
}
