import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type Dispatch,
    type SetStateAction,
} from 'react';

const DEMO_CURSOR_SRC = `${import.meta.env.BASE_URL}demo-cursor.svg`;

const HERO_FLOW_STEPS = [
    { type: 'input', target: '#email', detail: 'ada@example.com' },
    { type: 'input', target: '#password', detail: '••••••••' },
    { type: 'click', target: '#submit', detail: 'await handler' },
] as const;

const EMAIL_TEXT = 'ada@example.com';
const PASSWORD_TEXT = '••••••••';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type CursorPoint = { x: number; y: number };

export function HeroFlowPreview() {
    const stageRef = useRef<HTMLDivElement>(null);
    const emailRef = useRef<HTMLDivElement>(null);
    const passwordRef = useRef<HTMLDivElement>(null);
    const submitRef = useRef<HTMLButtonElement>(null);

    const [activeStep, setActiveStep] = useState(0);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [cursor, setCursor] = useState<CursorPoint>({ x: 16, y: 16 });
    const [cursorVisible, setCursorVisible] = useState(false);
    const [clicking, setClicking] = useState(false);
    const [running, setRunning] = useState(false);

    const measureTarget = useCallback((el: HTMLElement | null): CursorPoint | null => {
        const stage = stageRef.current;
        if (!stage || !el) return null;
        const stageRect = stage.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        return {
            x: elRect.left - stageRect.left + 14,
            y: elRect.top - stageRect.top + elRect.height / 2 - 2,
        };
    }, []);

    const moveCursor = useCallback(
        async (el: HTMLElement | null) => {
            const point = measureTarget(el);
            if (point) setCursor(point);
            await sleep(520);
        },
        [measureTarget],
    );

    const typeInto = useCallback(
        async (text: string, setter: Dispatch<SetStateAction<string>>) => {
            setter('');
            for (const ch of text) {
                setter((prev) => prev + ch);
                await sleep(42);
            }
            await sleep(180);
        },
        [],
    );

    useEffect(() => {
        let cancelled = false;

        const runLoop = async () => {
            await sleep(400);
            if (cancelled) return;

            const emailPoint = measureTarget(emailRef.current);
            if (emailPoint) {
                setCursor(emailPoint);
                setCursorVisible(true);
            }

            while (!cancelled) {
                setRunning(true);
                setEmail('');
                setPassword('');
                setClicking(false);

                setActiveStep(0);
                await moveCursor(emailRef.current);
                if (cancelled) return;
                await typeInto(EMAIL_TEXT, setEmail);

                setActiveStep(1);
                await moveCursor(passwordRef.current);
                if (cancelled) return;
                await typeInto(PASSWORD_TEXT, setPassword);

                setActiveStep(2);
                await moveCursor(submitRef.current);
                if (cancelled) return;

                setClicking(true);
                await sleep(140);
                setClicking(false);
                await sleep(900);

                setRunning(false);
                setActiveStep(-1);
                setCursorVisible(false);
                await sleep(500);
                if (cancelled) return;

                const resetPoint = measureTarget(emailRef.current);
                if (resetPoint) setCursor(resetPoint);
                setCursorVisible(true);
                await sleep(300);
            }
        };

        runLoop();

        return () => {
            cancelled = true;
        };
    }, [measureTarget, moveCursor, typeInto]);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;

        const targets = [
            emailRef,
            passwordRef,
            submitRef,
        ] as const;

        const remeasure = () => {
            const idx = activeStep;
            if (idx < 0 || idx > 2) return;
            const point = measureTarget(targets[idx].current);
            if (point) setCursor(point);
        };

        const ro = new ResizeObserver(remeasure);
        ro.observe(stage);
        window.addEventListener('resize', remeasure);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', remeasure);
        };
    }, [activeStep, measureTarget]);

    return (
        <div className="home-hero-preview" aria-hidden>
            <div className="home-hero-preview-chrome">
                <span className="home-hero-preview-dot" />
                <span className="home-hero-preview-dot" />
                <span className="home-hero-preview-dot" />
                <span className="home-hero-preview-title">flow.ts</span>
                {running && (
                    <span className="home-hero-preview-running">running</span>
                )}
            </div>

            <div className="home-hero-preview-main">
                <ol className="home-hero-preview-steps">
                    {HERO_FLOW_STEPS.map((step, index) => (
                        <li
                            key={step.target}
                            className={`home-hero-preview-step${
                                index === activeStep
                                    ? ' home-hero-preview-step-active'
                                    : ''
                            }${
                                index < activeStep
                                    ? ' home-hero-preview-step-done'
                                    : ''
                            }`}
                        >
                            <span className="home-hero-preview-index">
                                {index < activeStep ? '✓' : index + 1}
                            </span>
                            <div className="home-hero-preview-step-body">
                                <span className="home-hero-preview-type">
                                    {step.type}
                                </span>
                                <span className="home-hero-preview-target">
                                    {step.target}
                                </span>
                                <span className="home-hero-preview-detail">
                                    {index === 0
                                        ? email || step.detail
                                        : index === 1
                                          ? password || step.detail
                                          : step.detail}
                                </span>
                            </div>
                        </li>
                    ))}
                </ol>

                <div ref={stageRef} className="home-hero-preview-stage">
                    <div className="home-hero-preview-form">
                        <div
                            ref={emailRef}
                            className={`home-hero-preview-field${
                                activeStep === 0 ? ' is-target' : ''
                            }${email ? ' has-value' : ''}`}
                        >
                            <span className="home-hero-preview-label">
                                email
                            </span>
                            <span className="home-hero-preview-value">
                                {email}
                                {activeStep === 0 && running && (
                                    <span className="home-hero-preview-caret" />
                                )}
                            </span>
                        </div>
                        <div
                            ref={passwordRef}
                            className={`home-hero-preview-field${
                                activeStep === 1 ? ' is-target' : ''
                            }${password ? ' has-value' : ''}`}
                        >
                            <span className="home-hero-preview-label">
                                password
                            </span>
                            <span className="home-hero-preview-value">
                                {password}
                                {activeStep === 1 && running && (
                                    <span className="home-hero-preview-caret" />
                                )}
                            </span>
                        </div>
                        <button
                            ref={submitRef}
                            type="button"
                            tabIndex={-1}
                            className={`home-hero-preview-submit${
                                activeStep === 2 ? ' is-target' : ''
                            }${clicking ? ' is-pressed' : ''}`}
                        >
                            Sign in
                        </button>
                    </div>

                    <img
                        src={DEMO_CURSOR_SRC}
                        alt=""
                        className={`home-hero-preview-cursor${
                            cursorVisible ? ' is-visible' : ''
                        }${clicking ? ' is-clicking' : ''}`}
                        style={{
                            left: cursor.x,
                            top: cursor.y,
                        }}
                        draggable={false}
                    />
                </div>
            </div>
        </div>
    );
}
