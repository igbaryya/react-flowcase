import { useId } from 'react';

export interface DefaultCursorProps {
    size: number;
}

/**
 * Built-in gradient pointer. Hotspot is the upper-left tip of the arrow
 * (viewBox coordinates ~185, 137).
 */
export function DefaultCursor({ size }: DefaultCursorProps) {
    const uid = useId().replace(/:/g, '');
    const paint0 = `paint0_linear_${uid}`;
    const paint1 = `paint1_linear_${uid}`;
    const filter0 = `filter0_d_${uid}`;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 512 512"
            fill="none"
            aria-hidden
            style={{ display: 'block' }}
        >
            <path
                fill={`url(#${paint0})`}
                stroke="#fff"
                strokeWidth={10}
                d="M269.4 277.032L395.698 266.528 185.326 136.641 200.52 383.412 269.4 277.032Z"
            />
            <g
                filter={`url(#${filter0})`}
                opacity={0.5}
                style={{ mixBlendMode: 'multiply' }}
            >
                <path
                    fill={`url(#${paint1})`}
                    d="M269.4 277.032L395.698 266.528 185.326 136.641 200.52 383.412 269.4 277.032Z"
                />
                <path
                    stroke="#fff"
                    strokeWidth={10}
                    d="M269.4 277.032L395.698 266.528 185.326 136.641 200.52 383.412 269.4 277.032Z"
                />
            </g>
            <defs>
                <linearGradient
                    id={paint0}
                    x1={185.326}
                    x2={298.109}
                    y1={136.641}
                    y2={324.97}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#27A4FF" />
                    <stop offset={1} stopColor="#fff" />
                </linearGradient>
                <linearGradient
                    id={paint1}
                    x1={352}
                    x2={162}
                    y1={190}
                    y2={283}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#EE27FF" />
                    <stop offset={1} stopColor="#64FFE3" />
                </linearGradient>
                <filter
                    id={filter0}
                    width={279.505}
                    height={319.561}
                    x={155.742}
                    y={107.317}
                    colorInterpolationFilters="sRGB"
                    filterUnits="userSpaceOnUse"
                >
                    <feFlood floodOpacity={0} result="BackgroundImageFix" />
                    <feColorMatrix
                        in="SourceAlpha"
                        result="hardAlpha"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    />
                    <feOffset dy={4} />
                    <feGaussianBlur stdDeviation={12} />
                    <feComposite
                        in2="hardAlpha"
                        operator="out"
                    />
                    <feColorMatrix values="0 0 0 0 0.560784 0 0 0 0 0.807843 0 0 0 0 0.956863 0 0 0 1 0" />
                    <feBlend
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow"
                    />
                    <feBlend
                        in="SourceGraphic"
                        in2="effect1_dropShadow"
                        result="shape"
                    />
                </filter>
            </defs>
        </svg>
    );
}
