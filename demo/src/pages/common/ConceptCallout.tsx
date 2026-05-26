import type { ReactNode } from 'react';
import './concept-callout.css';

export interface ConceptItem {
    /** Library API or step type this point demonstrates. */
    api: string;
    /** Short explanation of why it matters in this demo. */
    description: ReactNode;
}

export interface ConceptCalloutProps {
    /** Bold one-line takeaway. Renders as the panel heading. */
    headline: ReactNode;
    /** Bullet list of APIs this demo touches and what they do here. */
    points: ConceptItem[];
}

/**
 * A "What this demo teaches" panel rendered above each demo's interactive
 * area. Keeps every demo's story explicit and consistent.
 */
export function ConceptCallout({ headline, points }: ConceptCalloutProps) {
    return (
        <section className="concept-callout" aria-label="What this demo teaches">
            <header className="concept-callout-header">
                <span className="concept-callout-eyebrow">
                    What this demo teaches
                </span>
                <h2 className="concept-callout-headline">{headline}</h2>
            </header>
            <ul className="concept-callout-list">
                {points.map((p, i) => (
                    <li key={i}>
                        <code className="concept-callout-api">{p.api}</code>
                        <span className="concept-callout-desc">
                            {p.description}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
