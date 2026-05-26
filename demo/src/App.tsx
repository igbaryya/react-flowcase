import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ComponentType,
    type ReactNode,
} from 'react';
import { AssertionsDemoPage } from './pages/Assertions/AssertionsDemoPage';
import { AsyncDemoPage } from './pages/Async/AsyncDemoPage';
import { CustomCursorDemoPage } from './pages/CustomCursor/CustomCursorDemoPage';
import { FormDemoPage } from './pages/Form/FormDemoPage';
import { HomePage } from './pages/Home/HomePage';
import { HoverDemoPage } from './pages/Hover/HoverDemoPage';
import { KeyboardDemoPage } from './pages/Keyboard/KeyboardDemoPage';
import { ListDemoPage } from './pages/List/ListDemoPage';
import { LoginDemoPage } from './pages/Login/LoginDemoPage';
import { isLoginAutomationPath } from './pages/Login/loginRoute';
import { RecorderDemoPage } from './pages/Recorder/RecorderDemoPage';
import { ResilienceDemoPage } from './pages/Resilience/ResilienceDemoPage';
import { ScrollDemoPage } from './pages/Scroll/ScrollDemoPage';
import { SelectorByAttrDemoPage } from './pages/SelectorByAttr/SelectorByAttrDemoPage';
import { SelectorByIdDemoPage } from './pages/SelectorById/SelectorByIdDemoPage';
import { SelectorByNameDemoPage } from './pages/SelectorByName/SelectorByNameDemoPage';
import { SelectorByRefDemoPage } from './pages/SelectorByRef/SelectorByRefDemoPage';
import './App.css';

type SidebarSection =
    | 'home'
    | 'demos'
    | 'interactions'
    | 'selectors'
    | 'fallbacks'
    | 'tools';

interface DemoPage {
    id: string;
    label: string;
    section: SidebarSection;
    /** Optional ordinal shown as a small pill before the label. */
    number?: number;
    Component: ComponentType<{ onNavigate: (id: string) => void }>;
}

const PAGES: DemoPage[] = [
    {
        id: 'home',
        label: 'Introduction',
        section: 'home',
        Component: HomePage,
    },
    {
        id: 'form',
        label: 'Integration basics',
        section: 'demos',
        number: 1,
        Component: FormDemoPage,
    },
    {
        id: 'async',
        label: 'Async / waitFor',
        section: 'demos',
        number: 2,
        Component: AsyncDemoPage,
    },
    {
        id: 'list',
        label: 'Lists & multi-match',
        section: 'demos',
        number: 3,
        Component: ListDemoPage,
    },
    {
        id: 'custom-cursor',
        label: 'Custom cursors',
        section: 'demos',
        number: 4,
        Component: CustomCursorDemoPage,
    },
    {
        id: 'login',
        label: 'Stateful · survives refresh',
        section: 'demos',
        number: 5,
        Component: LoginDemoPage,
    },
    {
        id: 'hover',
        label: 'Hover menus & tooltips',
        section: 'interactions',
        Component: HoverDemoPage,
    },
    {
        id: 'keyboard',
        label: 'Keyboard navigation',
        section: 'interactions',
        Component: KeyboardDemoPage,
    },
    {
        id: 'scroll',
        label: 'Scroll & viewport',
        section: 'interactions',
        Component: ScrollDemoPage,
    },
    {
        id: 'selector-id',
        label: 'By id',
        section: 'selectors',
        Component: SelectorByIdDemoPage,
    },
    {
        id: 'selector-name',
        label: 'By name attribute',
        section: 'selectors',
        Component: SelectorByNameDemoPage,
    },
    {
        id: 'selector-attr',
        label: 'By data / aria attribute',
        section: 'selectors',
        Component: SelectorByAttrDemoPage,
    },
    {
        id: 'selector-ref',
        label: 'By React ref',
        section: 'selectors',
        Component: SelectorByRefDemoPage,
    },
    {
        id: 'resilience',
        label: 'Timeouts, skips & cancel',
        section: 'fallbacks',
        Component: ResilienceDemoPage,
    },
    {
        id: 'assertions',
        label: 'Assertion failures',
        section: 'fallbacks',
        Component: AssertionsDemoPage,
    },
    {
        id: 'recorder',
        label: 'Flow recorder',
        section: 'tools',
        Component: RecorderDemoPage,
    },
];

