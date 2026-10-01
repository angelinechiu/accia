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

function Spark({ values }: { values: number[] }) {
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
      <polyline points={points} />
    </svg>
  );
}

function Bars({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="acct-bars" aria-hidden="true">
      {items.map((item) => (
        <div key={item.label}>
          <i style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }} />
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  );
}

function Meter({ value, limit, unit }: { value: number; limit: number; unit: string }) {
  const width = Math.min(100, (value / limit) * 100);
  return (
    <div className="acct-meter">
      <span style={{ width: `${width}%` }} />
      <small>
        {value}
        {unit} of {limit}
        {unit}
      </small>
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

  return (
    <section className="acct-board" aria-label="Processing performance">
      <article className="acct-tile">
        <h3>Extraction accuracy</h3>
        <strong>{accuracy?.value ?? "—"}</strong>
        <p>Target {accuracy?.target ?? "≥ 95%"}</p>
        {series.length > 0 && <Spark values={series.map((point) => point.accuracy)} />}
      </article>
      <article className="acct-tile">
        <h3>Avg. processing time</h3>
        <strong>{time?.value ?? "—"}</strong>
        <p>Target {time?.target ?? "≤ 20 sec"}</p>
        <Meter value={numberFrom(time?.value, 8.7)} limit={20} unit="s" />
      </article>
      <article className="acct-tile">
        <h3>Exception rate</h3>
        <strong>{exceptions?.value ?? "—"}</strong>
        <p>Target {exceptions?.target ?? "< 10%"}</p>
        {series.length > 0 && <Spark values={series.map((point) => point.exceptions)} />}
      </article>
      <article className="acct-tile">
        <h3>Manual entry reduction</h3>
        <strong>{reduction?.value ?? "—"}</strong>
        <p>Target {reduction?.target ?? "≥ 70%"}</p>
        <Meter value={numberFrom(reduction?.value, 74.1)} limit={100} unit="%" />
      </article>
      <article className="acct-tile wide">
        <h3>Documents processed</h3>
        <strong>{series.reduce((sum, point) => sum + point.processed, 0) || docs.length}</strong>
        <p>This week, from the reference trend</p>
        <Bars
          items={series.map((point) => ({
            label: point.day.replace(" Sep", ""),
            value: point.processed,
          }))}
        />
      </article>
      <article className="acct-tile wide">
        <h3>Your documents now</h3>
        <strong>{docs.length}</strong>
        <p>
          {processing} still running · {openExceptions} need review · {completed} completed
        </p>
        <Bars
          items={[
            { label: "Queue", value: queued },
            { label: "Run", value: running },
            { label: "Ready", value: extracted },
            { label: "Failed", value: failed },
          ]}
        />
      </article>
    </section>
  );
}
