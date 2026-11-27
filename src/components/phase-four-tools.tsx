"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity */

import { useEffect, useState } from "react";

const KEY = "training-tracker-phase4";
type Data = { goal: string; goalDate: string; reminder: string; water: string; protein: string; calories: string };
const empty: Data = { goal: "", goalDate: "", reminder: "", water: "", protein: "", calories: "" };

function usePhaseFour() {
  const [data, setData] = useState<Data>(empty);
  useEffect(() => { try { setData({ ...empty, ...JSON.parse(localStorage.getItem(KEY) || "{}") }); } catch { /* ignore invalid local data */ } }, []);
  function update(next: Partial<Data>) { setData((current) => { const value = { ...current, ...next }; localStorage.setItem(KEY, JSON.stringify(value)); return value; }); }
  return { data, update };
}

export function GoalCountdown() {
  const { data } = usePhaseFour();
  if (!data.goal || !data.goalDate) return null;
  // Countdown is intentionally calculated in the browser so it reflects the current day.
  const days = Math.max(0, Math.ceil((new Date(`${data.goalDate}T00:00:00`).getTime() - Date.now()) / 86400000));
  return <section className="card mt-3 flex items-center justify-between gap-4 px-4 py-3.5"><div><p className="text-xs font-semibold uppercase tracking-wider text-accent">Goal countdown</p><p className="mt-1 text-sm text-muted">{data.goal}</p></div><p className="text-right text-2xl font-semibold tabular-nums text-ink">{days}<span className="ml-1 text-xs font-medium text-muted">days</span></p></section>;
}

export function PhaseFourSettings() {
  const { data, update } = usePhaseFour();
  return <>
    <section className="card mt-4 space-y-3 px-4 py-4"><div><h2 className="text-sm font-semibold text-ink">Goal countdown</h2><p className="mt-1 text-xs text-muted">Set a target date for an event or performance goal.</p></div><input value={data.goal} onChange={(e) => update({ goal: e.target.value })} placeholder="e.g. Rugby season opener" className="field" /><input type="date" value={data.goalDate} onChange={(e) => update({ goalDate: e.target.value })} className="field h-11 min-h-11 py-0" /><label className="block text-xs text-muted">Reminder time<input type="time" value={data.reminder} onChange={(e) => update({ reminder: e.target.value })} className="field mt-1 h-11 min-h-11 py-0" /></label></section>
    <section className="card mt-4 space-y-3 px-4 py-4"><div><h2 className="text-sm font-semibold text-ink">Today’s nutrition</h2><p className="mt-1 text-xs text-muted">A simple daily record; values stay on this device.</p></div><div className="grid grid-cols-3 gap-2"><label className="text-xs text-muted">Water (L)<input inputMode="decimal" value={data.water} onChange={(e) => update({ water: e.target.value })} className="field mt-1 h-11 min-h-11 py-0" /></label><label className="text-xs text-muted">Protein (g)<input inputMode="numeric" value={data.protein} onChange={(e) => update({ protein: e.target.value })} className="field mt-1 h-11 min-h-11 py-0" /></label><label className="text-xs text-muted">Calories<input inputMode="numeric" value={data.calories} onChange={(e) => update({ calories: e.target.value })} className="field mt-1 h-11 min-h-11 py-0" /></label></div></section>
  </>;
}
