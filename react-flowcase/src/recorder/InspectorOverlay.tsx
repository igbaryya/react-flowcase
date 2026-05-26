import { useEffect, useState, type CSSProperties } from 'react';
import { bestSelector, describeRecordedElement } from './selectorBuilder';

export interface InspectorOverlayProps {
    /** Element currently under the inspector. `null` hides the overlay. */
    target: Element | null;
    /** Optional: how `bestSelector` is computed. */
    selectorOptions?: Parameters<typeof bestSelector>[1];
}

interface Rect {
    top: number;
    left: number;
    width: number;
    height: number;
}

/**
 * Draws a translucent highlight around the inspector's currently-hovered
 * element and renders a tooltip with the element's tag, label, and the
 * selector the recorder would emit. Pointer-events are disabled so the
 * overlay never blocks the underlying interaction.
 *
 * Mounted at `position: fixed` so coordinates come straight from
 * `getBoundingClientRect()` — no scroll math needed.
 */
export function InspectorOverlay({
    target,
    selectorOptions,
}: InspectorOverlayProps) {
    const [rect, setRect] = useState<Rect | null>(null);

    useEffect(() => {
        if (!target || !target.isConnected) {
            setRect(null);
            return;
        }
        const update = () => {
            const r = target.getBoundingClientRect();
            setRect({
                top: r.top,
                left: r.left,
                width: r.width,
                height: r.height,
            });
        };
        update();

        // Keep the rectangle pinned to the target as the user scrolls /
        // resizes. RAF + scroll/resize listeners are cheap and avoid the
        // jitter you get from a ResizeObserver-only approach.
        let raf = 0;
        const tick = () => {
            update();
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(raf);
    }, [target]);

    if (!target || !rect) return null;

    const selector = (() => {
        try {
            return bestSelector(target, selectorOptions);
        } catch {
            return '';
        }
    })();
    const label = describeRecordedElement(target);

    // Tooltip below the rect when there's room, otherwise above.
    const vh = typeof window !== 'undefined' ? window.innerHeight : 600;
    const tooltipBelow = rect.top + rect.height + 12 < vh - 80;

    const tooltipStyle: CSSProperties = {
        position: 'fixed',
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 320)),
        top: tooltipBelow
            ? rect.top + rect.height + 8
            : Math.max(8, rect.top - 8),
        transform: tooltipBelow ? undefined : 'translateY(-100%)',
        maxWidth: 360,
        padding: '8px 10px',
        background: '#0a0c11',
        border: '1px solid rgba(106, 169, 255, 0.45)',
        borderRadius: 8,
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.45)',
        color: '#e6e9ef',
        fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: 11.5,
        lineHeight: 1.4,
        zIndex: 2147483647,
        pointerEvents: 'none',
    };

    return (
        <>
            <div
                data-rca-recorder="inspector"
                style={{
                    position: 'fixed',
                    top: rect.top - 2,
                    left: rect.left - 2,
                    width: rect.width + 4,
                    height: rect.height + 4,
                    border: '2px solid #6aa9ff',
                    background: 'rgba(106, 169, 255, 0.12)',
                    borderRadius: 4,
                    pointerEvents: 'none',
                    zIndex: 2147483646,
                    transition: 'all 60ms linear',
                }}
            />
            <div data-rca-recorder="inspector-tooltip" style={tooltipStyle}>
                <div
                    style={{
                        color: '#9aa1b1',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontSize: 9.5,
                        marginBottom: 2,
                    }}
                >
                    Pick element
                </div>
                <div
                    style={{
                        color: '#e6e9ef',
                        fontWeight: 500,
                        marginBottom: 4,
                    }}
                >
                    {label}
                </div>
                <div
                    style={{
                        fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: 11,
                        color: '#6aa9ff',
                        wordBreak: 'break-all',
                    }}
                >
                    {selector}
                </div>
            </div>
        </>
    );
}
