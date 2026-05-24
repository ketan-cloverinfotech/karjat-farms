"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PhotoUpload } from "./PhotoUpload";
import { AmenitiesPicker } from "./AmenitiesPicker";

export type FarmhouseFormData = {
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  houseRules: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  directions: string;
  mapsQuery: string;
};

type Props = {
  initial?: Partial<FarmhouseFormData> & { id?: string };
  mode: "create" | "edit";
};

const defaults: FarmhouseFormData = {
  title: "",
  description: "",
  location: "",
  pricePerNight: 5000,
  maxGuests: 6,
  bedrooms: 2,
  bathrooms: 2,
  amenities: ["Private Pool", "Wi-Fi", "AC Bedrooms", "Parking"],
  images: [],
  houseRules: "",
  checkInTime: "2:00 PM",
  checkOutTime: "11:00 AM",
  cancellationPolicy: "Moderate",
  directions: "",
  mapsQuery: "",
};

export function FarmhouseForm({ initial, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FarmhouseFormData>({
    ...defaults,
    ...initial,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.images.length === 0) {
      setError("Please add at least one photo.");
      return;
    }
    if (form.amenities.length === 0) {
      setError("Please pick at least one amenity.");
      return;
    }

    setLoading(true);
    const payload = {
      ...form,
      pricePerNight: Number(form.pricePerNight),
      maxGuests: Number(form.maxGuests),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
    };

    const url =
      mode === "create"
        ? "/api/owner/farmhouses"
        : `/api/owner/farmhouses/${initial!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save.");
      return;
    }
    router.push("/admin/farmhouses");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      <Section title="Basics">
        <Field label="Title">
          <input
            required
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Green Valley Retreat"
          />
        </Field>
        <Field label="Location">
          <input
            required
            placeholder="e.g. Kondhane, Karjat"
            className="input"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <textarea
            required
            rows={4}
            className="input"
            placeholder="Describe what makes this property special — views, layout, vibe…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
      </Section>

      <Section title="Property details">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Price / night (₹)">
            <input
              type="number"
              min={500}
              required
              className="input"
              value={form.pricePerNight}
              onChange={(e) => setForm({ ...form, pricePerNight: Number(e.target.value) })}
            />
          </Field>
          <Field label="Max guests">
            <input
              type="number"
              min={1}
              required
              className="input"
              value={form.maxGuests}
              onChange={(e) => setForm({ ...form, maxGuests: Number(e.target.value) })}
            />
          </Field>
          <Field label="Bedrooms">
            <input
              type="number"
              min={1}
              required
              className="input"
              value={form.bedrooms}
              onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })}
            />
          </Field>
          <Field label="Bathrooms">
            <input
              type="number"
              min={1}
              required
              className="input"
              value={form.bathrooms}
              onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })}
            />
          </Field>
        </div>
      </Section>

      <Section title="Photos" subtitle="The first image is used as the cover. Drag to reorder.">
        <PhotoUpload
          value={form.images}
          onChange={(images) => setForm({ ...form, images })}
        />
      </Section>

      <Section title="Amenities" subtitle="Tick what's available at your property.">
        <AmenitiesPicker
          value={form.amenities}
          onChange={(amenities) => setForm({ ...form, amenities })}
        />
      </Section>

      <Section title="Guest information" subtitle="Optional — shown on the booking page.">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Check-in time">
            <input
              className="input"
              placeholder="2:00 PM"
              value={form.checkInTime}
              onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}
            />
          </Field>
          <Field label="Check-out time">
            <input
              className="input"
              placeholder="11:00 AM"
              value={form.checkOutTime}
              onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Cancellation policy">
          <select
            className="input"
            value={form.cancellationPolicy}
            onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })}
          >
            <option value="Flexible">Flexible — full refund up to 24 hours before check-in</option>
            <option value="Moderate">Moderate — full refund up to 5 days before check-in</option>
            <option value="Strict">Strict — 50% refund up to 7 days before check-in</option>
            <option value="Non-refundable">Non-refundable</option>
          </select>
        </Field>
        <Field label="House rules">
          <textarea
            rows={3}
            className="input"
            placeholder={"e.g. No loud music after 10 PM\nNo smoking indoors\nMaximum 2 cars"}
            value={form.houseRules}
            onChange={(e) => setForm({ ...form, houseRules: e.target.value })}
          />
        </Field>
        <Field label="Google Maps location (for the embed + directions button)">
          <input
            className="input"
            placeholder="e.g. Lakeview Lodge, Morbe, Karjat — or paste a Google Maps URL or 'lat,long'"
            value={form.mapsQuery}
            onChange={(e) => setForm({ ...form, mapsQuery: e.target.value })}
          />
          <p className="text-xs text-stone-500 mt-1">
            Leave blank to auto-use the property location. More precise queries (with landmark/area) give better pins and directions.
          </p>
        </Field>
        <Field label="How to reach / extra directions notes">
          <textarea
            rows={3}
            className="input"
            placeholder="e.g. 5 km from Karjat railway station. Auto-rickshaws available. Pin location shared after booking."
            value={form.directions}
            onChange={(e) => setForm({ ...form, directions: e.target.value })}
          />
        </Field>
      </Section>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving…" : mode === "create" ? "Create farmhouse" : "Save changes"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-stone-900">{title}</h3>
        {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
