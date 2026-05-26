import { GearIcon, PlayIcon, StopIcon } from './icons';

import type { ReactNode } from 'react';

export interface DemoPageHeaderProps {
    title: string;
    description: ReactNode;
    running: boolean;
    onPlay: () => void;
    onStop: () => void;
    onOpenConfig: () => void;
}

export function DemoPageHeader({
    title,
    description,
    running,
    onPlay,
    onStop,
    onOpenConfig,
}: DemoPageHeaderProps) {
    return (
        <div className="demo-page-header">
            <div>
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
            <div className="demo-page-header-actions">
                <button
                    type="button"
                    className={`icon-btn ${running ? 'icon-btn-stop' : 'icon-btn-play'}`}
                    aria-label={
                        running ? 'Stop automation' : 'Start automation'
                    }
                    title={running ? 'Stop automation' : 'Start automation'}
                    onClick={running ? onStop : onPlay}
                >
                    {running ? <StopIcon /> : <PlayIcon />}
                </button>
                <button
                    type="button"
                    className="icon-btn"
                    aria-label="Open automation configuration"
                    title="Edit automation configuration"
                    onClick={onOpenConfig}
                    disabled={running}
                >
                    <GearIcon />
                </button>
            </div>
        </div>
    );
}
