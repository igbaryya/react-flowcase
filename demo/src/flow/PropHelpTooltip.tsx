import {
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties, MouseEvent } from 'react';

const TOOLTIP_MAX_WIDTH = 280;
const VIEWPORT_PAD = 12;
const GAP = 8;

const styles = {
    wrap: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
    } as CSSProperties,
    btn: {
        width: 16,
        height: 16,
        padding: 0,
        borderRadius: '50%',
        border: '1px solid rgba(127, 127, 127, 0.45)',
        background: 'rgba(127, 127, 127, 0.2)',
        color: '#c8cdd8',
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        transition: 'border-color 0.12s, background 0.12s, color 0.12s',
    } as CSSProperties,
    btnActive: {
        borderColor: 'rgba(106, 169, 255, 0.75)',
        background: 'rgba(106, 169, 255, 0.28)',
        color: '#ffffff',
    } as CSSProperties,
    popover: {
        position: 'fixed',
        zIndex: 1,
        minWidth: 220,
        maxWidth: TOOLTIP_MAX_WIDTH,
        maxHeight: 200,
        overflowY: 'auto',
        padding: '11px 13px',
        borderRadius: 10,
        background: '#232936',
        border: '1px solid rgba(106, 169, 255, 0.55)',
        boxShadow:
            '0 16px 40px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(0, 0, 0, 0.35)',
        fontSize: 12,
        lineHeight: 1.55,
        color: '#f3f5fa',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontWeight: 400,
        textTransform: 'none',
        letterSpacing: 'normal',
        pointerEvents: 'auto',
    } as CSSProperties,
};

export interface PropHelpTooltipProps {
    text: string;
}

function getPortalRoot(anchor: HTMLElement): HTMLElement {
    return anchor.closest('dialog') ?? document.body;
}

function computePopoverPosition(
    anchor: DOMRect,
    popoverHeight: number,
): { top: number; left: number } {
    let left = anchor.left;
    const width = TOOLTIP_MAX_WIDTH;

    if (left + width > window.innerWidth - VIEWPORT_PAD) {
        left = Math.max(VIEWPORT_PAD, window.innerWidth - width - VIEWPORT_PAD);
    }

    const belowTop = anchor.bottom + GAP;
    const aboveTop = anchor.top - GAP - popoverHeight;
    const fitsBelow =
        belowTop + popoverHeight <= window.innerHeight - VIEWPORT_PAD;
    const top = fitsBelow
        ? belowTop
        : Math.max(VIEWPORT_PAD, aboveTop);

    return { top, left };
}

export function PropHelpTooltip({ text }: PropHelpTooltipProps) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(
        null,
    );
    const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const tooltipId = useId();

    const close = () => {
        setOpen(false);
        setPosition(null);
    };

    const updatePosition = () => {
        const btn = btnRef.current;
        const popover = popoverRef.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const height = popover?.offsetHeight ?? 72;
        setPosition(computePopoverPosition(rect, height));
    };

    useLayoutEffect(() => {
        if (!open) return;
        updatePosition();
    }, [open, text]);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (btnRef.current?.contains(target)) return;
            if (popoverRef.current?.contains(target)) return;
            close();
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close();
        };

        const onScroll = (event: Event) => {
            const target = event.target as Node | null;
            if (popoverRef.current?.contains(target)) return;
            close();
        };

        // Defer so the opening click does not immediately dismiss.
        const dismissTimer = window.setTimeout(() => {
            document.addEventListener('pointerdown', onPointerDown);
        }, 0);

        document.addEventListener('keydown', onKeyDown);
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', close);

        return () => {
            window.clearTimeout(dismissTimer);
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', close);
        };
    }, [open]);

    const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (open) {
            close();
            return;
        }

        const btn = btnRef.current;
        if (!btn) return;

        setPortalRoot(getPortalRoot(btn));
        setPosition(computePopoverPosition(btn.getBoundingClientRect(), 72));
        setOpen(true);
    };

    const popover =
        open && position && portalRoot
            ? createPortal(
                  <div
                      ref={popoverRef}
                      id={tooltipId}
                      role="tooltip"
                      style={{
                          ...styles.popover,
                          top: position.top,
                          left: position.left,
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                  >
                      {text}
                  </div>,
                  portalRoot,
              )
            : null;

    return (
        <>
            <span style={styles.wrap}>
                <button
                    ref={btnRef}
                    type="button"
                    style={{ ...styles.btn, ...(open ? styles.btnActive : {}) }}
                    aria-label="Show property help"
                    aria-expanded={open}
                    aria-describedby={open ? tooltipId : undefined}
                    onClick={handleToggle}
                >
                    ?
                </button>
            </span>
            {popover}
        </>
    );
}
