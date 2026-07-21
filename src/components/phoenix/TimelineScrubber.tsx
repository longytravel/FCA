"use client";

import { useEffect, useRef } from "react";
import { FCA, fmtMs } from "./graph-utils";

export type FineMark = { ms: number; label: string };

export default function TimelineScrubber({
  min,
  max,
  value,
  active,
  playing,
  fineMarks,
  onChange,
  onTogglePlay,
  onToggleActive,
}: {
  min: number;
  max: number;
  value: number;
  active: boolean;
  playing: boolean;
  fineMarks: FineMark[];
  onChange: (ms: number) => void;
  onTogglePlay: () => void;
  onToggleActive: (active: boolean) => void;
}) {
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);

  // Advance the scrubber while playing (~ full span in 12s).
  useEffect(() => {
    if (!playing) {
      if (raf.current) cancelAnimationFrame(raf.current);
      return;
    }
    const span = Math.max(1, max - min);
    const step = span / (12 * 60); // per frame at 60fps
    const tick = (t: number) => {
      if (!last.current) last.current = t;
      last.current = t;
      const next = value + step * 1.0;
      if (next >= max) {
        onChange(max);
        onTogglePlay();
        return;
      }
      onChange(next);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, value]);

  const span = Math.max(1, max - min);
  const pct = ((value - min) / span) * 100;

  return (
    <div className="border-t border-[#d2d2d4] bg-white px-3 py-2">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1 text-[12px] text-[#3f3f3f]">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => onToggleActive(e.target.checked)}
            className="accent-[#6c1d45]"
          />
          Timeline replay
        </label>
        <button
          onClick={onTogglePlay}
          disabled={!active}
          className="border border-[#6c1d45] bg-[#6c1d45] px-3 py-1 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:border-[#d2d2d4] disabled:bg-[#d2d2d4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c1d45]"
        >
          {playing ? "❚❚ Pause" : "▶ Play"}
        </button>
        <span className="tabular-nums text-[13px] font-bold text-[#6c1d45]">
          {active ? fmtMs(value) : "All time"}
        </span>
      </div>

      <div className="relative mt-2">
        {/* fine-date markers */}
        <div className="pointer-events-none absolute inset-x-0 top-[6px] h-3">
          {fineMarks.map((m, i) => {
            const p = ((m.ms - min) / span) * 100;
            if (p < 0 || p > 100) return null;
            return (
              <span
                key={i}
                title={m.label}
                className="absolute top-0 h-3 w-[2px]"
                style={{ left: `${p}%`, background: FCA.coral }}
              />
            );
          })}
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          step={Math.max(1, Math.floor(span / 500))}
          disabled={!active}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-[#6c1d45] disabled:opacity-40"
          aria-label="Timeline date"
        />
        <div className="flex justify-between text-[11px] text-[#75767a]">
          <span>{fmtMs(min)}</span>
          <span style={{ marginLeft: `${Math.min(90, Math.max(0, pct - 5))}%` }} className="sr-only">
            current
          </span>
          <span>{fmtMs(max)}</span>
        </div>
      </div>
      {active ? (
        <p className="mt-1 text-[11px] text-[#75767a]">
          Coral ticks mark FCA fine dates. Nodes and directorships appear as the network was built
          up to the selected month.
        </p>
      ) : null}
    </div>
  );
}
