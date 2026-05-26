export function HeroIllustration() {
    return (
        <div className="home-hero-illustration" aria-hidden>
            <svg viewBox="0 0 400 320" fill="none">
                {/* Background grid dots */}
                <defs>
                    <pattern
                        id="hero-grid"
                        x="0"
                        y="0"
                        width="24"
                        height="24"
                        patternUnits="userSpaceOnUse"
                    >
                        <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.15" />
                    </pattern>
                    <linearGradient id="hero-flow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--accent)" />
                        <stop offset="100%" stopColor="var(--success)" />
                    </linearGradient>
                </defs>
                <rect width="400" height="320" fill="url(#hero-grid)" />

                {/* Flow path connecting nodes - background */}
                <path
                    className="hero-flow-path-bg"
                    d="M80 80 L160 80 L160 160 L280 160 L280 240 L340 240"
                    stroke="var(--border)"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.4"
                />

                {/* Flow path connecting nodes - animated */}
                <path
                    className="hero-flow-path"
                    d="M80 80 L160 80 L160 160 L280 160 L280 240 L340 240"
                    stroke="url(#hero-flow-gradient)"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Step 1: Input node */}
                <g className="hero-node hero-node-1">
                    <rect
                        x="40"
                        y="56"
                        width="80"
                        height="48"
                        rx="8"
                        fill="var(--panel)"
                        stroke="var(--border)"
                        strokeWidth="1.5"
                    />
                    <text x="80" y="76" textAnchor="middle" fontSize="10" fill="var(--text-dim)">
                        INPUT
                    </text>
                    <rect x="52" y="84" width="56" height="12" rx="3" fill="var(--panel-2)" />
                    <rect x="54" y="86" width="32" height="8" rx="2" fill="var(--accent)" opacity="0.5" />
                </g>

                {/* Step 2: Click node */}
                <g className="hero-node hero-node-2">
                    <rect
                        x="120"
                        y="136"
                        width="80"
                        height="48"
                        rx="8"
                        fill="var(--panel)"
                        stroke="var(--border)"
                        strokeWidth="1.5"
                    />
                    <text x="160" y="156" textAnchor="middle" fontSize="10" fill="var(--text-dim)">
                        CLICK
                    </text>
                    <rect x="136" y="164" width="48" height="14" rx="4" fill="var(--success)" opacity="0.3" />
                    <text x="160" y="174" textAnchor="middle" fontSize="9" fill="var(--success)">
                        Submit
                    </text>
                </g>

                {/* Step 3: Wait node */}
                <g className="hero-node hero-node-3">
                    <rect
                        x="240"
                        y="136"
                        width="80"
                        height="48"
                        rx="8"
                        fill="var(--panel)"
                        stroke="var(--border)"
                        strokeWidth="1.5"
                    />
                    <text x="280" y="156" textAnchor="middle" fontSize="10" fill="var(--text-dim)">
                        WAIT
                    </text>
                    <g transform="translate(264, 162)">
                        <circle cx="8" cy="6" r="5" stroke="var(--accent)" strokeWidth="1.5" fill="none" opacity="0.6" />
                        <path d="M8 4 L8 6.5 L10 7.5" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" />
                    </g>
                    <text x="292" y="172" fontSize="9" fill="var(--text-dim)">
                        async
                    </text>
                </g>

                {/* Step 4: Success node */}
                <g className="hero-node hero-node-4">
                    <rect
                        x="300"
                        y="216"
                        width="80"
                        height="48"
                        rx="8"
                        fill="var(--panel)"
                        stroke="rgba(88, 200, 123, 0.4)"
                        strokeWidth="1.5"
                    />
                    <circle cx="340" cy="240" r="12" fill="rgba(88, 200, 123, 0.15)" />
                    <path
                        d="M334 240 L338 244 L346 236"
                        stroke="var(--success)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />
                    <text x="340" y="258" textAnchor="middle" fontSize="9" fill="var(--success)">
                        Done
                    </text>
                </g>

                {/* Decorative elements */}
                <circle cx="60" cy="260" r="20" fill="var(--accent)" opacity="0.08" />
                <circle cx="360" cy="60" r="30" fill="var(--success)" opacity="0.06" />
                <circle cx="320" cy="300" r="15" fill="var(--accent)" opacity="0.05" />
            </svg>
        </div>
    );
}
