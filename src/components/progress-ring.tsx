export function ProgressRing({
  done,
  target,
  size = 132,
  stroke = 11,
}: {
  done: number;
  target: number;
  size?: number;
  stroke?: number;
}) {
  const pct = target <= 0 ? 100 : Math.min(100, Math.round((done / target) * 100));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (circumference * pct) / 100;
  const label =
    target <= 0
      ? "No target"
      : done >= target
        ? "Target hit"
        : `${target - done} to go`;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${done} of ${target} sessions this week, ${pct} percent. ${label}.`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums text-ink">
          {done}
          <span className="text-base font-medium text-muted">/{target}</span>
        </span>
        <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted">
          {target <= 0 ? "No target" : `${pct}%`}
        </span>
      </div>
    </div>
  );
}
