"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatInr } from "@/lib/format";

export type RoomRow = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  pricePerNight: number;
  displayOrder: number;
};

type Props = {
  farmhouseId: string;
  rooms: RoomRow[];
  fallbackPrice: number;
  fallbackCapacity: number;
};

const emptyDraft = (order: number, price: number, capacity: number) => ({
  name: `Room ${order + 1}`,
  description: "",
  capacity,
  pricePerNight: price,
});

export function RoomsManager({ farmhouseId, rooms, fallbackPrice, fallbackCapacity }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState(emptyDraft(rooms.length, fallbackPrice, fallbackCapacity));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<RoomRow>>({});

  async function addRoom(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/owner/farmhouses/${farmhouseId}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        description: draft.description || null,
        capacity: Number(draft.capacity),
        pricePerNight: Number(draft.pricePerNight),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not add room.");
      return;
    }
    setDraft(emptyDraft(rooms.length + 1, fallbackPrice, fallbackCapacity));
    router.refresh();
  }

  function startEdit(r: RoomRow) {
    setEditingId(r.id);
    setEditDraft({
      name: r.name,
      description: r.description ?? "",
      capacity: r.capacity,
      pricePerNight: r.pricePerNight,
    });
  }

  async function saveEdit(roomId: string) {
    setError(null);
    const res = await fetch(`/api/owner/rooms/${roomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editDraft.name,
        description: editDraft.description ?? null,
        capacity: Number(editDraft.capacity),
        pricePerNight: Number(editDraft.pricePerNight),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save.");
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function deleteRoom(roomId: string) {
    if (!confirm("Delete this room? Cannot be undone.")) return;
    const res = await fetch(`/api/owner/rooms/${roomId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not delete.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="card p-5">
        <h3 className="font-semibold text-stone-900 mb-1">Add a room</h3>
        <p className="text-xs text-stone-500 mb-3">
          Each room can be booked independently. Set per-room capacity and price.
        </p>
        <form onSubmit={addRoom} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Master Suite, Garden Room"
            />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <input
              className="input"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="King bed, attached bath, balcony…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Capacity (guests)</label>
              <input
                type="number"
                min={1}
                required
                className="input"
                value={draft.capacity}
                onChange={(e) => setDraft({ ...draft, capacity: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Price / night (₹)</label>
              <input
                type="number"
                min={100}
                step={100}
                required
                className="input"
                value={draft.pricePerNight}
                onChange={(e) => setDraft({ ...draft, pricePerNight: Number(e.target.value) })}
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Adding…" : "Add room"}
          </button>
        </form>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-stone-900 mb-3">Existing rooms ({rooms.length})</h3>
        {rooms.length === 0 ? (
          <p className="text-sm text-stone-500">No rooms yet. Add one from the left.</p>
        ) : (
          <ul className="divide-y divide-stone-200">
            {rooms.map((r) => (
              <li key={r.id} className="py-3">
                {editingId === r.id ? (
                  <div className="space-y-2">
                    <input
                      className="input text-sm"
                      value={editDraft.name ?? ""}
                      onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                    />
                    <input
                      className="input text-sm"
                      placeholder="Description"
                      value={editDraft.description ?? ""}
                      onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        className="input text-sm"
                        value={editDraft.capacity ?? 0}
                        onChange={(e) => setEditDraft({ ...editDraft, capacity: Number(e.target.value) })}
                      />
                      <input
                        type="number"
                        className="input text-sm"
                        value={editDraft.pricePerNight ?? 0}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, pricePerNight: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(r.id)} className="btn-primary text-xs">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn-outline text-xs">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-900">{r.name}</p>
                      {r.description && (
                        <p className="text-xs text-stone-500 mt-0.5">{r.description}</p>
                      )}
                      <p className="text-xs text-stone-600 mt-0.5">
                        👥 {r.capacity} · {formatInr(r.pricePerNight)}/night
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEdit(r)} className="btn-outline text-xs">
                        Edit
                      </button>
                      <button
                        onClick={() => deleteRoom(r.id)}
                        className="btn-outline text-xs text-red-700 border-red-300 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
