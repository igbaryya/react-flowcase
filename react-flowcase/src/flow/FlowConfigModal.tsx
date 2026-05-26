import { useEffect, useRef } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import {
    FlowConfigViewer,
    type FlowConfigViewerProps,
} from './FlowConfigViewer';

export interface FlowConfigModalProps
    extends Omit<FlowConfigViewerProps, 'title'> {
    open: boolean;
    onClose: () => void;
    /** Heading rendered in the modal header. */
    title?: string;
    /** When provided, renders a "Reset" button in the modal footer. */
    onReset?: () => void;
    /** Label for the primary footer button. Defaults to "Done". */
    confirmLabel?: string;
    /** Label for the reset button. Defaults to "Reset to defaults". */
    resetLabel?: string;
}

const styles = {
    dialog: {
        padding: 0,
        border: 'none',
        background: 'transparent',
        maxWidth: 'min(720px, 92vw)',
        width: '100%',
        maxHeight: '85vh',
        color: 'inherit',
    } as CSSProperties,
    panel: {
        background: '#1d2230',
        color: '#e6e8ee',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '85vh',
        overflow: 'hidden',
        fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    } as CSSProperties,
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        gap: 12,
    } as CSSProperties,
    title: {
        margin: 0,
        fontSize: 14,
        fontWeight: 600,
    } as CSSProperties,
    closeBtn: {
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: 'inherit',
        borderRadius: 6,
        width: 28,
        height: 28,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        lineHeight: 1,
        padding: 0,
    } as CSSProperties,
    body: {
        padding: 18,
        overflow: 'auto',
        flex: 1,
        minHeight: 0,
    } as CSSProperties,
    footer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 18px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        gap: 8,
    } as CSSProperties,
    ghostBtn: {
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: 'inherit',
        borderRadius: 6,
        padding: '6px 12px',
        cursor: 'pointer',
        fontSize: 12,
    } as CSSProperties,
    primaryBtn: {
        background: '#6aa9ff',
        color: '#0a0c11',
        border: '1px solid #6aa9ff',
        borderRadius: 6,
        padding: '6px 14px',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 600,
    } as CSSProperties,
};

const BACKDROP_STYLE_ID = 'rca-flow-config-modal-backdrop';

function ensureBackdropStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById(BACKDROP_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = BACKDROP_STYLE_ID;
    style.textContent = `
        dialog[data-rca-config-modal]::backdrop {
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(4px);
        }
    `;
    document.head.appendChild(style);
}

export function FlowConfigModal({
    open,
    onClose,
    onReset,
    title = 'Automation configuration',
    confirmLabel = 'Done',
    resetLabel = 'Reset to defaults',
    ...viewerProps
}: FlowConfigModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        ensureBackdropStyles();
    }, []);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            dialog.showModal();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const handleClose = () => onClose();
        dialog.addEventListener('close', handleClose);
        return () => dialog.removeEventListener('close', handleClose);
    }, [onClose]);

    const handleBackdropClick = (e: ReactMouseEvent<HTMLDialogElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <dialog
            ref={dialogRef}
            data-rca-config-modal=""
            style={styles.dialog}
            onClick={handleBackdropClick}
        >
            <div style={styles.panel}>
                <div style={styles.header}>
                    <h3 style={styles.title}>{title}</h3>
                    <button
                        type="button"
                        aria-label="Close"
                        style={styles.closeBtn}
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>
                <div style={styles.body}>
                    <FlowConfigViewer {...viewerProps} title="" />
                </div>
                <div style={styles.footer}>
                    {onReset ? (
                        <button
                            type="button"
                            style={styles.ghostBtn}
                            onClick={onReset}
                        >
                            {resetLabel}
                        </button>
                    ) : (
                        <span />
                    )}
                    <button
                        type="button"
                        style={styles.primaryBtn}
                        onClick={onClose}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </dialog>
    );
}
