import { useState } from 'react';
import { useAwaitableClick } from 'react-flowcase';
import { ConceptCallout } from '../common/ConceptCallout';
import { DemoPageShell } from '../common/DemoPageShell';
import { OutcomePanel } from '../common/OutcomePanel';
import { useDemoFlow } from '../common/useDemoFlow';
import {
    selectorByAttrFlow,
    selectorByAttrFlowOptions,
} from './automationFlow';
interface SearchResult {
    ok: boolean;
    query: string;
    theme: 'light' | 'dark';
    hits: number;
}

export function SelectorByAttrDemoPage() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<SearchResult | null>(null);

    const flowState = useDemoFlow({
        initialFlow: selectorByAttrFlow,
        initialRunOptions: selectorByAttrFlowOptions,
        onBeforeStart: () => {
            setTheme('light');
            setQuery('');
            setResult(null);
        },
    });

    const search = useAwaitableClick(async (): Promise<SearchResult> => {
        await new Promise((r) => setTimeout(r, 250));
        const next: SearchResult = {
            ok: query.trim().length >= 3,
            query: query.trim(),
            theme,
            hits: query.trim().length * 3,
        };
        setResult(next);
        return next;
    });

    return (
        <DemoPageShell
            title="Targeting by attribute"
            description={
                <>
                    When neither <code>id</code> nor <code>name</code> is
                    available — or you want a selector that&rsquo;s
                    deliberately decoupled from styling — fall back to
                    attribute selectors. <code>data-testid</code> is the
                    automation-friendly convention;{' '}
                    <code>aria-label</code> doubles as accessibility + a
                    stable selector for icon-only buttons.
                </>
            }
            flowState={flowState}
            pageOutcome={
                result ? (
                    <OutcomePanel
                        ok={result.ok}
                        message={
                            result.ok
                                ? `${result.hits} results for "${result.query}" (${result.theme} theme)`
                                : 'Query too short — needs 3+ characters'
                        }
                        data={result}
                    />
                ) : undefined
            }
            codePreview={{
                componentName: 'SelectorByAttrAutomation',
                flowVariableName: 'selectorByAttrFlow',
                optionsVariableName: 'selectorByAttrFlowOptions',
                viewSource: `<button type="button" onClick={start}>
    Run automation
</button>

<button
    data-testid="theme-toggle"
    aria-label="Toggle theme"
    onClick={toggleTheme}
>
    {theme} mode
</button>

<input data-testid="search-input" placeholder="Search" />

<button aria-label="Run search" onClick={runSearch}>
    Search
</button>`,
            }}
        >
            <ConceptCallout
                headline="Pick the attribute that's most stable for your app."
                points={[
                    {
                        api: "element: '[data-testid=\"search-input\"]'",
                        description: (
                            <>
                                Attributes prefixed with <code>data-</code>{' '}
                                are reserved for app-specific metadata. They
                                survive CSS refactors and stay close to the
                                component, not the markup tree.
                            </>
                        ),
                    },
                    {
                        api: "element: '[aria-label=\"Run search\"]'",
                        description: (
                            <>
                                Icon-only buttons usually need an{' '}
                                <code>aria-label</code> anyway — re-use it as
                                the selector and you get automation + screen
                                readers from a single attribute.
                            </>
                        ),
                    },
                    {
                        api: 'compose with CSS combinators',
                        description: (
                            <>
                                Attribute selectors are full CSS — pair them
                                with tag prefixes (
                                <code>button[data-testid=&quot;...&quot;]</code>
                                ) or descendant combinators when one attribute
                                isn&rsquo;t unique on its own.
                            </>
                        ),
                    },
                ]}
            />

            <div className="demo-card">
                <div className="demo-row">
                    <label>Theme</label>
                    <div className="demo-actions">
                        <button
                            type="button"
                            className="btn"
                            data-testid="theme-toggle"
                            aria-label="Toggle theme"
                            onClick={() =>
                                setTheme((t) =>
                                    t === 'light' ? 'dark' : 'light',
                                )
                            }
                        >
                            {theme === 'light' ? 'Light' : 'Dark'} mode
                        </button>
                    </div>
                </div>
                <div className="demo-row">
                    <label htmlFor="sattr-search">Search</label>
                    <input
                        id="sattr-search"
                        data-testid="search-input"
                        value={query}
                        placeholder="Try 'cursor automation'"
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <div className="demo-actions">
                    <button
                        type="button"
                        className="btn btn-primary"
                        aria-label="Run search"
                        onClick={search}
                    >
                        Search
                    </button>
                </div>
            </div>

        </DemoPageShell>
    );
}
