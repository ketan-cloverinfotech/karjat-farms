"use client";

import { useMemo } from "react";
import { formatInr } from "@/lib/format";

export type RoomWithAvailability = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  pricePerNight: number;
  bookedRanges: { checkIn: string; checkOut: string }[];
};

type Props = {
  rooms: RoomWithAvailability[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  checkIn?: Date;
  checkOut?: Date;
};

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export function RoomSelector({ rooms, selectedIds, onChange, checkIn, checkOut }: Props) {
  const datesPicked = Boolean(checkIn && checkOut);

  const status = useMemo(() => {
    const map = new Map<string, "available" | "booked" | "unknown">();
    for (const r of rooms) {
      if (!datesPicked) {
        map.set(r.id, "unknown");
        continue;
      }
      const ci = checkIn!;
      const co = checkOut!;
      const isBooked = r.bookedRanges.some((b) =>
        rangesOverlap(ci, co, new Date(b.checkIn), new Date(b.checkOut))
      );
      map.set(r.id, isBooked ? "booked" : "available");
    }
    return map;
  }, [rooms, checkIn, checkOut, datesPicked]);

  const selected = new Set(selectedIds);

  function toggle(roomId: string) {
    if (status.get(roomId) === "booked") return;
    const next = new Set(selected);
    if (next.has(roomId)) next.delete(roomId);
    else next.add(roomId);
    onChange(Array.from(next));
  }

  return (
    <div className="space-y-3">
      {datesPicked && (
        <div className="flex items-center gap-4 text-xs text-stone-600">
          <Legend color="bg-white border border-stone-300" label="Available" />
          <Legend color="bg-green-700 border border-green-700" label="Selected" />
          <Legend color="bg-stone-200 border border-stone-300" label="Booked" />
        </div>
      )}
      {!datesPicked && (
        <p className="text-xs text-stone-500">Pick check-in & check-out dates above to see live availability.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {rooms.map((r) => {
          const s = status.get(r.id) ?? "unknown";
          const isSel = selected.has(r.id);
          const isBooked = s === "booked";

          const classes = isBooked
            ? "bg-stone-200 border-stone-300 text-stone-400 cursor-not-allowed"
            : isSel
              ? "bg-green-700 border-green-700 text-white cursor-pointer shadow-sm"
              : "bg-white border-stone-300 text-stone-800 hover:border-green-700 hover:bg-green-50 cursor-pointer";

          return (
            <button
              type="button"
              key={r.id}
              onClick={() => toggle(r.id)}
              disabled={isBooked}
              className={`relative rounded-md border p-3 text-left transition-colors ${classes}`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-semibold text-sm leading-tight">{r.name}</span>
                {isSel && !isBooked && <span className="text-xs">✓</span>}
                {isBooked && <span className="text-xs">✕</span>}
              </div>
              <p className={`text-xs mt-1 ${isSel && !isBooked ? "text-green-100" : "text-stone-500"}`}>
                👥 {r.capacity}
              </p>
              <p className={`text-xs font-medium mt-0.5 ${isSel && !isBooked ? "text-white" : "text-stone-700"}`}>
                {formatInr(r.pricePerNight)}/night
              </p>
            </button>
          );
        })}
      </div>

      {datesPicked && (
        <p className="text-xs text-stone-500">
          {rooms.filter((r) => status.get(r.id) === "available").length} of {rooms.length} rooms available for your dates
        </p>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded ${color}`} />
      {label}
    </span>
  );
}
