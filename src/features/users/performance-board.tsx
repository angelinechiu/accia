"use client";

import type { Document } from "@/types";

const BLUE = "#0095eb";
const BLUE_FILL = "#b9dcff";
const AMBER = "#ff8c1a";
const CORAL = "#f04438";
const CORAL_FILL = "#ffc7c2";
const GREEN = "#12b76a";
const VIOLET = "#7a5af8";
const TEAL = "#15b8a6";

function Spark({ values, color, fill }: { values: number[]; color: string; fill: string }) {
  const hi = Math.max(...values, 1);
  const lo = Math.min(...values, 0);
  const span = hi - lo || 1;
  const width = 320;
  const height = 120;
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - 10 - ((value - lo) / span) * (height - 22);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="acct-spark" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polygon points={`${points} ${width},${height} 0,${height}`} fill={fill} />
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

const OPEN = new Set(["UPLOADED", "QUEUED", "PROCESSING"]);

function dayKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 10) / 10;
}

export function AccountantBoard({
  docs,
  openExceptions,
  completed,
  processing,
}: {
  docs: Document[];
  openExceptions: number;
  completed: number;
  processing: number;
}) {
  const queued = docs.filter((doc) => ["QUEUED", "UPLOADED"].includes(doc.status)).length;
  const running = docs.filter((doc) => doc.status === "PROCESSING").length;
  const failed = docs.filter((doc) => doc.status === "FAILED").length;
  const ready = Math.max(0, docs.length - queued - running - failed);
  const finished = docs.filter((doc) => !OPEN.has(doc.status));
  const clean = finished.filter((doc) => doc.status !== "FAILED" && doc.status !== "EXCEPTION");
  const accuracy = percent(clean.length, finished.length);
  const exceptionRate = percent(openExceptions, docs.length);
  const reduction = percent(completed, docs.length);
  const averageSeconds = finished.length
    ? Math.round((finished.reduce((sum, doc) => sum + doc.seconds, 0) / finished.length) * 10) / 10
    : 0;
  const grouped = new Map<string, number>();
  for (const doc of docs) {
    const key = dayKey(doc.createdAt);
    if (!key) continue;
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }
  const days = [...grouped.keys()].sort().slice(-7);
  const series = (days.length ? days : ["today"]).map((key) => ({
    label: key === "today" ? "Now" : key.slice(8),
    value: grouped.get(key) ?? 0,
  }));
  const accuracySeries = series.map((point) => (point.value ? accuracy : 0));
  const exceptionSeries = series.map((point) => (point.value ? exceptionRate : 0));

  return (
    <section className="acct-board" aria-label="Processing performance">
      <article className="acct-tile" style={{ ["--tile" as string]: BLUE }}>
        <h3>Extraction accuracy</h3>
        <strong>{finished.length ? `${accuracy}%` : "—"}</strong>
        <p>Target ≥ 95% · from your documents</p>
        <Spark values={accuracySeries} color={BLUE} fill={BLUE_FILL} />
      </article>
      <article className="acct-tile" style={{ ["--tile" as string]: AMBER }}>
        <h3>Avg. processing time</h3>
        <strong>{finished.length ? `${averageSeconds}s` : "—"}</strong>
        <p>Target ≤ 20 sec</p>
        <Meter value={averageSeconds} limit={20} unit="s" color={AMBER} />
      </article>
      <article className="acct-tile" style={{ ["--tile" as string]: CORAL }}>
        <h3>Exception rate</h3>
        <strong>{docs.length ? `${exceptionRate}%` : "—"}</strong>
        <p>{"Target < 10%"}</p>
        <Spark values={exceptionSeries} color={CORAL} fill={CORAL_FILL} />
      </article>
      <article className="acct-tile" style={{ ["--tile" as string]: GREEN }}>
        <h3>Manual entry reduction</h3>
        <strong>{docs.length ? `${reduction}%` : "—"}</strong>
        <p>Target ≥ 70% · completed without retyping</p>
        <Meter value={reduction} limit={100} unit="%" color={GREEN} />
      </article>
      <article className="acct-tile wide" style={{ ["--tile" as string]: TEAL }}>
        <h3>Documents processed</h3>
        <strong>{docs.length}</strong>
        <p>Updates on its own when a document is added or finished</p>
        <Bars
          colors={[TEAL, BLUE, VIOLET, AMBER, GREEN, CORAL, "#38bdf8"]}
          items={series}
        />
      </article>
      <article className="acct-tile wide" style={{ ["--tile" as string]: VIOLET }}>
        <h3>Your documents now</h3>
        <strong>{docs.length}</strong>
        <p>
          {processing} still running · {openExceptions} need review · {completed} completed
        </p>
        <Donut
          items={[
            { label: "Queue", value: queued, color: AMBER },
            { label: "Running", value: running, color: BLUE },
            { label: "Ready", value: ready, color: GREEN },
            { label: "Failed", value: failed, color: CORAL },
          ]}
        />
      </article>
    </section>
  );
}
