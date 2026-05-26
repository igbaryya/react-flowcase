import { useMemo, useState, type ReactNode } from 'react';
import { CodeBlock } from '../common/CodeBlock';
import { HeroFlowPreview } from './HeroFlowPreview';
import './home-page.css';

export interface HomePageProps {
    onNavigate: (pageId: string) => void;
}

type PackageManager = 'npm' | 'pnpm' | 'yarn';

type DemoCategory =
    | 'all'
    | 'core'
    | 'interactions'
    | 'selectors'
    | 'fallbacks'
    | 'tools';

const INSTALL_COMMANDS: Record<PackageManager, string> = {
    npm: 'npm install react-flowcase',
    pnpm: 'pnpm add react-flowcase',
    yarn: 'yarn add react-flowcase',
};

const QUICKSTART_CODE = `import {
    VirtualCursor,
    useVirtualCursor,
    useAwaitableClick,
    useCursorFlow,
    type FlowStep,
} from 'react-flowcase';

export function LoginAutomation() {
    const cursor = useVirtualCursor();
    const { run, cancel, running } = useCursorFlow(cursor);

    const handleSubmit = useAwaitableClick(async () => {
        await fakeSignIn();
        return { ok: true };
    });

    const flow: FlowStep[] = [
        { type: 'input', element: '#email',    value: 'ada@example.com' },
        { type: 'input', element: '#password', value: 'correct-horse' },
        { type: 'click', element: '#submit' },
    ];

    return (
        <>
            <form>
                <input id="email" />
                <input id="password" type="password" />
                <button id="submit" type="button" onClick={handleSubmit}>
                    Sign in
                </button>
            </form>

            <button onClick={running ? cancel : () => run(flow)}>
                {running ? 'Stop' : 'Play automation'}
            </button>

            <VirtualCursor
                position={cursor.position}
                visible={cursor.visible}
            />
        </>
    );
}`;

interface Pillar {
    title: string;
    description: string;
    icon: ReactNode;
    demoId: string;
    demoLabel: string;
}

const CursorIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M5 3l13 9-6 1.5L9 21 5 3z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
        />
    </svg>
);

const FlowIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="5" cy="6" r="2.2" fill="currentColor" />
        <circle cx="5" cy="18" r="2.2" fill="currentColor" />
        <circle cx="19" cy="12" r="2.2" fill="currentColor" />
        <path
            d="M7 6h6l4 5.5L13 18H7"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const PromiseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M4 12a8 8 0 1 0 4-6.9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
        <path
            d="M8 4v3H5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const UiIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.6"
        />
        <path d="M3 9h18" stroke="currentColor" strokeWidth="1.4" />
        <path
            d="M7 14h6M7 17h10"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
        />
    </svg>
);

const PILLARS: Pillar[] = [
    {
        title: 'Drive a real cursor',
        description:
            'Tween motion to selectors, refs, or coordinates. Show on flow start, hide on end, swap appearance from config.',
        icon: <CursorIcon />,
        demoId: 'list',
        demoLabel: 'Lists & custom cursor',
    },
    {
        title: 'Await what you click',
        description:
            'useAwaitableClick surfaces handler results to the runner. waitFor polls until UI is ready — no arbitrary sleeps.',
        icon: <PromiseIcon />,
        demoId: 'async',
        demoLabel: 'Async / waitFor',
    },
    {
        title: 'Flows as plain data',
        description:
            'Compose FlowStep[] declaratively. Edit in FlowConfigViewer, record in dev mode, resume across page navigations.',
        icon: <FlowIcon />,
        demoId: 'login',
        demoLabel: 'Stateful · survives refresh',
    },
];

interface DemoCard {
    id: string;
    step: string;
    title: string;
    description: string;
    badge: string;
    category: Exclude<DemoCategory, 'all'>;
}

