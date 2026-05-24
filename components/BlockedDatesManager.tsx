"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { formatDate } from "@/lib/format";

type Block = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
};

type Props = {
  farmhouseId: string;
  blocks: Block[];
  bookedRanges: { checkIn: string; checkOut: string }[];
};

export function BlockedDatesManager({ farmhouseId, blocks, bookedRanges }: Props) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabledDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [
      { before: today },
      ...bookedRanges.map((b) => ({
        from: new Date(b.checkIn),
        to: new Date(new Date(b.checkOut).getTime() - 86_400_000),
      })),
      ...blocks.map((b) => ({
        from: new Date(b.startDate),
        to: new Date(new Date(b.endDate).getTime() - 86_400_000),
      })),
    ];
  }, [blocks, bookedRanges]);

  async function addBlock() {
    setError(null);
    if (!range?.from || !range?.to) {
      setError("Select a date range.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/owner/farmhouses/${farmhouseId}/blocked-dates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: range.from.toISOString(),
        endDate: range.to.toISOString(),
        reason: reason.trim() || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not block dates.");
      return;
    }
    setRange(undefined);
    setReason("");
    router.refresh();
  }

  async function removeBlock(blockId: string) {
    if (!confirm("Unblock these dates?")) return;
    const res = await fetch(`/api/owner/blocked-dates/${blockId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="card p-5">
        <h3 className="font-semibold text-stone-900 mb-1">Block new dates</h3>
        <p className="text-xs text-stone-500 mb-3">
          Useful for personal use, maintenance, or off-season closures.
        </p>
        <div className="rounded-md border border-stone-200 p-2 mb-3">
          <DayPicker
            mode="range"
            numberOfMonths={1}
            selected={range}
            onSelect={setRange}
            disabled={disabledDays}
          />
        </div>
        <label className="label">Reason (optional)</label>
        <input
          className="input mb-3"
          placeholder="Maintenance, family stay…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2 mb-3">
            {error}
          </div>
        )}
        <button onClick={addBlock} disabled={loading} className="btn-primary w-full">
          {loading ? "Blocking…" : "Block these dates"}
        </button>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-stone-900 mb-3">Currently blocked</h3>
        {blocks.length === 0 ? (
          <p className="text-sm text-stone-500">No blocked dates.</p>
        ) : (
          <ul className="divide-y divide-stone-200">
            {blocks.map((b) => (
              <li key={b.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {formatDate(b.startDate)} → {formatDate(b.endDate)}
                  </p>
                  {b.reason && <p className="text-xs text-stone-500 mt-0.5">{b.reason}</p>}
                </div>
                <button
                  onClick={() => removeBlock(b.id)}
                  className="btn-outline text-red-700 border-red-300 hover:bg-red-50"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
