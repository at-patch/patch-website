type DailyRevenue = { date: string; revenue: number };

const WIDTH = 700;
const HEIGHT = 140;
const GAP = 2;

// Static SVG bar chart — no client JS or charting library needed for a
// simple 30-day trend in the admin dashboard.
export function RevenueChart({ data }: { data: DailyRevenue[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const barWidth = data.length > 0 ? WIDTH / data.length - GAP : 0;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="h-36 w-full"
      role="img"
      aria-label="Daily revenue for the last 30 days"
    >
      {data.map((d, i) => {
        const barHeight = Math.max((d.revenue / max) * (HEIGHT - 4), d.revenue > 0 ? 2 : 0);
        const x = i * (barWidth + GAP);
        const y = HEIGHT - barHeight;
        return (
          <rect
            key={d.date}
            x={x}
            y={y}
            width={Math.max(barWidth, 1)}
            height={barHeight}
            rx={1}
            className="fill-patch-accent"
          >
            <title>
              {d.date}: {d.revenue.toLocaleString("en-US")}
            </title>
          </rect>
        );
      })}
    </svg>
  );
}