const DEMO_CATALOG: DemoCard[] = [
    {
        id: 'form',
        step: '01',
        title: 'Integration basics',
        description:
            'Wire a flow to a real form: id selectors, awaitable submit, chained values between steps.',
        badge: 'selectors · awaitable · chaining',
        category: 'core',
    },
    {
        id: 'async',
        step: '02',
        title: 'Async UIs with waitFor',
        description:
            'Lazy-rendered form, then waitFor inputs and an enabled Save button — no fixed delays.',
        badge: 'waitFor · polling · timeouts',
        category: 'core',
    },
    {
        id: 'list',
        step: '03',
        title: 'Lists & custom cursor',
        description:
            'Multi-match index picking and a themed cursor via SVG data URL — editable live.',
        badge: 'multi-match · appearance',
        category: 'core',
    },
    {
        id: 'login',
        step: '04',
        title: 'Stateful flows that survive refresh',
        description:
            'Sign-in crosses navigation, hydrates on dashboard, resumes after manual reload.',
        badge: 'sessionStorage · auto-resume',
        category: 'core',
    },
    {
        id: 'hover',
        step: 'I1',
        title: 'Hover menus & tooltips',
        description:
            'Mouse-arrival without click — :hover and onMouseEnter fire. Linger as long as you need.',
        badge: 'hover · duration',
        category: 'interactions',
    },
    {
        id: 'keyboard',
        step: 'I2',
        title: 'Keyboard navigation',
        description:
            'Key sequences with modifiers and repeats. Command palettes, autocomplete, modal escape.',
        badge: 'keypress · modifiers · repeat',
        category: 'interactions',
    },
    {
        id: 'scroll',
        step: 'I3',
        title: 'Scroll & viewport',
        description:
            'Scroll containers or window, scrollIntoView, or autoScroll on every targeting step.',
        badge: 'scroll · autoScroll · settleMs',
        category: 'interactions',
    },
    {
        id: 'selector-id',
        step: 'S1',
        title: 'By id',
        description:
            'The canonical "#fooId" shorthand — stable, unique, zero ambiguity.',
        badge: '#someId',
        category: 'selectors',
    },
    {
        id: 'selector-name',
        step: 'S2',
        title: 'By name attribute',
        description:
            'Target [name="..."] for react-hook-form, Formik, and plain forms without adding ids.',
        badge: '[name="..."]',
        category: 'selectors',
    },
    {
        id: 'selector-attr',
        step: 'S3',
        title: 'By data / aria attribute',
        description:
            'data-testid and aria-label — decoupled from styling, survives refactors.',
        badge: '[data-testid] · [aria-label]',
        category: 'selectors',
    },
    {
        id: 'selector-ref',
        step: 'S4',
        title: 'By React ref',
        description:
            'Pass a RefObject — ElementTarget reads ref.current at run time. Portals and dialogs included.',
        badge: 'RefObject · runtime-only',
        category: 'selectors',
    },
    {
        id: 'resilience',
        step: 'F1',
        title: 'Timeouts, skips & cancel',
        description:
            'Slow handlers, missing elements, impatient users — structured failure.reason on each.',
        badge: 'wait: N · moveOnFailure · cancel',
        category: 'fallbacks',
    },
    {
        id: 'assertions',
        step: 'F2',
        title: 'Assertion failures',
        description:
            'Failed asserts surface onAssertFail and assertion-failed in the step indicator.',
        badge: 'assert · onAssertFail · retries',
        category: 'fallbacks',
    },
    {
        id: 'recorder',
        step: 'T1',
        title: 'Flow recorder',
        description:
            'Dev-mode panel: record interactions, inspect selectors, copy generated FlowStep[] code.',
        badge: 'record · inspect · bestSelector',
        category: 'tools',
    },
];

const CATEGORY_FILTERS: { id: DemoCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'core', label: 'Core' },
    { id: 'interactions', label: 'Interactions' },
    { id: 'selectors', label: 'Selectors' },
    { id: 'fallbacks', label: 'Errors' },
    { id: 'tools', label: 'Tools' },
];

const MORE_FEATURES = [
    'Cross-page persistence',
    'First-class cancellation',
    'Drop-in UI helpers',
    'Dev flow recorder',
];

function DemoCatalogCard({
    card,
    onOpen,
}: {
    card: DemoCard;
    onOpen: (id: string) => void;
}) {
    return (
        <button
            type="button"
            className={`home-catalog-card home-catalog-card--${card.category}`}
            onClick={() => onOpen(card.id)}
        >
            <div className="home-catalog-card-top">
                <span
                    className={`home-catalog-step home-catalog-step--${card.category}`}
                >
                    {card.step}
                </span>
                <span className="home-catalog-badge">{card.badge}</span>
            </div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <span className={`home-catalog-cta home-catalog-cta--${card.category}`}>
                Open demo
                <span aria-hidden className="home-catalog-arrow">
                    &rarr;
                </span>
            </span>
        </button>
    );
}

