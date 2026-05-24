"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!confirm("Cancel this booking? This cannot be undone.")) return;
    setLoading(true);
    const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.refresh();
    else alert("Could not cancel booking.");
  }

  return (
    <button onClick={onClick} disabled={loading} className="btn-outline text-red-700 border-red-300 hover:bg-red-50">
      {loading ? "Cancelling…" : "Cancel"}
    </button>
  );
}
