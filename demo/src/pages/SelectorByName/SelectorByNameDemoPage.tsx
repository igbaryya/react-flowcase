import { useState, type FormEvent } from 'react';
import { useAwaitableClick } from 'react-flowcase';
import { ConceptCallout } from '../common/ConceptCallout';
import { DemoPageShell } from '../common/DemoPageShell';
import { OutcomePanel } from '../common/OutcomePanel';
import { useDemoFlow } from '../common/useDemoFlow';
import {
    selectorByNameFlow,
    selectorByNameFlowOptions,
} from './automationFlow';
interface SignInOutcome {
    ok: boolean;
    username: string;
}

export function SelectorByNameDemoPage() {
    const [outcome, setOutcome] = useState<SignInOutcome | null>(null);

    const flowState = useDemoFlow({
        initialFlow: selectorByNameFlow,
        initialRunOptions: selectorByNameFlowOptions,
        onBeforeStart: () => setOutcome(null),
    });

    const trackedSignIn = useAwaitableClick(
        async (event: React.MouseEvent<Element>): Promise<SignInOutcome> => {
            const target = event.currentTarget as HTMLButtonElement;
            const form = target.form;
            const data = form ? new FormData(form) : new FormData();
            const username = (data.get('username') ?? '').toString();
            const password = (data.get('password') ?? '').toString();
            await new Promise((r) => setTimeout(r, 200));
            const result: SignInOutcome = {
                ok: username.length > 0 && password.length >= 4,
                username,
            };
            setOutcome(result);
            return result;
        },
    );

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    };

    return (
        <DemoPageShell
            title="Targeting by name attribute"
            description={
                <>
                    Form libraries like <code>react-hook-form</code> and
                    Formik bind inputs via the <code>name</code> attribute,
                    not <code>id</code>. The library&rsquo;s ElementTarget
                    accepts any CSS selector — including attribute selectors
                    — so <code>input[name=&quot;email&quot;]</code> works the
                    same as <code>#email</code>.
                </>
            }
            flowState={flowState}
            pageOutcome={
                outcome ? (
                    <OutcomePanel
                        ok={outcome.ok}
                        message={
                            outcome.ok
                                ? `Signed in as ${outcome.username}`
                                : 'Sign-in failed — check the credentials'
                        }
                        data={outcome}
                    />
                ) : undefined
            }
            codePreview={{
                componentName: 'SelectorByNameAutomation',
                flowVariableName: 'selectorByNameFlow',
                optionsVariableName: 'selectorByNameFlowOptions',
                viewSource: `<button type="button" onClick={start}>
    Run automation
</button>

<form onSubmit={handleSubmit}>
    <input name="username" autoComplete="username" />
    <input name="password" type="password" />
    <button name="signin" type="submit" onClick={signIn}>
        Sign in
    </button>
</form>`,
            }}
        >
            <ConceptCallout
                headline="Use an attribute selector when ids are missing."
                points={[
                    {
                        api: "element: 'input[name=\"username\"]'",
                        description: (
                            <>
                                Standard CSS attribute syntax — exactly what
                                you&rsquo;d type into{' '}
                                <code>querySelector</code>. The tag prefix
                                (&nbsp;<code>input</code>&nbsp;) helps when
                                the same <code>name</code> exists on multiple
                                element kinds (e.g. a hidden{' '}
                                <code>&lt;input&gt;</code> and a label).
                            </>
                        ),
                    },
                    {
                        api: 'works for any form control',
                        description: (
                            <>
                                Inputs, textareas, selects, and buttons all
                                respect the <code>name</code> attribute. The
                                same selector style targets them
                                interchangeably.
                            </>
                        ),
                    },
                    {
                        api: 'no DOM changes required',
                        description: (
                            <>
                                You don&rsquo;t have to add ids just to wire
                                up automation. If the form already names its
                                fields for submission, you&rsquo;re done.
                            </>
                        ),
                    },
                ]}
            />

            <div className="demo-card">
                <form onSubmit={handleSubmit} noValidate>
                    <div className="demo-row">
                        <label htmlFor="sname-username">Username</label>
                        <input
                            id="sname-username"
                            name="username"
                            autoComplete="username"
                        />
                    </div>
                    <div className="demo-row">
                        <label htmlFor="sname-password">Password</label>
                        <input
                            id="sname-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                        />
                    </div>
                    <div className="demo-actions">
                        <button
                            type="submit"
                            name="signin"
                            className="btn btn-primary"
                            onClick={trackedSignIn}
                        >
                            Sign in
                        </button>
                    </div>
                </form>
            </div>

        </DemoPageShell>
    );
}