export function HomePage({ onNavigate }: HomePageProps) {
    const [pm, setPm] = useState<PackageManager>('npm');
    const [category, setCategory] = useState<DemoCategory>('all');

    const filteredDemos = useMemo(
        () =>
            category === 'all'
                ? DEMO_CATALOG
                : DEMO_CATALOG.filter((d) => d.category === category),
        [category],
    );

    const categoryCounts = useMemo(() => {
        const counts: Record<DemoCategory, number> = {
            all: DEMO_CATALOG.length,
            core: 0,
            interactions: 0,
            selectors: 0,
            fallbacks: 0,
            tools: 0,
        };
        for (const d of DEMO_CATALOG) {
            counts[d.category] += 1;
        }
        return counts;
    }, []);

    return (
        <div className="home-shell">
            <div className="home-page">
            <header className="home-hero">
                <div className="home-hero-copy">
                    <div className="home-hero-brand">
                        <span className="home-hero-logo" aria-hidden>
                            <CursorIcon />
                        </span>
                        <div className="home-hero-brand-text">
                            <span className="home-hero-name">React Flowcase</span>
                            <span className="home-hero-version">pre-1.0</span>
                        </div>
                    </div>

                    <h1 className="home-hero-title">
                        Visual flows that{' '}
                        <span className="home-hero-accent">wait for your app</span>
                    </h1>

                    <p className="home-hero-sub">
                        A React library for automated walkthroughs: drive a virtual
                        cursor, await real click handlers, run declarative{' '}
                        <code>FlowStep[]</code> — with recorder, editor, and
                        cross-page resume built in.
                    </p>

                    <div className="home-hero-actions">
                        <button
                            type="button"
                            className="home-btn home-btn-primary"
                            onClick={() => onNavigate('form')}
                        >
                            Start with demo 01
                        </button>
                        <a
                            className="home-btn home-btn-ghost"
                            href="https://www.npmjs.com/package/react-flowcase"
                            target="_blank"
                            rel="noreferrer"
                        >
                            npm package
                        </a>
                    </div>

                    <ul className="home-hero-stats">
                        <li>
                            <span className="home-hero-stat-value">18+19</span>
                            <span className="home-hero-stat-label">React</span>
                        </li>
                        <li>
                            <span className="home-hero-stat-value">0</span>
                            <span className="home-hero-stat-label">
                                runtime deps
                            </span>
                        </li>
                        <li>
                            <span className="home-hero-stat-value">TS</span>
                            <span className="home-hero-stat-label">first</span>
                        </li>
                        <li>
                            <span className="home-hero-stat-value">ESM</span>
                            <span className="home-hero-stat-label">+ CJS</span>
                        </li>
                    </ul>
                </div>

                <HeroFlowPreview />
            </header>

            <section
                className="home-pillars"
                aria-labelledby="home-pillars-title"
            >
                <div className="home-section-intro">
                    <h2 id="home-pillars-title">Three ideas, one library</h2>
                    <p>
                        Pick the layer you need — cursor motion, awaitable
                        handlers, or the full flow runner — and compose up.
                    </p>
                </div>
                <div className="home-pillar-grid">
                    {PILLARS.map((pillar) => (
                        <article key={pillar.title} className="home-pillar-card">
                            <div className="home-pillar-icon">{pillar.icon}</div>
                            <h3>{pillar.title}</h3>
                            <p>{pillar.description}</p>
                            <button
                                type="button"
                                className="home-pillar-link"
                                onClick={() => onNavigate(pillar.demoId)}
                            >
                                {pillar.demoLabel}
                                <span aria-hidden>&rarr;</span>
                            </button>
                        </article>
                    ))}
                </div>
                <ul className="home-feature-tags" aria-label="Also included">
                    {MORE_FEATURES.map((label) => (
                        <li key={label}>{label}</li>
                    ))}
                </ul>
            </section>

            <section
                className="home-start"
                aria-labelledby="home-start-title"
            >
                <div className="home-section-intro">
                    <h2 id="home-start-title">Get started in minutes</h2>
                    <p>
                        Install, wire three hooks, pass a flow array — the runner
                        handles motion, typing, and waiting.
                    </p>
                </div>
                <div className="home-start-grid">
                    <div className="home-start-install">
                        <h3 className="home-start-panel-title">Install</h3>
                        <div className="home-tabs" role="tablist">
                            {(
                                Object.keys(
                                    INSTALL_COMMANDS,
                                ) as PackageManager[]
                            ).map((id) => (
                                <button
                                    key={id}
                                    role="tab"
                                    type="button"
                                    aria-selected={pm === id}
                                    className={`home-tab${
                                        pm === id ? ' active' : ''
                                    }`}
                                    onClick={() => setPm(id)}
                                >
                                    {id}
                                </button>
                            ))}
                        </div>
                        <CodeBlock
                            code={INSTALL_COMMANDS[pm]}
                            language="bash"
                        />
                        <p className="home-start-note">
                            Peer deps: <code>react ^18 || ^19</code>,{' '}
                            <code>react-dom ^18 || ^19</code>
                        </p>
                    </div>
                    <div className="home-start-code">
                        <h3 className="home-start-panel-title">Quick start</h3>
                        <div className="home-code-shell">
                            <CodeBlock code={QUICKSTART_CODE} language="tsx" />
                        </div>
                        <ol className="home-hook-list">
                            <li>
                                <code>useVirtualCursor</code> — position &
                                visibility
                            </li>
                            <li>
                                <code>useAwaitableClick</code> — await handler
                                results
                            </li>
                            <li>
                                <code>useCursorFlow</code> —{' '}
                                <code>run / cancel / running</code>
                            </li>
                        </ol>
                    </div>
                </div>
            </section>

            <section
                className="home-catalog"
                aria-labelledby="home-catalog-title"
            >
                <div className="home-catalog-header">
                    <div className="home-section-intro">
                        <h2 id="home-catalog-title">Interactive demo catalog</h2>
                        <p>
                            Each demo ships a live flow, config editor, source
                            tree, and generated code preview — copy a working
                            starting point.
                        </p>
                    </div>
                    <div
                        className="home-catalog-filters"
                        role="tablist"
                        aria-label="Filter demos by topic"
                    >
                        {CATEGORY_FILTERS.map(({ id, label }) => (
                            <button
                                key={id}
                                type="button"
                                role="tab"
                                aria-selected={category === id}
                                className={`home-catalog-filter${
                                    category === id ? ' is-active' : ''
                                } home-catalog-filter--${id}`}
                                onClick={() => setCategory(id)}
                            >
                                {label}
                                <span className="home-catalog-filter-count">
                                    {categoryCounts[id]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="home-catalog-grid">
                    {filteredDemos.map((card) => (
                        <DemoCatalogCard
                            key={card.id}
                            card={card}
                            onOpen={onNavigate}
                        />
                    ))}
                </div>

                {filteredDemos.length === 0 && (
                    <p className="home-catalog-empty">No demos in this category.</p>
                )}
            </section>

            <section className="home-cta-band" aria-labelledby="home-cta-title">
                <div className="home-cta-band-inner">
                    <div className="home-cta-band-icon">
                        <UiIcon />
                    </div>
                    <div className="home-cta-band-copy">
                        <h2 id="home-cta-title">Record flows in dev mode</h2>
                        <p>
                            Drop in <code>&lt;FlowRecorder /&gt;</code>, click
                            through your app, copy the generated{' '}
                            <code>FlowStep[]</code> — no hand-written selectors
                            from DevTools.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="home-btn home-btn-primary"
                        onClick={() => onNavigate('recorder')}
                    >
                        Open recorder demo
                    </button>
                </div>
            </section>

            <footer className="home-footer">
                <div>
                    <strong>React Flowcase</strong>
                    <span className="home-footer-sep" aria-hidden>
                        &middot;
                    </span>
                    MIT
                </div>
                <div className="home-footer-links">
                    <a
                        href="https://www.npmjs.com/package/react-flowcase"
                        target="_blank"
                        rel="noreferrer"
                    >
                        npm
                    </a>
                    <span aria-hidden>&middot;</span>
                    <button
                        type="button"
                        className="home-footer-link"
                        onClick={() => onNavigate('form')}
                    >
                        Demo 01 — Integration basics
                    </button>
                </div>
            </footer>
            </div>
        </div>
    );
}
