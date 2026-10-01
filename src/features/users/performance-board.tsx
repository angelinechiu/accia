"use client";

import type { Document, KPI } from "@/types";
import { getTrends } from "@/lib/api/processing.service";
import { useResource } from "@/features/common/hooks/use-resource";

function metric(metrics: KPI[], label: string) {
  return metrics.find((item) => item.label === label);
}

function numberFrom(value: string | undefined, fallback: number) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
}

function Spark({ values, color }: { values: number[]; color: string }) {
  const hi = Math.max(...values);
  const lo = Math.min(...values);
  const span = hi - lo || 1;
  const width = 220;
  const height = 64;
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - 6 - ((value - lo) / span) * (height - 14);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="acct-spark" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polygon points={`${points} ${width},${height} 0,${height}`} fill={color} opacity="0.18" />
      <polyline points={points} stroke={color} />
    </svg>
  );
}

function Bars({
  items,
  colors,
}: {
  items: { label: string; value: number }[];
  colors: string[];
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="acct-bars" aria-hidden="true">
      {items.map((item, index) => (
        <div key={item.label}>
          <i
            style={{
              height: `${Math.max(8, (item.value / max) * 100)}%`,
              background: colors[index % colors.length],
            }}
          />
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  );
}

function Meter({
  value,
  limit,
  unit,
  color,
}: {
  value: number;
  limit: number;
  unit: string;
  color: string;
}) {
  const width = Math.min(100, (value / limit) * 100);
  return (
    <div className="acct-meter">
      <span style={{ width: `${width}%`, background: color }} />
      <small>
        {value}
        {unit} of {limit}
        {unit}
      </small>
    </div>
  );
}

function Donut({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  let cursor = 0;
  const stops = items
    .map((item) => {
      const start = cursor;
      cursor += (item.value / total) * 100;
      return `${item.color} ${start}% ${cursor}%`;
    })
    .join(", ");
  return (
    <div className="acct-mix">
      <div className="acct-donut" style={{ background: `conic-gradient(${stops})` }} />
      <ul className="acct-legend">
        {items.map((item) => (
          <li key={item.label}>
            <i style={{ background: item.color }} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AccountantBoard({
  docs,
  openExceptions,
  completed,
  processing,
  metrics,
}: {
  docs: Document[];
  openExceptions: number;
  completed: number;
  processing: number;
  metrics: KPI[];
}) {
  const trends = useResource(() => getTrends("week"), "accountant-week");
  const accuracy = metric(metrics, "Extraction accuracy");
  const time = metric(metrics, "Avg. processing time");
  const reduction = metric(metrics, "Manual entry reduction");
  const exceptions = metric(metrics, "Exception rate");
  const series = trends.data ?? [];
  const queued = docs.filter((doc) => ["QUEUED", "UPLOADED"].includes(doc.status)).length;
  const running = docs.filter((doc) => doc.status === "PROCESSING").length;
  const failed = docs.filter((doc) => doc.status === "FAILED").length;
  const extracted = Math.max(0, docs.length - queued - running - failed);

  const blue = "#2f80ed";
  const amber = "#f5a623";
  const coral = "#e85d4c";
  const green = "#2faf6a";
  const teal = "#14b8a6";
  const violet = "#7c6cf0";

  return (
    <section className="acct-board" aria-label="Processing performance">
      <article className="acct-tile" style={{ ["--tile" as string]: blue }}>
        <h3>Extraction accuracy</h3>
        <strong>{accuracy?.value ?? "—"}</strong>
        <p>Target {accuracy?.target ?? "≥ 95%"}</p>
        {series.length > 0 && (
          <Spark values={series.map((point) => point.accuracy)} color={blue} />
        )}
      </article>
      <article className="acct-tile" style={{ ["--tile" as string]: amber }}>
        <h3>Avg. processing time</h3>
        <strong>{time?.value ?? "—"}</strong>
        <p>Target {time?.target ?? "≤ 20 sec"}</p>
        <Meter value={numberFrom(time?.value, 8.7)} limit={20} unit="s" color={amber} />
      </article>
      <article className="acct-tile" style={{ ["--tile" as string]: coral }}>
        <h3>Exception rate</h3>
        <strong>{exceptions?.value ?? "—"}</strong>
        <p>Target {exceptions?.target ?? "< 10%"}</p>
        {series.length > 0 && (
          <Spark values={series.map((point) => point.exceptions)} color={coral} />
        )}
      </article>
      <article className="acct-tile" style={{ ["--tile" as string]: green }}>
        <h3>Manual entry reduction</h3>
        <strong>{reduction?.value ?? "—"}</strong>
        <p>Target {reduction?.target ?? "≥ 70%"}</p>
        <Meter value={numberFrom(reduction?.value, 74.1)} limit={100} unit="%" color={green} />
      </article>
      <article className="acct-tile wide" style={{ ["--tile" as string]: teal }}>
        <h3>Documents processed</h3>
        <strong>{series.reduce((sum, point) => sum + point.processed, 0) || docs.length}</strong>
        <p>This week, from the reference trend</p>
        <Bars
          colors={[teal, "#2f80ed", violet, amber, green, coral, "#49c6e5"]}
          items={series.map((point) => ({
            label: point.day.replace(" Sep", ""),
            value: point.processed,
          }))}
        />
      </article>
      <article className="acct-tile wide" style={{ ["--tile" as string]: violet }}>
        <h3>Your documents now</h3>
        <strong>{docs.length}</strong>
        <p>
          {processing} still running · {openExceptions} need review · {completed} completed
        </p>
        <Donut
          items={[
            { label: "Queue", value: queued, color: amber },
            { label: "Running", value: running, color: blue },
            { label: "Ready", value: extracted, color: green },
            { label: "Failed", value: failed, color: coral },
          ]}
        />
      </article>
    </section>
  );
}
