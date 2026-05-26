import { useEffect, useId } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { DefaultCursor } from './DefaultCursor';
import type { Position } from './types';

/**
 * Render function form of a custom cursor. Receives the computed `size` so
 * authors can scale their visual accordingly. Return any ReactNode.
 */
export type CursorRenderer = (props: { size: number }) => ReactNode;

/**
 * Anything you can hand to `VirtualCursor`'s `cursor` prop.
 *
 * - `string` — treated as an image source and rendered as `<img>`.
 * - `function` — called with `{ size }`, must return a ReactNode. Useful
 *   when your cursor needs to react to the size.
 * - any other ReactNode — rendered as-is (SVG, div, component, etc.).
 *
 * Omit the `cursor` prop to use the built-in gradient pointer.
 */
export type CursorSource = string | CursorRenderer | ReactNode;

export interface VirtualCursorProps {
    position: Position;
    visible?: boolean;
    /**
     * Bounding-box size of the cursor in CSS pixels. Defaults to 28. Applied
     * to the wrapper element so every cursor variant (default / image /
     * custom node) sits in the same hit-box.
     */
    size?: number;
    /**
     * Custom cursor visual. See `CursorSource` for accepted shapes.
     * Omit for the built-in gradient pointer.
     */
    cursor?: CursorSource;
    /**
     * When true, shows a spinning loader beside the cursor. Use this to
     * indicate the automation is waiting (e.g. during `waitFor` or `delay`
     * steps). The loader appears at the bottom-right of the cursor.
     */
    loading?: boolean;
}

const DEFAULT_SIZE = 28;
const SPINNER_STYLE_ID = 'rca-cursor-spinner-anim';

function ensureSpinnerStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById(SPINNER_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = SPINNER_STYLE_ID;
    style.textContent = `
@keyframes rca-cursor-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
@keyframes rca-cursor-fade-in {
    from { opacity: 0; transform: scale(0.7); }
    to { opacity: 1; transform: scale(1); }
}
`;
    document.head.appendChild(style);
}

const wrapperStyle = (
    position: Position,
    size: number,
): CSSProperties => ({
    position: 'fixed',
    top: 0,
    left: 0,
    width: size,
    height: size,
    transform: `translate(${position.x}px, ${position.y}px)`,
    pointerEvents: 'none',
    zIndex: 9999,
    willChange: 'transform',
});

const imgStyle: CSSProperties = {
    display: 'block',
    width: '100%',
    height: '100%',
    userSelect: 'none',
};

const spinnerWrapStyle = (size: number): CSSProperties => ({
    position: 'absolute',
    left: size * 0.65,
    top: size * 0.65,
    width: size * 0.6,
    height: size * 0.6,
    animation: 'rca-cursor-fade-in 0.2s ease-out',
});

const spinnerStyle = (gradientId: string): CSSProperties => ({
    display: 'block',
    width: '100%',
    height: '100%',
    animation: 'rca-cursor-spin 0.8s linear infinite',
});

function LoadingSpinner({ size }: { size: number }) {
    const uid = useId().replace(/:/g, '');
    const gradientId = `rca-spinner-grad-${uid}`;
    const spinnerSize = Math.round(size * 0.6);

    return (
        <div style={spinnerWrapStyle(size)}>
            <svg
                width={spinnerSize}
                height={spinnerSize}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                style={spinnerStyle(gradientId)}
            >
                <defs>
                    <linearGradient
                        id={gradientId}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor="#27A4FF" />
                        <stop offset="100%" stopColor="#EE27FF" />
                    </linearGradient>
                </defs>
                <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke={`url(#${gradientId})`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="42 14"
                    fill="none"
                />
            </svg>
        </div>
    );
}

function isRenderer(cursor: CursorSource): cursor is CursorRenderer {
    return typeof cursor === 'function';
}

function renderCursor(
    cursor: CursorSource | undefined,
    size: number,
): ReactNode {
    if (cursor === undefined || cursor === null) {
        return <DefaultCursor size={size} />;
    }
    if (typeof cursor === 'string') {
        return (
            <img
                src={cursor}
                alt=""
                draggable={false}
                style={imgStyle}
            />
        );
    }
    if (isRenderer(cursor)) {
        return cursor({ size });
    }
    return cursor;
}

export function VirtualCursor({
    position,
    visible = true,
    size = DEFAULT_SIZE,
    cursor,
    loading = false,
}: VirtualCursorProps) {
    useEffect(() => {
        if (loading) ensureSpinnerStyles();
    }, [loading]);

    if (!visible) return null;

    return (
        <div aria-hidden="true" style={wrapperStyle(position, size)}>
            {renderCursor(cursor, size)}
            {loading && <LoadingSpinner size={size} />}
        </div>
    );
}
