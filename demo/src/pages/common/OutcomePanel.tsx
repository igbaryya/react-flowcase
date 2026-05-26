import { JsonReadonlyViewer } from './JsonReadonlyViewer';

export interface OutcomePanelProps {
    ok: boolean;
    message: string;
    data: unknown;
}

export function OutcomePanel({ ok, message, data }: OutcomePanelProps) {
    return (
        <div className="demo-card demo-card--outcome">
            <div className={`status ${ok ? 'success' : 'error'}`}>{message}</div>
            <JsonReadonlyViewer value={data} />
        </div>
    );
}