interface SectionMeta {
    id: SidebarSection;
    label: string;
    icon: ReactNode;
}

const HomeIcon = (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M4 11.5L12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8.5z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
        />
    </svg>
);

const PlayIcon = (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M8 5.5v13l11-6.5L8 5.5z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
        />
    </svg>
);

const PointerIcon = (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M5 3l13 9-6 1.5L9 21 5 3z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
        />
    </svg>
);

const TargetIcon = (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
);

const ShieldIcon = (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
        />
    </svg>
);

const ToolIcon = (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M14.5 3.5a4 4 0 0 0-5 5L4 14v3h3l5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2-2 2.5-2.5z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
        />
    </svg>
);

const ChevronIcon = (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const SECTIONS: SectionMeta[] = [
    { id: 'home', label: 'Overview', icon: HomeIcon },
    { id: 'demos', label: 'Core demos', icon: PlayIcon },
    { id: 'interactions', label: 'Interactions', icon: PointerIcon },
    { id: 'selectors', label: 'Selectors', icon: TargetIcon },
    { id: 'fallbacks', label: 'Fallbacks & errors', icon: ShieldIcon },
    { id: 'tools', label: 'Tools', icon: ToolIcon },
];

const DEMO_QUERY_KEY = 'demo';

function resolveActiveIdFromLocation(): string {
    if (isLoginAutomationPath()) return 'login';
    const demo = new URLSearchParams(window.location.search).get(
        DEMO_QUERY_KEY,
    );
    if (demo && PAGES.some((p) => p.id === demo)) return demo;
    return 'home';
}

const BASE = import.meta.env.BASE_URL;

function hrefForDemo(id: string): string {
    if (id === 'login') return `${BASE}loginAutomation`;
    if (id === 'home') return BASE;
    return `${BASE}?${DEMO_QUERY_KEY}=${id}`;
}

export default function App() {
    const contentRef = useRef<HTMLElement>(null);
    const [activeId, setActiveId] = useState(resolveActiveIdFromLocation);
    const [collapsed, setCollapsed] = useState<Record<SidebarSection, boolean>>(
        () => ({
            home: false,
            demos: false,
            interactions: false,
            selectors: false,
            fallbacks: false,
            tools: false,
        }),
    );
    const [mobileOpen, setMobileOpen] = useState(false);

    const scrollContentToTop = useCallback(() => {
        const el = contentRef.current;
        if (!el) return;
        el.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, []);

    useEffect(() => {
        const syncFromLocation = () =>
            setActiveId(resolveActiveIdFromLocation());
        window.addEventListener('popstate', syncFromLocation);
        return () => window.removeEventListener('popstate', syncFromLocation);
    }, []);

    useEffect(() => {
        // After the new page paints, reset the main scroll container (not window).
        const id = requestAnimationFrame(() => scrollContentToTop());
        return () => cancelAnimationFrame(id);
    }, [activeId, scrollContentToTop]);

    const selectPage = (id: string) => {
        const href = hrefForDemo(id);
        if (
            window.location.pathname + window.location.search !== href
        ) {
            window.history.pushState(null, '', href);
        }
        setActiveId(id);
        setMobileOpen(false);
    };

    const pagesBySection = useMemo(() => {
        const grouped: Record<SidebarSection, DemoPage[]> = {
            home: [],
            demos: [],
            interactions: [],
            selectors: [],
            fallbacks: [],
            tools: [],
        };
        for (const page of PAGES) grouped[page.section].push(page);
        return grouped;
    }, []);

    const Active = PAGES.find((p) => p.id === activeId)?.Component ?? null;

    const toggleSection = (id: SidebarSection) =>
        setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

    const renderSection = (section: SectionMeta) => {
        const pages = pagesBySection[section.id];
        if (pages.length === 0) return null;
        const isCollapsed = collapsed[section.id];
        const containsActive = pages.some((p) => p.id === activeId);
        return (
            <div
                key={section.id}
                className={`sidebar-section${
                    containsActive ? ' has-active' : ''
                }`}
            >
                <button
                    type="button"
                    className={`sidebar-section-header${
                        isCollapsed ? ' collapsed' : ''
                    }`}
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={!isCollapsed}
                    aria-controls={`sidebar-section-${section.id}`}
                >
                    <span className="sidebar-section-icon" aria-hidden>
                        {section.icon}
                    </span>
                    <span className="sidebar-section-label">
                        {section.label}
                    </span>
                    <span className="sidebar-section-count" aria-hidden>
                        {pages.length}
                    </span>
                    <span className="sidebar-section-chevron" aria-hidden>
                        {ChevronIcon}
                    </span>
                </button>
                {!isCollapsed && (
                    <div
                        id={`sidebar-section-${section.id}`}
                        className="sidebar-section-items"
                    >
                        {pages.map((page) => {
                            const isActive = activeId === page.id;
                            return (
                                <button
                                    key={page.id}
                                    type="button"
                                    className={`sidebar-link${
                                        isActive ? ' active' : ''
                                    }`}
                                    onClick={() => selectPage(page.id)}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <span
                                        className="sidebar-link-marker"
                                        aria-hidden
                                    >
                                        {page.number !== undefined ? (
                                            <span className="sidebar-link-number">
                                                {page.number}
                                            </span>
                                        ) : (
                                            <span className="sidebar-link-dot" />
                                        )}
                                    </span>
                                    <span className="sidebar-link-text">
                                        {page.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`app${mobileOpen ? ' sidebar-open' : ''}`}>
            <button
                type="button"
                className="sidebar-toggle"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
            >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                    {mobileOpen ? (
                        <path
                            d="M6 6l12 12M18 6L6 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    ) : (
                        <path
                            d="M4 7h16M4 12h16M4 17h16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    )}
                </svg>
            </button>
            {mobileOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden
                />
            )}
            <nav className="sidebar" aria-label="Demo navigation">
                <button
                    type="button"
                    className="sidebar-brand"
                    onClick={() => selectPage('home')}
                    aria-label="Go to introduction"
                >
                    <span className="sidebar-brand-mark" aria-hidden>
                        <svg viewBox="0 0 24 24" fill="none">
                            <path
                                d="M5 3l13 9-6 1.5L9 21 5 3z"
                                fill="currentColor"
                            />
                        </svg>
                    </span>
                    <span className="sidebar-brand-text">
                        <span className="sidebar-brand-name">
                            React Flowcase
                        </span>
                        <span className="sidebar-brand-tag">
                            <span className="sidebar-brand-dot" aria-hidden />
                            demo · pre-1.0
                        </span>
                    </span>
                </button>

                <div className="sidebar-scroll">
                    {SECTIONS.map(renderSection)}
                </div>

                <div className="sidebar-footer">
                    <a
                        className="sidebar-footer-link"
                        href="https://github.com/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                                d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"
                                fill="currentColor"
                            />
                        </svg>
                        <span>GitHub</span>
                    </a>
                    <span className="sidebar-footer-sep" aria-hidden>
                        •
                    </span>
                    <button
                        type="button"
                        className="sidebar-footer-link"
                        onClick={() => selectPage('home')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                                d="M5 4h11l3 3v13H5V4z"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M8 12h8M8 16h5"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            />
                        </svg>
                        <span>Docs</span>
                    </button>
                </div>
            </nav>
            <main ref={contentRef} className="content">
                {Active ? <Active onNavigate={selectPage} /> : null}
            </main>
        </div>
    );
}
