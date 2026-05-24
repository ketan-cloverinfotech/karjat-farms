"use client";

import { useState } from "react";

const COMMON_AMENITIES = [
  { label: "Private Pool", icon: "🏊" },
  { label: "Heated Pool", icon: "♨️" },
  { label: "Infinity Pool", icon: "♾️" },
  { label: "River Access", icon: "🌊" },
  { label: "Lake View", icon: "🏞️" },
  { label: "Wi-Fi", icon: "📶" },
  { label: "AC Bedrooms", icon: "❄️" },
  { label: "Parking", icon: "🅿️" },
  { label: "Barbecue", icon: "🍖" },
  { label: "Bonfire", icon: "🔥" },
  { label: "Caretaker", icon: "🧑‍🌾" },
  { label: "Chef on Request", icon: "🧑‍🍳" },
  { label: "Pet Friendly", icon: "🐾" },
  { label: "Indoor Games", icon: "🎲" },
  { label: "Gazebo", icon: "⛱️" },
  { label: "Kitchen Garden", icon: "🌱" },
  { label: "Outdoor Jacuzzi", icon: "🛁" },
  { label: "Trekking Trails", icon: "🥾" },
  { label: "Solar Power", icon: "☀️" },
  { label: "Hammocks", icon: "🛌" },
];

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

export function AmenitiesPicker({ value, onChange }: Props) {
  const [custom, setCustom] = useState("");
  const set = new Set(value);

  const commonLabels = new Set(COMMON_AMENITIES.map((a) => a.label));
  const customExtras = value.filter((a) => !commonLabels.has(a));

  function toggle(label: string) {
    const next = new Set(set);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    onChange(Array.from(next));
  }

  function addCustom() {
    const v = custom.trim();
    if (!v) return;
    if (!set.has(v)) onChange([...value, v]);
    setCustom("");
  }

  function removeCustom(label: string) {
    onChange(value.filter((a) => a !== label));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {COMMON_AMENITIES.map((a) => {
          const selected = set.has(a.label);
          return (
            <button
              key={a.label}
              type="button"
              onClick={() => toggle(a.label)}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-left transition-colors ${
                selected
                  ? "border-green-700 bg-green-50 text-green-900"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <span className="text-lg">{a.icon}</span>
              <span className="flex-1">{a.label}</span>
              {selected && <span className="text-green-700">✓</span>}
            </button>
          );
        })}
      </div>

      {customExtras.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customExtras.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 bg-stone-200 text-stone-800 text-xs rounded-full px-2.5 py-1"
            >
              {label}
              <button
                type="button"
                onClick={() => removeCustom(label)}
                className="text-stone-500 hover:text-stone-800"
                title="Remove"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add custom amenity (e.g. Yoga deck)"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          className="input flex-1"
        />
        <button type="button" onClick={addCustom} className="btn-outline">
          Add
        </button>
      </div>
    </div>
  );
}
