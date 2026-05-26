import type { CSSProperties } from 'react';

/** Example ReactNode cursor — scales with VirtualCursor `size`. */
export function ReactCursorIcon({ size }: { size: number }) {
    const ring = Math.max(2, Math.round(size * 0.08));
    const style: CSSProperties = {
        width: size,
        height: size,
        display: 'block',
        filter: 'drop-shadow(0 2px 6px rgba(106, 169, 255, 0.55))',
    };
    return (
        <svg
            style={style}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <circle
                cx="16"
                cy="16"
                r="13"
                stroke="#6aa9ff"
                strokeWidth={ring}
                fill="rgba(106, 169, 255, 0.15)"
            />
            <circle cx="16" cy="16" r="4" fill="#6aa9ff" />
            <path
                d="M16 4v6M16 22v6M4 16h6M22 16h6"
                stroke="#b084fc"
                strokeWidth={ring}
                strokeLinecap="round"
            />
        </svg>
    );
}
