"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteFarmhouseButton({ farmhouseId }: { farmhouseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!confirm("Delete this farmhouse? Active bookings will be cancelled.")) return;
    setLoading(true);
    const res = await fetch(`/api/owner/farmhouses/${farmhouseId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Could not delete.");
    }
  }

  return (
    <button onClick={onClick} disabled={loading} className="btn-outline text-red-700 border-red-300 hover:bg-red-50">
      {loading ? "…" : "Delete"}
    </button>
  );
}
