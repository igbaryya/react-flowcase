export interface OutcomePanelProps {
    ok: boolean;
    message: string;
    data: unknown;
}

export function OutcomePanel({ ok, message, data }: OutcomePanelProps) {
    return (
        <div className="demo-card">
            <div className={`status ${ok ? 'success' : 'error'}`}>{message}</div>
            <pre className="outcome">{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}
