import { useState } from 'react';
import { useAwaitableClick } from 'react-flowcase';
import { ConceptCallout } from '../common/ConceptCallout';
import { DemoPageShell } from '../common/DemoPageShell';
import { OutcomePanel } from '../common/OutcomePanel';
import { useDemoFlow } from '../common/useDemoFlow';
import { assertionsFlow, assertionsFlowOptions } from './automationFlow';
import './assertions-demo.css';

interface VerifyResult {
    ok: boolean;
    code: string;
    reason?: string;
    attemptedAt: number;
}

interface AttemptLog {
    code: string;
    ok: boolean;
    at: number;
}

const VALID_CODES = new Set(['CURSOR-2026', 'OPEN-SESAME', 'LET-ME-IN']);

export function AssertionsDemoPage() {
    const [code, setCode] = useState('');
    const [lastResult, setLastResult] = useState<VerifyResult | null>(null);
    const [attempts, setAttempts] = useState<AttemptLog[]>([]);

    const flowState = useDemoFlow({
        initialFlow: assertionsFlow,
        initialRunOptions: assertionsFlowOptions,
        onBeforeStart: () => {
            setCode('');
            setLastResult(null);
            setAttempts([]);
        },
    });
    const { running, clearRunState } = flowState;

    const handleVerify = async (): Promise<VerifyResult> => {
        await new Promise((r) => setTimeout(r, 250));
        const trimmed = code.trim();
        const ok = VALID_CODES.has(trimmed);
        const result: VerifyResult = {
            ok,
            code: trimmed,
            reason: ok ? undefined : 'invalid-code',
            attemptedAt: Date.now(),
        };
        setLastResult(result);
        setAttempts((prev) => [
            ...prev,
            { code: trimmed || '(empty)', ok, at: result.attemptedAt },
        ]);
        return result;
    };
    const trackedVerify = useAwaitableClick(handleVerify);

    const reset = () => {
        setCode('');
        setLastResult(null);
        setAttempts([]);
        clearRunState();
    };

    const failedCount = attempts.filter((a) => !a.ok).length;
    const successCount = attempts.filter((a) => a.ok).length;

    return (
        <DemoPageShell
            title="Assertion failures"
            description={
                <>
                    Assertions encode &ldquo;did this step{' '}
                    <em>actually</em> succeed?&rdquo; as a function on the
                    resolved outcome. When they fail you get a structured{' '}
                    <code>failure.reason: &lsquo;assertion-failed&rsquo;</code>{' '}
                    and the optional <code>onAssertFail</code> callback. Pair
                    with <code>moveOnFailure</code> for graceful retries.
                </>
            }
            flowState={flowState}
            pageOutcome={
                lastResult ? (
                    <OutcomePanel
                        ok={lastResult.ok}
                        message={
                            lastResult.ok
                                ? `Code accepted at ${new Date(lastResult.attemptedAt).toLocaleTimeString()}`
                                : `Code rejected — ${lastResult.reason ?? 'unknown reason'}`
                        }
                        data={{ code: lastResult.code, ok: lastResult.ok }}
                    />
                ) : undefined
            }
            codePreview={{
                componentName: 'CodeVerificationAutomation',
                flowVariableName: 'assertionsFlow',
                optionsVariableName: 'assertionsFlowOptions',
                viewSource: `<button type="button" onClick={start}>
    Run automation
</button>

<input id="verify-code" placeholder="Verification code" />

{/* Handler resolves with { ok: boolean }. The flow's assert checks .ok and
    moveOnFailure: true lets failed attempts retry on the next input + click. */}
<button id="verify-submit" type="button" onClick={verify}>
    Verify code
</button>`,
            }}
        >
            <ConceptCallout
                headline="Three submit attempts, two assertion failures, one final success."
                points={[
                    {
                        api: 'assert: (out) => boolean',
                        description: (
                            <>
                                Runs after the click handler resolves. Return
                                false to mark the step as failed even though
                                no error was thrown. The same function is
                                reused across all three attempts here.
                            </>
                        ),
                    },
                    {
                        api: 'moveOnFailure: true',
                        description: (
                            <>
                                Without this, the first failed assertion would
                                abort the run. With it, the runner logs the
                                failure and continues to the next step — the
                                building block for retry loops.
                            </>
                        ),
                    },
                    {
                        api: 'onAssertFail(step, outcome)',
                        description: (
                            <>
                                A run-options callback that fires for every
                                failed assertion (success continues to{' '}
                                <code>onStep</code>). Wire it to your
                                telemetry, then check the dev console while
                                the flow runs.
                            </>
                        ),
                    },
                    {
                        api: "failure.reason: 'assertion-failed'",
                        description: (
                            <>
                                The terminal failure when assertions kill the
                                run (no <code>moveOnFailure</code>). Distinct
                                from <code>timeout</code>,{' '}
                                <code>element-not-found</code>, and{' '}
                                <code>cancelled</code>.
                            </>
                        ),
                    },
                ]}
            />

            <div className="demo-card assert-card">
                <div className="demo-row">
                    <label htmlFor="verify-code">Verification code</label>
                    <input
                        id="verify-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        autoComplete="off"
                        placeholder="Try CURSOR-2026"
                    />
                </div>

                <div className="demo-actions">
                    <button
                        id="verify-submit"
                        type="button"
                        className="btn btn-primary"
                        onClick={trackedVerify}
                    >
                        Verify code
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

                <div className="assert-counters" aria-live="polite">
                    <div className="assert-counter assert-counter-failed">
                        <span className="assert-counter-num">
                            {failedCount}
                        </span>
                        <span className="assert-counter-label">
                            assert failed
                        </span>
                    </div>
                    <div className="assert-counter assert-counter-success">
                        <span className="assert-counter-num">
                            {successCount}
                        </span>
                        <span className="assert-counter-label">
                            assert passed
                        </span>
                    </div>
                </div>

                {attempts.length > 0 ? (
                    <div className="assert-log">
                        <div className="assert-log-title">Attempt log</div>
                        <ul>
                            {attempts.map((a, i) => (
                                <li
                                    key={a.at}
                                    className={`assert-log-row${a.ok ? ' ok' : ' fail'}`}
                                >
                                    <span className="assert-log-idx">
                                        #{i + 1}
                                    </span>
                                    <code className="assert-log-code">
                                        {a.code}
                                    </code>
                                    <span className="assert-log-state">
                                        {a.ok
                                            ? 'assert passed'
                                            : 'assert failed → moveOnFailure'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </div>

        </DemoPageShell>
    );
}
