/**
 * Lightweight dependency-free SVG line chart for score trends.
 */
export default function LineChart({
    points,
    height = 180,
}: {
    points: { label: string; score: number | null; date?: string }[];
    height?: number;
}) {
    const valid = points.filter((point) => point.score !== null);
    const width = 560;
    const padding = { top: 16, right: 16, bottom: 34, left: 34 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    if (valid.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Belum ada nilai untuk digrafik.
            </p>
        );
    }

    const stepX = valid.length > 1 ? innerWidth / (valid.length - 1) : 0;
    const toX = (index: number) =>
        padding.left + (valid.length > 1 ? index * stepX : innerWidth / 2);
    const toY = (score: number) =>
        padding.top +
        innerHeight -
        (Math.max(0, Math.min(100, score)) / 100) * innerHeight;

    const path = valid
        .map(
            (point, index) =>
                `${index === 0 ? "M" : "L"} ${toX(index).toFixed(1)} ${toY(point.score ?? 0).toFixed(1)}`,
        )
        .join(" ");
    const area = `${path} L ${toX(valid.length - 1).toFixed(1)} ${padding.top + innerHeight} L ${toX(0).toFixed(1)} ${padding.top + innerHeight} Z`;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full"
            role="img"
            aria-label="Grafik perkembangan nilai"
        >
            {[0, 25, 50, 75, 100].map((tick) => (
                <g key={tick}>
                    <line
                        x1={padding.left}
                        x2={width - padding.right}
                        y1={toY(tick)}
                        y2={toY(tick)}
                        stroke="currentColor"
                        className="text-border"
                        strokeWidth="1"
                        strokeDasharray={
                            tick === 0 || tick === 100 ? undefined : "3 4"
                        }
                    />
                    <text
                        x={padding.left - 6}
                        y={toY(tick) + 4}
                        textAnchor="end"
                        className="fill-current text-muted-foreground"
                        fontSize="10"
                    >
                        {tick}
                    </text>
                </g>
            ))}
            <path d={area} className="fill-primary/10" />
            <path
                d={path}
                fill="none"
                className="stroke-primary"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            {valid.map((point, index) => (
                <g key={`${point.label}-${index}`}>
                    <circle
                        cx={toX(index)}
                        cy={toY(point.score ?? 0)}
                        r="4"
                        className="fill-primary stroke-background"
                        strokeWidth="2"
                    />
                    <text
                        x={toX(index)}
                        y={toY(point.score ?? 0) - 9}
                        textAnchor="middle"
                        fontSize="10"
                        className="fill-current font-semibold"
                    >
                        {point.score}
                    </text>
                    <text
                        x={toX(index)}
                        y={height - padding.bottom + 14}
                        textAnchor="middle"
                        fontSize="10"
                        className="fill-current text-muted-foreground"
                    >
                        {point.label}
                        {point.date ? ` · ${point.date}` : ""}
                    </text>
                </g>
            ))}
        </svg>
    );
}
