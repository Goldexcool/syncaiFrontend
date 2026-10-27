"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Close a popover on outside click or Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey, true); };
  }, [open, close]);
  return ref;
}

export type PickerOption = { value: string; label: string; icon?: ReactNode };

/** A dropdown that matches the app instead of the browser's native select. */
export function Picker({ value, options, onChange, label }: { value: string | undefined; options: PickerOption[]; onChange: (v: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useDismiss(open, () => setOpen(false));
  const listId = useId();
  const current = options.find((o) => o.value === value);

  function openList() {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }
  function pick(v: string) { setOpen(false); if (v !== value) onChange(v); }
  function onKey(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) { e.preventDefault(); openList(); return; }
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(options.length - 1, i + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    if (e.key === "Enter") { e.preventDefault(); pick(options[active].value); }
  }

  return <div className="picker" ref={ref}>
    <button type="button" className="picker__button" aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-label={label} onClick={() => (open ? setOpen(false) : openList())} onKeyDown={onKey}>
      {current?.icon}<span>{current?.label ?? "Choose…"}</span><span className="picker__chevron" aria-hidden="true">⌄</span>
    </button>
    {open ? <ul className="picker__menu" role="listbox" id={listId} aria-label={label}>
      {options.map((o, i) => <li key={o.value} role="option" aria-selected={o.value === value} className={`picker__option${i === active ? " is-active" : ""}`} onMouseEnter={() => setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o.value)}>
        {o.icon}<span>{o.label}</span>{o.value === value ? <span className="picker__check" aria-hidden="true">✓</span> : null}
      </li>)}
    </ul> : null}
  </div>;
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Due-date picker: quick choices plus a month grid. `value`/`onChange` use YYYY-MM-DD. */
export function DatePicker({ value, onChange, label }: { value: string | null; onChange: (v: string | null) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const selected = value ? new Date(`${value}T12:00:00`) : null;
  const [month, setMonth] = useState(() => new Date((selected ?? today).getFullYear(), (selected ?? today).getMonth(), 1));
  const ref = useDismiss(open, () => setOpen(false));

  function pick(v: string | null) { setOpen(false); if (v !== value) onChange(v); }
  const first = (month.getDay() + 6) % 7; // weeks start on Monday
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const shown = selected ? selected.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: selected.getFullYear() === today.getFullYear() ? undefined : "numeric" }) : "No due date";
  const overdue = selected && iso(selected) < iso(today);

  return <div className="picker" ref={ref}>
    <button type="button" className={`picker__button${overdue ? " is-overdue" : ""}`} aria-haspopup="dialog" aria-expanded={open} aria-label={label} onClick={() => setOpen((o) => !o)}>
      <span aria-hidden="true">◷</span><span>{shown}</span><span className="picker__chevron" aria-hidden="true">⌄</span>
    </button>
    {open ? <div className="picker__menu picker__menu--date" role="dialog" aria-label={label}>
      <div className="datepick__quick">
        {([["Today", 0], ["Tomorrow", 1], ["Next week", 7]] as const).map(([l, n]) => <button key={l} type="button" onClick={() => pick(iso(addDays(today, n)))}>{l}</button>)}
        {value ? <button type="button" onClick={() => pick(null)}>Clear</button> : null}
      </div>
      <div className="datepick__head">
        <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
        <strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
        <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="datepick__grid" role="grid">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => <span key={d} className="datepick__dow">{d}</span>)}
        {cells.map((d, i) => d ? <button key={i} type="button" aria-pressed={!!selected && iso(d) === iso(selected)}
          className={`datepick__day${iso(d) === iso(today) ? " is-today" : ""}${selected && iso(d) === iso(selected) ? " is-selected" : ""}`}
          onClick={() => pick(iso(d))}>{d.getDate()}</button> : <span key={i} />)}
      </div>
    </div> : null}
  </div>;
}
