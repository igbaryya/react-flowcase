import { useState } from 'react';
import { useAwaitableClick } from 'react-flowcase';
import { ConceptCallout } from '../common/ConceptCallout';
import { DemoPageShell } from '../common/DemoPageShell';
import { OutcomePanel } from '../common/OutcomePanel';
import { useDemoFlow } from '../common/useDemoFlow';
import { loginFlow, loginFlowOptions, loginPersistence } from './automationFlow';
import {
    loginAutomationHref,
    navigateToLoginDashboard,
    saveLoginSession,
} from './loginRoute';

interface LoginData {
    email: string;
    password: string;
}

interface LoginResult {
    ok: boolean;
    data: LoginData;
    receivedAt: number;
}

const FORM_ID = 'login-form';
const SUBMIT_ID = 'login-submit';

function readForm(): LoginData {
    const form = document.getElementById(FORM_ID) as HTMLFormElement | null;
    const fd = new FormData(form ?? undefined);
    return {
        email: String(fd.get('email') ?? ''),
        password: String(fd.get('password') ?? ''),
    };
}

export function LoginFormDemo() {
    const [loggedIn, setLoggedIn] = useState<LoginResult | null>(null);

    const flowState = useDemoFlow({
        initialFlow: loginFlow,
        initialRunOptions: loginFlowOptions,
        onBeforeStart: () => setLoggedIn(null),
        persistence: loginPersistence,
    });
    const { running, clearRunState } = flowState;

    const handleSignIn = async (): Promise<LoginResult> => {
        await new Promise((r) => setTimeout(r, 350));
        const data = readForm();
        const result: LoginResult = {
            ok: data.email.includes('@') && data.password.length >= 6,
            data,
            receivedAt: Date.now(),
        };

        if (result.ok) {
            saveLoginSession(data.email);
            navigateToLoginDashboard();
            return result;
        }

        setLoggedIn(result);
        return result;
    };

    const trackedSubmit = useAwaitableClick(handleSignIn);

    const resetForm = () => {
        const form = document.getElementById(FORM_ID) as HTMLFormElement | null;
        form?.reset();
        setLoggedIn(null);
        clearRunState();
    };

    return (
        <DemoPageShell
            title="Stateful flows that survive refresh"
            description={
                <>
                    A flow that crosses a real page boundary. The Sign in click
                    triggers a full <code>window.location.assign</code> to{' '}
                    <code>{loginAutomationHref('dashboard')}</code>, the new
                    page mounts, and the same flow auto-resumes from where it
                    left off — including after a manual refresh.
                </>
            }
            flowState={flowState}
            pageOutcome={
                loggedIn ? (
                    <OutcomePanel
                        ok={loggedIn.ok}
                        message={
                            loggedIn.ok
                                ? `Signed in at ${new Date(loggedIn.receivedAt).toLocaleTimeString()}`
                                : 'Sign-in rejected (invalid email or password too short)'
                        }
                        data={loggedIn.data}
                    />
                ) : undefined
            }
            codePreview={{
                componentName: 'LoginFormAutomation',
                flowVariableName: 'loginFlow',
                optionsVariableName: 'loginFlowOptions',
                viewSource: `<button type="button" onClick={start}>
    Run automation
</button>

{/* Login page: */}
<form onSubmit={handleLogin}>
    <input id="login-email" type="email" />
    <input id="login-password" type="password" />
    <button id="login-submit" type="submit">
        Sign in
    </button>
</form>

{/* Rendered on /dashboard after the redirect.
    The flow auto-resumes here via sessionStorage. */}
{/* <button id="signout-btn" onClick={signOut}>Sign out</button> */}`,
            }}
        >
            <ConceptCallout
                headline="One flow, many pages. Persistence keeps it running across navigations."
                points={[
                    {
                        api: 'createSessionStoragePersistence',
                        description: (
                            <>
                                Stores the running flow + cursor position in{' '}
                                <code>sessionStorage</code> before every step
                                so it survives full-page reloads.
                            </>
                        ),
                    },
                    {
                        api: 'useCursorFlow({ persistence, flow })',
                        description: (
                            <>
                                On every page in the journey, mount the hook
                                with the same flow. It detects pending state
                                and resumes from the next un-run step.
                            </>
                        ),
                    },
                    {
                        api: 'pendingState',
                        description: (
                            <>
                                Non-null while resuming — perfect for showing a
                                &ldquo;Resuming automation&hellip;&rdquo; badge
                                or skipping intro animations.
                            </>
                        ),
                    },
                    {
                        api: 'Try it',
                        description: (
                            <>
                                Hit Play, watch it land on the dashboard, then
                                refresh the dashboard tab. The cursor reappears
                                and finishes the run.
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
                    <label htmlFor="login-email">Email</label>
                    <input
                        id="login-email"
                        name="email"
                        type="email"
                        autoComplete="off"
                    />
                </div>
                <div className="demo-row">
                    <label htmlFor="login-password">Password</label>
                    <input
                        id="login-password"
                        name="password"
                        type="password"
                        autoComplete="off"
                    />
                </div>
                <div className="demo-actions">
                    <button
                        id={SUBMIT_ID}
                        type="button"
                        className="btn btn-primary"
                        onClick={trackedSubmit}
                    >
                        Sign in
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
