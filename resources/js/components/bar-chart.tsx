import { useState } from 'react';

export type BarChartItem = {
    label: string;
    sublabel?: string;
    value: number;
    color?: string;
};

type Props = {
    items: BarChartItem[];
    height?: number;
    unit?: string;
    emptyText?: string;
};

export default function BarChart({
    items,
    height = 240,
    unit = '',
    emptyText = 'Belum ada data untuk ditampilkan.',
}: Props) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const width = 560;
    const padding = { top: 28, right: 16, bottom: 42, left: 40 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    if (!items || items.length === 0) {
        return (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                {emptyText}
            </div>
        );
    }

    const maxValue = Math.max(...items.map((it) => it.value), 0);
    // Find a clean upper bound for the Y axis
    const calculateNiceMax = (max: number) => {
        if (max <= 5) return 5;
        if (max <= 10) return 10;
        if (max <= 25) return 25;
        if (max <= 50) return 50;
        if (max <= 100) return 100;
        const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
        return Math.ceil(max / magnitude) * magnitude;
    };

    const niceMax = calculateNiceMax(maxValue);
    const ticks = [0, niceMax * 0.25, niceMax * 0.5, niceMax * 0.75, niceMax];

    const toY = (val: number) =>
        padding.top + innerHeight - (val / niceMax) * innerHeight;

    const colWidth = innerWidth / items.length;
    const barWidth = Math.min(36, Math.max(16, colWidth * 0.55));

    return (
        <div className="relative w-full">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full select-none overflow-visible"
                role="img"
                aria-label="Grafik Batang"
            >
                {/* Horizontal Grid Lines */}
                {ticks.map((tick, idx) => {
                    const y = toY(tick);
                    return (
                        <g key={idx}>
                            <line
                                x1={padding.left}
                                x2={width - padding.right}
                                y1={y}
                                y2={y}
                                stroke="currentColor"
                                className="text-border"
                                strokeWidth="1"
                                strokeDasharray={tick === 0 ? undefined : '3 4'}
                            />
                            <text
                                x={padding.left - 8}
                                y={y + 3.5}
                                textAnchor="end"
                                className="fill-muted-foreground text-[10px] font-medium"
                            >
                                {Math.round(tick)}
                            </text>
                        </g>
                    );
                })}

                {/* Bars */}
                {items.map((item, index) => {
                    const isHovered = hoveredIndex === index;
                    const barHeight =
                        niceMax > 0 ? (item.value / niceMax) * innerHeight : 0;
                    const barX =
                        padding.left +
                        index * colWidth +
                        (colWidth - barWidth) / 2;
                    const barY = padding.top + innerHeight - barHeight;
                    const centerX = barX + barWidth / 2;

                    return (
                        <g
                            key={`${item.label}-${index}`}
                            className="cursor-pointer transition-all duration-200"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {/* Hover background highlight */}
                            <rect
                                x={padding.left + index * colWidth + 2}
                                y={padding.top}
                                width={colWidth - 4}
                                height={innerHeight}
                                rx="6"
                                className={`transition-colors duration-150 ${
                                    isHovered
                                        ? 'fill-muted/50'
                                        : 'fill-transparent'
                                }`}
                            />

                            {/* Bar */}
                            <rect
                                x={barX}
                                y={barHeight > 0 ? barY : barY - 2}
                                width={barWidth}
                                height={Math.max(barHeight, 2)}
                                rx={Math.min(barWidth / 2, 4)}
                                className={`transition-all duration-200 ${
                                    item.color
                                        ? ''
                                        : isHovered
                                          ? 'fill-primary'
                                          : 'fill-primary/80'
                                }`}
                                fill={item.color}
                            />

                            {/* Value label on top of bar */}
                            {item.value > 0 && (
                                <text
                                    x={centerX}
                                    y={barY - 6}
                                    textAnchor="middle"
                                    className={`transition-all duration-150 ${
                                        isHovered
                                            ? 'fill-foreground font-bold text-[11px]'
                                            : 'fill-muted-foreground font-medium text-[10px]'
                                    }`}
                                >
                                    {item.value}
                                </text>
                            )}

                            {/* X-axis Label */}
                            <text
                                x={centerX}
                                y={height - padding.bottom + 15}
                                textAnchor="middle"
                                className={`transition-colors duration-150 text-[10px] ${
                                    isHovered
                                        ? 'fill-foreground font-semibold'
                                        : 'fill-muted-foreground'
                                }`}
                            >
                                {item.label.length > 10
                                    ? `${item.label.substring(0, 9)}…`
                                    : item.label}
                            </text>

                            {/* Sublabel if available */}
                            {item.sublabel && (
                                <text
                                    x={centerX}
                                    y={height - padding.bottom + 27}
                                    textAnchor="middle"
                                    className="fill-muted-foreground/80 text-[8.5px]"
                                >
                                    {item.sublabel.length > 12
                                        ? `${item.sublabel.substring(0, 11)}…`
                                        : item.sublabel}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Micro hover details banner */}
            {hoveredIndex !== null && items[hoveredIndex] && (
                <div className="pointer-events-none absolute top-1 right-2 rounded-md border bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-sm">
                    <span className="font-semibold text-foreground">
                        {items[hoveredIndex].label}
                    </span>
                    : {items[hoveredIndex].value} {unit}
                    {items[hoveredIndex].sublabel && (
                        <span className="ml-1 text-muted-foreground">
                            ({items[hoveredIndex].sublabel})
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

