import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { describeStep, type FlowStep, type StepEvent } from './types';

export type StepStatus =
    | 'pending'
    | 'running'
    | 'success'
    | 'failed'
    | 'timeout'
    | 'cancelled';

export interface FlowStepsIndicatorProps {
    flow: FlowStep[];
    /** Map of step index → status. Missing entries default to 'pending'. */
    statuses?: Record<number, StepStatus>;
    title?: string;
    className?: string;
    style?: CSSProperties;
}

const SPINNER_STYLE_ID = 'rca-flow-steps-anim';

function ensureAnimationStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById(SPINNER_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = SPINNER_STYLE_ID;
    style.textContent = `
@keyframes rca-step-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(106, 169, 255, 0.45); }
    50% { box-shadow: 0 0 0 6px rgba(106, 169, 255, 0); }
}
@keyframes rca-step-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
[data-rca-step-running] {
    animation: rca-step-pulse 1.4s ease-in-out infinite;
}
[data-rca-step-spin] {
    animation: rca-step-spin 0.9s linear infinite;
    transform-origin: center;
    display: inline-block;
}
`;
    document.head.appendChild(style);
}

const STATUS_COLOR: Record<StepStatus, { bg: string; border: string; fg: string }> = {
    pending: {
        bg: 'rgba(127, 127, 127, 0.12)',
        border: 'rgba(127, 127, 127, 0.3)',
        fg: '#8a93a6',
    },
    running: {
        bg: 'rgba(106, 169, 255, 0.18)',
        border: 'rgba(106, 169, 255, 0.6)',
        fg: '#6aa9ff',
    },
    success: {
        bg: 'rgba(82, 198, 145, 0.18)',
        border: 'rgba(82, 198, 145, 0.55)',
        fg: '#52c691',
    },
    failed: {
        bg: 'rgba(239, 91, 107, 0.18)',
        border: 'rgba(239, 91, 107, 0.55)',
        fg: '#ef5b6b',
    },
    timeout: {
        bg: 'rgba(255, 140, 66, 0.18)',
        border: 'rgba(255, 140, 66, 0.55)',
        fg: '#ff8c42',
    },
    cancelled: {
        bg: 'rgba(250, 178, 89, 0.14)',
        border: 'rgba(250, 178, 89, 0.5)',
        fg: '#fab259',
    },
};

const STEP_TYPE_COLOR: Record<FlowStep['type'], string> = {
    click: '#6aa9ff',
    input: '#b084fc',
    select: '#fab259',
    delay: '#8a93a6',
    waitFor: '#5ed3d6',
    hover: '#ff8c42',
    keypress: '#ef93b9',
    scroll: '#52c691',
};

const styles = {
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        fontSize: 12,
        minWidth: 0,
        width: '100%',
    } as CSSProperties,
    header: {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
    } as CSSProperties,
    title: {
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        opacity: 0.6,
        margin: 0,
    } as CSSProperties,
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 0,
        width: '100%',
    } as CSSProperties,
    row: (s: StepStatus): CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minWidth: 0,
        maxWidth: '100%',
        padding: '8px 10px',
        borderRadius: 8,
        background: STATUS_COLOR[s].bg,
        border: `1px solid ${STATUS_COLOR[s].border}`,
        color: 'inherit',
        transition: 'background 0.2s, border-color 0.2s',
    }),
    badge: (color: string): CSSProperties => ({
        background: 'transparent',
        color,
        border: `1px solid ${color}55`,
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        flexShrink: 0,
    }),
    index: {
        minWidth: 16,
        textAlign: 'right',
        opacity: 0.55,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
    } as CSSProperties,
    elementId: {
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        opacity: 0.85,
    } as CSSProperties,
    iconWrap: (s: StepStatus): CSSProperties => ({
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: STATUS_COLOR[s].bg,
        border: `1px solid ${STATUS_COLOR[s].border}`,
        color: STATUS_COLOR[s].fg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    }),
    summary: {
        fontSize: 11,
        opacity: 0.5,
    } as CSSProperties,
};

