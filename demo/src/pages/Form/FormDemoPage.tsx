import { useState } from 'react';
import { useAwaitableClick } from 'react-flowcase';
import { ConceptCallout } from '../common/ConceptCallout';
import { DemoPageShell } from '../common/DemoPageShell';
import { OutcomePanel } from '../common/OutcomePanel';
import { useDemoFlow } from '../common/useDemoFlow';
import { registrationFlow, registrationFlowOptions } from './automationFlow';
interface RegistrationData {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    country: string;
}

interface SubmitResult {
    ok: boolean;
    data: RegistrationData;
    receivedAt: number;
}

const COUNTRIES: Array<{ value: string; label: string }> = [
    { value: '', label: 'Select a country...' },
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'JP', label: 'Japan' },
];

const FORM_ID = 'registration-form';
const SUBMIT_ID = 'reg-submit';

function readForm(): RegistrationData {
    const form = document.getElementById(FORM_ID) as HTMLFormElement | null;
    const fd = new FormData(form ?? undefined);
    return {
        fullName: String(fd.get('fullName') ?? ''),
        email: String(fd.get('email') ?? ''),
        password: String(fd.get('password') ?? ''),
        confirmPassword: String(fd.get('confirmPassword') ?? ''),
        country: String(fd.get('country') ?? ''),
    };
}

export function FormDemoPage() {
    const [submitted, setSubmitted] = useState<SubmitResult | null>(null);

    const flowState = useDemoFlow({
        initialFlow: registrationFlow,
        initialRunOptions: registrationFlowOptions,
        onBeforeStart: () => setSubmitted(null),
    });
    const { running, clearRunState } = flowState;

    const handleSubmit = async (): Promise<SubmitResult> => {
        await new Promise((r) => setTimeout(r, 400));
        const data = readForm();
        const result: SubmitResult = {
            ok:
                data.password === data.confirmPassword &&
                data.fullName !== '',
            data,
            receivedAt: Date.now(),
        };
        setSubmitted(result);
        return result;
    };

    const trackedSubmit = useAwaitableClick(handleSubmit);

    const resetForm = () => {
        const form = document.getElementById(FORM_ID) as HTMLFormElement | null;
        form?.reset();
        setSubmitted(null);
        clearRunState();
    };

    return (
        <DemoPageShell
            title="Form integration basics"
            description={
                <>
                    Start here. This is the smallest, most idiomatic way to plug
                    the library into a real form: give your inputs an{' '}
                    <code>id</code>, list them in a flow, and wrap your submit
                    handler with <code>useAwaitableClick</code> so the runner
                    can await its resolved payload.
                </>
            }
            flowState={flowState}
            pageOutcome={
                submitted ? (
                    <OutcomePanel
                        ok={submitted.ok}
                        message={
                            submitted.ok
                                ? `Submitted at ${new Date(submitted.receivedAt).toLocaleTimeString()}`
                                : 'Submission rejected (passwords mismatch or empty name)'
                        }
                        data={submitted.data}
                    />
                ) : undefined
            }
            codePreview={{
                componentName: 'RegistrationFormAutomation',
                flowVariableName: 'registrationFlow',
                optionsVariableName: 'registrationFlowOptions',
                viewSource: `<button type="button" onClick={start}>
    Run automation
</button>

<label>
    Full name
    <input id="reg-fullName" />
</label>
<label>
    Email
    <input id="reg-email" type="email" />
</label>
<label>
    Password
    <input id="reg-password" type="password" />
</label>
<label>
    Confirm password
    <input id="reg-confirmPassword" type="password" />
</label>
<label>
    Country
    <select id="reg-country">
        <option value="">Select…</option>
        <option value="UK">United Kingdom</option>
        <option value="US">United States</option>
    </select>
</label>

<button id="reg-submit" type="button" onClick={handleSubmit}>
    Submit
</button>`,
            }}
        >
            <ConceptCallout
                headline="Connect a flow to a real form with three small APIs."
                points={[
                    {
                        api: 'element: "#id"',
                        description: (
                            <>
                                Every step targets a real DOM node via a CSS
                                selector — same as{' '}
                                <code>document.querySelector</code>. Refs and
                                raw <code>HTMLElement</code>s also work.
                            </>
                        ),
                    },
                    {
                        api: 'useAwaitableClick',
                        description: (
                            <>
                                Wrap your submit handler so the runner can{' '}
                                <em>await its resolved payload</em>. No
                                timers, no flake.
                            </>
                        ),
                    },
                    {
                        api: 'value: (prev) => ...',
                        description: (
                            <>
                                The confirm-password field reuses the previous
                                step&rsquo;s typed value — chained outcomes
                                between steps.
                            </>
                        ),
                    },
                    {
                        api: 'assert: (out) => boolean',
                        description: (
                            <>
                                The click step asserts on the submit
                                handler&rsquo;s payload — the run only
                                &ldquo;completes&rdquo; when business logic
                                agrees it did.
                            </>
                        ),
                    },
                ]}
            />

            <form
                id={FORM_ID}
                className="demo-card"
                onSubmit={(e) => e.preventDefault()}
            >
                <div className="demo-row">
                    <label htmlFor="reg-fullName">Full name</label>
                    <input
                        id="reg-fullName"
                        name="fullName"
                        type="text"
                        autoComplete="off"
                    />
                </div>
                <div className="demo-row">
                    <label htmlFor="reg-email">Email</label>
                    <input
                        id="reg-email"
                        name="email"
                        type="email"
                        autoComplete="off"
                    />
                </div>
                <div className="demo-row">
                    <label htmlFor="reg-password">Password</label>
                    <input
                        id="reg-password"
                        name="password"
                        type="password"
                        autoComplete="off"
                    />
                </div>
                <div className="demo-row">
                    <label htmlFor="reg-confirmPassword">
                        Confirm password
                    </label>
                    <input
                        id="reg-confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="off"
                    />
                </div>
                <div className="demo-row">
                    <label htmlFor="reg-country">Country</label>
                    <select id="reg-country" name="country" defaultValue="">
                        {COUNTRIES.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="demo-actions">
                    <button
                        id={SUBMIT_ID}
                        type="button"
                        className="btn btn-primary"
                        onClick={trackedSubmit}
                    >
                        Register
                    </button>
                    <button
                        type="button"
                        className="btn"
                        onClick={resetForm}
                        disabled={running}
                    >
                        Reset
                    </button>
                </div>
            </form>

        </DemoPageShell>
    );
}
