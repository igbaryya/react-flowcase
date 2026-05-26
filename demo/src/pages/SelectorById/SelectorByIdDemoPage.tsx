import { useState } from 'react';
import { useAwaitableClick } from 'react-flowcase';
import { ConceptCallout } from '../common/ConceptCallout';
import { DemoPageShell } from '../common/DemoPageShell';
import { OutcomePanel } from '../common/OutcomePanel';
import { useDemoFlow } from '../common/useDemoFlow';
import { selectorByIdFlow, selectorByIdFlowOptions } from './automationFlow';
interface SaveOutcome {
    ok: boolean;
    email: string;
    name: string;
}

export function SelectorByIdDemoPage() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [outcome, setOutcome] = useState<SaveOutcome | null>(null);

    const flowState = useDemoFlow({
        initialFlow: selectorByIdFlow,
        initialRunOptions: selectorByIdFlowOptions,
        onBeforeStart: () => {
            setEmail('');
            setName('');
            setOutcome(null);
        },
    });

    const save = useAwaitableClick(async (): Promise<SaveOutcome> => {
        await new Promise((r) => setTimeout(r, 200));
        const result: SaveOutcome = {
            ok: email.includes('@') && name.length > 0,
            email,
            name,
        };
        setOutcome(result);
        return result;
    });

    return (
        <DemoPageShell
            title="Targeting by id"
            description={
                <>
                    The simplest targeting mode — pass{' '}
                    <code>&quot;#someId&quot;</code> as the step&rsquo;s{' '}
                    <code>element</code>. One id, one element, zero ambiguity.
                    The flow re-uses the same selector grammar your browser
                    DevTools accept.
                </>
            }
            flowState={flowState}
            pageOutcome={
                outcome ? (
                    <OutcomePanel
                        ok={outcome.ok}
                        message={
                            outcome.ok
                                ? 'Profile saved'
                                : 'Validation failed — check email + name'
                        }
                        data={outcome}
                    />
                ) : undefined
            }
            codePreview={{
                componentName: 'SelectorByIdAutomation',
                flowVariableName: 'selectorByIdFlow',
                optionsVariableName: 'selectorByIdFlowOptions',
                viewSource: `<button type="button" onClick={start}>
    Run automation
</button>

<input id="sid-email" type="email" />
<input id="sid-name" />
<button id="sid-save" type="button" onClick={save}>
    Save profile
</button>`,
            }}
        >
            <ConceptCallout
                headline="Pass a CSS id selector as the element."
                points={[
                    {
                        api: "element: '#fullName'",
                        description: (
                            <>
                                Equivalent to{' '}
                                <code>
                                    document.querySelector(&apos;#fullName&apos;)
                                </code>
                                . Best when your form already assigns stable,
                                unique ids — labelling, accessibility, and
                                automation all benefit.
                            </>
                        ),
                    },
                    {
                        api: 'no index needed',
                        description: (
                            <>
                                Ids are unique per document. The library skips
                                the multi-match handling that other selector
                                strategies (class, attribute) often need.
                            </>
                        ),
                    },
                    {
                        api: 'serializes cleanly',
                        description: (
                            <>
                                String selectors round-trip through the flow
                                editor and the &ldquo;Generated from
                                flow&rdquo; file — what you see in the gear
                                icon is exactly what you get in code.
                            </>
                        ),
                    },
                ]}
            />

            <div className="demo-card">
                <div className="demo-row">
                    <label htmlFor="sid-email">Email</label>
                    <input
                        id="sid-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="demo-row">
                    <label htmlFor="sid-name">Display name</label>
                    <input
                        id="sid-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div className="demo-actions">
                    <button
                        id="sid-save"
                        type="button"
                        className="btn btn-primary"
                        onClick={save}
                    >
                        Save profile
                    </button>
                </div>
            </div>

        </DemoPageShell>
    );
}
