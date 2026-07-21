"use client";

/**
 * charts.tsx — Recharts wrappers with elegant, on-brand defaults. TEMPLATE.
 *
 * Three drop-in components:
 *   <TimeSeriesChart />  — trend over time (area/line)
 *   <LeagueTable />      — horizontal bar ranking (top N)
 *   <StatCard /> / <StatGrid /> — headline KPI tiles
 *
 * Install:  npm i recharts
 * Colours match the site tokens (teal accent on slate). Fully responsive.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TEAL = "#2dd4bf";
const BLUE = "#3b82f6";
const GRID = "rgba(255,255,255,0.06)";
const AXIS = "rgba(255,255,255,0.45)";

const tooltipStyle = {
  background: "#0b1220",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#e2e8f0",
  fontSize: 12,
} as const;

function Panel({ title, subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-ink-2/60 p-4">
      {title && <h3 className="text-sm font-bold text-text">{title}</h3>}
      {subtitle && <p className="text-xs text-muted mt-0.5 mb-3">{subtitle}</p>}
      {!subtitle && title && <div className="mb-3" />}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 1. Time series
 * ------------------------------------------------------------------ */

export function TimeSeriesChart({
  data,
  xKey,
  yKey,
  title,
  subtitle,
  height = 260,
  color = TEAL,
  valueFormatter,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  title?: string;
  subtitle?: string;
  height?: number;
  color?: string;
  valueFormatter?: (v: number) => string;
}) {
  return (
    <Panel title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey={xKey} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fill: AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={valueFormatter ? (v) => valueFormatter(Number(v)) : undefined}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: color, strokeOpacity: 0.3 }}
            formatter={valueFormatter ? (v: number | string) => valueFormatter(Number(v)) : undefined}
          />
          <Area type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} fill={`url(#grad-${yKey})`} />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}

/* ------------------------------------------------------------------ *
 * 2. League table (horizontal bar ranking)
 * ------------------------------------------------------------------ */

export function LeagueTable({
  data,
  labelKey,
  valueKey,
  title,
  subtitle,
  topN = 10,
  height,
  valueFormatter,
}: {
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  title?: string;
  subtitle?: string;
  topN?: number;
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  const rows = [...data]
    .sort((a, b) => Number(b[valueKey]) - Number(a[valueKey]))
    .slice(0, topN);
  const h = height ?? Math.max(180, rows.length * 34 + 24);

  return (
    <Panel title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={valueFormatter ? (v) => valueFormatter(Number(v)) : undefined}
          />
          <YAxis
            type="category"
            dataKey={labelKey}
            tick={{ fill: "#cbd5e1", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={140}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            formatter={valueFormatter ? (v: number | string) => valueFormatter(Number(v)) : undefined}
          />
          <Bar dataKey={valueKey} radius={[0, 6, 6, 0]}>
            {rows.map((_, i) => (
              <Cell key={i} fill={i === 0 ? TEAL : i < 3 ? BLUE : "rgba(59,130,246,0.55)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

/* ------------------------------------------------------------------ *
 * 3. Stat cards
 * ------------------------------------------------------------------ */

export function StatCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { direction: "up" | "down"; value: string };
}) {
  return (
    <div className="rounded-2xl border border-line bg-ink-2/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1.5 text-2xl font-extrabold text-text tabular-nums">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {trend && (
          <span
            className={
              trend.direction === "up"
                ? "text-xs font-bold text-teal"
                : "text-xs font-bold text-rose-400"
            }
          >
            {trend.direction === "up" ? "▲" : "▼"} {trend.value}
          </span>
        )}
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{children}</div>;
}