function StatusIcon({ status }: { status: StepStatus }) {
    if (status === 'success') {
        return (
            <svg
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <polyline points="20 6 9 17 4 12" />
            </svg>
        );
    }
    if (status === 'failed') {
        return (
            <svg
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
        );
    }
    if (status === 'cancelled') {
        return (
            <svg
                width={11}
                height={11}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
            >
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
        );
    }
    if (status === 'timeout') {
        // Clock face: circle + hour/minute hands at ~10:00.
        return (
            <svg
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 16 14" />
            </svg>
        );
    }
    if (status === 'running') {
        return (
            <svg
                data-rca-step-spin=""
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                aria-hidden="true"
            >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
        );
    }
    return (
        <svg
            width={8}
            height={8}
            viewBox="0 0 8 8"
            aria-hidden="true"
        >
            <circle cx="4" cy="4" r="3" fill="currentColor" opacity="0.6" />
        </svg>
    );
}

function summarize(
    statuses: Record<number, StepStatus>,
    total: number,
): string {
    const counts: Record<StepStatus, number> = {
        pending: 0,
        running: 0,
        success: 0,
        failed: 0,
        timeout: 0,
        cancelled: 0,
    };
    for (let i = 0; i < total; i++) {
        counts[statuses[i] ?? 'pending'] += 1;
    }
    const parts: string[] = [];
    if (counts.running > 0) parts.push(`${counts.running} running`);
    if (counts.success > 0) parts.push(`${counts.success} done`);
    if (counts.failed > 0) parts.push(`${counts.failed} failed`);
    if (counts.timeout > 0) parts.push(`${counts.timeout} timed out`);
    if (counts.cancelled > 0) parts.push(`${counts.cancelled} cancelled`);
    if (counts.pending > 0) parts.push(`${counts.pending} pending`);
    return parts.length > 0 ? parts.join(' · ') : `${total} steps`;
}

/**
 * Compact vertical step list with live status indicators. Drive it by feeding
 * `onStepEvent` events from `runFlow` into a `statuses` map keyed by step index.
 */
export function FlowStepsIndicator({
    flow,
    statuses = {},
    title = 'Steps',
    className,
    style,
}: FlowStepsIndicatorProps) {
    useEffect(() => {
        ensureAnimationStyles();
    }, []);

    return (
        <div className={className} style={{ ...styles.root, ...style }}>
            <div style={styles.header}>
                <h4 style={styles.title}>{title}</h4>
                <span style={styles.summary}>
                    {summarize(statuses, flow.length)}
                </span>
            </div>
            <div style={styles.list}>
                {flow.map((step, idx) => {
                    const s = statuses[idx] ?? 'pending';
                    return (
                        <div
                            key={idx}
                            style={styles.row(s)}
                            data-rca-step-running={
                                s === 'running' ? '' : undefined
                            }
                        >
                            <span style={styles.iconWrap(s)}>
                                <StatusIcon status={s} />
                            </span>
                            <span style={styles.index}>{idx + 1}</span>
                            <span
                                style={styles.badge(
                                    STEP_TYPE_COLOR[step.type],
                                )}
                            >
                                {step.type}
                            </span>
                            <span style={styles.elementId}>
                                {describeStep(step)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Helper for consumers: derive the next `statuses` map from a `StepEvent`.
 * Pure function, easy to use with `useState(setter)`.
 */
const PHASE_TO_STATUS: Record<StepEvent['phase'], StepStatus> = {
    start: 'running',
    success: 'success',
    'assertion-failed': 'failed',
    'element-not-found': 'failed',
    'target-disabled': 'failed',
    timeout: 'timeout',
    cancelled: 'cancelled',
};

export function applyStepEvent(
    prev: Record<number, StepStatus>,
    event: StepEvent,
): Record<number, StepStatus> {
    return { ...prev, [event.index]: PHASE_TO_STATUS[event.phase] };
}
