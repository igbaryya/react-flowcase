import { useState } from 'react';
import { useAwaitableClick } from 'react-flowcase';
import { ConceptCallout } from '../common/ConceptCallout';
import { DemoPageShell } from '../common/DemoPageShell';
import { OutcomePanel } from '../common/OutcomePanel';
import { useDemoFlow } from '../common/useDemoFlow';
import { resilienceFlow, resilienceFlowOptions } from './automationFlow';
import './resilience-demo.css';

interface SetupData {
    username: string;
    country: string;
    bio: string;
    avatar: string | null;
}

interface FinishResult {
    ok: boolean;
    data: SetupData;
    finishedAt: number;
}

const COUNTRIES = [
    { value: '', label: 'Pick a country…' },
    { value: 'US', label: 'United States' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'DE', label: 'Germany' },
    { value: 'JP', label: 'Japan' },
] as const;

const SLOW_AVATAR_MS = 3000;
const AVATAR_GLYPHS = ['🦊', '🦉', '🐙', '🦋', '🐝', '🦄'];

export function ResilienceDemoPage() {
    const [username, setUsername] = useState('');
    const [country, setCountry] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [generatingAvatar, setGeneratingAvatar] = useState(false);
    const [finished, setFinished] = useState<FinishResult | null>(null);

    const flowState = useDemoFlow({
        initialFlow: resilienceFlow,
        initialRunOptions: resilienceFlowOptions,
        onBeforeStart: () => {
            setUsername('');
            setCountry('');
            setBio('');
            setAvatar(null);
            setGeneratingAvatar(false);
            setFinished(null);
        },
    });
    const { running, clearRunState } = flowState;

    /**
     * Deliberately slow handler. The flow step gives it 1500ms via
     * `wait: 1500`, so it ALWAYS times out — but the side-effect (setting
     * the avatar) still lands afterwards, because we can't actually abort
     * arbitrary user code.
     */
    const generateAvatar = async () => {
        setGeneratingAvatar(true);
        await new Promise((r) => setTimeout(r, SLOW_AVATAR_MS));
        const next =
            AVATAR_GLYPHS[Math.floor(Math.random() * AVATAR_GLYPHS.length)];
        setAvatar(next);
        setGeneratingAvatar(false);
        return { ok: true, avatar: next };
    };
    const trackedGenerateAvatar = useAwaitableClick(generateAvatar);

    const finishSetup = async (): Promise<FinishResult> => {
        await new Promise((r) => setTimeout(r, 250));
        const data: SetupData = { username, country, bio, avatar };
        const result: FinishResult = {
            ok:
                username.trim().length > 0 &&
                country.length > 0 &&
                bio.trim().length > 0,
            data,
            finishedAt: Date.now(),
        };
        setFinished(result);
        return result;
    };
    const trackedFinish = useAwaitableClick(finishSetup);

    const reset = () => {
        setUsername('');
        setCountry('');
        setBio('');
        setAvatar(null);
        setGeneratingAvatar(false);
        setFinished(null);
        clearRunState();
    };

    return (
        <DemoPageShell
            title="Resilience: timeouts, skips, cancel"
            description={
                <>
                    Real flows hit slow handlers, missing optional buttons, and
                    impatient users. This account-setup flow trips each one on
                    purpose — and keeps going. Watch the steps indicator paint{' '}
                    <span className="res-legend res-legend-timeout">timeout</span>
                    {' '}then{' '}
                    <span className="res-legend res-legend-failed">skipped</span>
                    {' '}then{' '}
                    <span className="res-legend res-legend-success">success</span>.
                </>
            }
            flowState={flowState}
            pageOutcome={
                finished ? (
                    <OutcomePanel
                        ok={finished.ok}
                        message={
                            finished.ok
                                ? `Finished at ${new Date(finished.finishedAt).toLocaleTimeString()}`
                                : 'Validation failed — username / country / bio cannot be empty.'
                        }
                        data={finished.data}
                    />
                ) : undefined
            }
            codePreview={{
                componentName: 'AccountSetupAutomation',
                flowVariableName: 'resilienceFlow',
                optionsVariableName: 'resilienceFlowOptions',
                viewSource: `<button type="button" onClick={start}>
    Run automation
</button>

<input id="res-username" />

{/* Handler intentionally takes 3000ms; flow gives it wait: 1500 → timeout */}
<button id="res-generate-avatar" type="button" onClick={generateAvatar}>
    Generate avatar
</button>

<select id="res-country">{/* options... */}</select>

{/* Only rendered for returning users — flow uses moveOnFailure: true so the
    missing element is skipped, not fatal: */}
{returningUser ? (
    <button id="res-skip-onboarding">Skip onboarding</button>
) : null}

<textarea id="res-bio" />

<button id="res-finish" type="button" onClick={finish}>
    Finish setup
</button>`,
            }}
        >
            <ConceptCallout
                headline="Three recovery primitives every real-world flow needs."
                points={[
                    {
                        api: 'wait: 1500',
                        description: (
                            <>
                                Numeric click <code>wait</code> caps how long
                                the runner waits for the handler. &ldquo;Generate
                                avatar&rdquo; takes <strong>3000ms</strong>;
                                the step gives it 1500ms and reports{' '}
                                <code>failure.reason: &lsquo;timeout&rsquo;</code>.
                            </>
                        ),
                    },
                    {
                        api: 'moveOnFailure: true',
                        description: (
                            <>
                                Lets the flow survive a step failure (timeout,
                                missing element, assertion). Used twice here —
                                once for the slow avatar, once for the missing{' '}
                                <code>#res-skip-onboarding</code> button.
                            </>
                        ),
                    },
                    {
                        api: 'cancel()',
                        description: (
                            <>
                                The stop button in the header calls{' '}
                                <code>cancel()</code>. Every async layer
                                respects the abort signal — the cursor halts,
                                the typing loop breaks, and the run resolves
                                with <code>failure.reason: &lsquo;cancelled&rsquo;</code>.
                                Try stopping mid-typing.
                            </>
                        ),
                    },
                ]}
            />

            <div className="demo-card res-setup-card">
                <div className="res-avatar-row">
                    <div className="res-avatar" aria-hidden>
                        {generatingAvatar ? (
                            <span className="res-avatar-spinner" />
                        ) : avatar ? (
                            <span className="res-avatar-glyph">{avatar}</span>
                        ) : (
                            <span className="res-avatar-empty">?</span>
                        )}
                    </div>
                    <div className="res-avatar-meta">
                        <strong>Avatar</strong>
                        <span>
                            {generatingAvatar
                                ? `Generating… (~${SLOW_AVATAR_MS}ms)`
                                : avatar
                                  ? 'Generated after the step gave up — handlers still run to completion.'
                                  : 'No avatar yet.'}
                        </span>
                    </div>
                    <button
                        id="res-generate-avatar"
                        type="button"
                        className="btn"
                        onClick={trackedGenerateAvatar}
                        disabled={generatingAvatar}
                    >
                        {generatingAvatar ? 'Generating…' : 'Generate avatar'}
                    </button>
                </div>

                <div className="demo-row">
                    <label htmlFor="res-username">Username</label>
                    <input
                        id="res-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                <div className="demo-row">
                    <label htmlFor="res-country">Country</label>
                    <select
                        id="res-country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                    >
                        {COUNTRIES.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="demo-row">
                    <label htmlFor="res-bio">Bio</label>
                    <textarea
                        id="res-bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="demo-actions">
                    <button
                        id="res-finish"
                        type="button"
                        className="btn btn-primary"
                        onClick={trackedFinish}
                    >
                        Finish setup
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
                <p className="res-note">
                    Note: <code>#res-skip-onboarding</code> is intentionally
                    not rendered — it&rsquo;s the &ldquo;optional&rdquo; step
                    the flow tries and then skips.
                </p>
            </div>

        </DemoPageShell>
    );
}
