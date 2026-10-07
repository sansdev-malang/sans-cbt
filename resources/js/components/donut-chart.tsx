import { useState } from 'react';

export type DonutChartItem = {
    label: string;
    value: number;
    color: string;
};

type Props = {
    items: DonutChartItem[];
    size?: number;
    title?: string;
    centerLabel?: string;
    emptyText?: string;
};

export default function DonutChart({
    items,
    size = 200,
    title = 'Total',
    centerLabel,
    emptyText = 'Belum ada data untuk ditampilkan.',
}: Props) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const total = items.reduce((acc, curr) => acc + curr.value, 0);

    if (total === 0 || items.length === 0) {
        return (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                {emptyText}
            </div>
        );
    }

    const radius = 68;
    const strokeWidth = 24;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    let accumulatedOffset = 0;

    const segments = items.map((item, index) => {
        const ratio = item.value / total;
        const strokeDasharray = `${ratio * circumference} ${circumference}`;
        const strokeDashoffset = -accumulatedOffset;
        accumulatedOffset += ratio * circumference;
        const percentage = Math.round(ratio * 100);

        return {
            ...item,
            index,
            strokeDasharray,
            strokeDashoffset,
            percentage,
        };
    });

    const activeItem = hoveredIndex !== null ? items[hoveredIndex] : null;

    return (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-around">
            {/* Donut SVG Ring */}
            <div
                className="relative shrink-0"
                style={{ width: size, height: size }}
            >
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    className="rotate-[-90deg] select-none"
                    role="img"
                    aria-label="Grafik Donat"
                >
                    {/* Background ring */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        className="text-muted/40"
                        strokeWidth={strokeWidth}
                    />

                    {/* Donut Segments */}
                    {segments.map((seg) => {
                        const isHovered = hoveredIndex === seg.index;
                        return (
                            <circle
                                key={seg.label}
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="transparent"
                                stroke={seg.color}
                                strokeWidth={
                                    isHovered ? strokeWidth + 4 : strokeWidth
                                }
                                strokeDasharray={seg.strokeDasharray}
                                strokeDashoffset={seg.strokeDashoffset}
                                className="cursor-pointer transition-all duration-200"
                                style={{
                                    filter: isHovered
                                        ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))'
                                        : undefined,
                                }}
                                onMouseEnter={() => setHoveredIndex(seg.index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            />
                        );
                    })}
                </svg>

                {/* Center Content */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-medium text-muted-foreground transition-all duration-150">
                        {activeItem
                            ? activeItem.label
                            : (centerLabel ?? title)}
                    </span>
                    <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                        {activeItem ? activeItem.value : total}
                    </span>
                    {activeItem && (
                        <span className="text-[10px] font-semibold text-muted-foreground">
                            {Math.round((activeItem.value / total) * 100)}%
                        </span>
                    )}
                </div>
            </div>

            {/* Legend List */}
            <div className="flex w-full flex-col gap-2 sm:max-w-[200px]">
                {segments.map((seg) => {
                    const isHovered = hoveredIndex === seg.index;
                    return (
                        <button
                            key={seg.label}
                            type="button"
                            onClick={() =>
                                setHoveredIndex(isHovered ? null : seg.index)
                            }
                            onMouseEnter={() => setHoveredIndex(seg.index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors duration-150 ${
                                isHovered
                                    ? 'bg-muted font-medium'
                                    : 'hover:bg-muted/60'
                            }`}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: seg.color }}
                                />
                                <span className="truncate text-foreground">
                                    {seg.label}
                                </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5 tabular-nums">
                                <span className="font-semibold text-foreground">
                                    {seg.value}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                    ({seg.percentage}%)
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

