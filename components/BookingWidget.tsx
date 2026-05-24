"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { formatInr, nightsBetween } from "@/lib/format";
import { RoomSelector, type RoomWithAvailability } from "./RoomSelector";
import { WhatsAppButton } from "./WhatsAppButton";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Props = {
  farmhouseId: string;
  farmhouseTitle: string;
  ownerPhone?: string | null;
  rooms: RoomWithAvailability[];
  blockedRanges: { checkIn: string; checkOut: string }[];
};

export function BookingWidget({
  farmhouseId,
  farmhouseTitle,
  ownerPhone,
  rooms,
  blockedRanges,
}: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) return;
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  // Days disabled on the date picker: past dates + farmhouse-wide blocks
  const disabledDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [
      { before: today },
      ...blockedRanges.map((b) => ({
        from: new Date(b.checkIn),
        to: new Date(new Date(b.checkOut).getTime() - 24 * 60 * 60 * 1000),
      })),
    ];
  }, [blockedRanges]);

  const nights = range?.from && range?.to ? nightsBetween(range.from, range.to) : 0;

  const selectedRooms = rooms.filter((r) => selectedRoomIds.includes(r.id));
  const subtotalPerNight = selectedRooms.reduce((sum, r) => sum + r.pricePerNight, 0);
  const totalCapacity = selectedRooms.reduce((sum, r) => sum + r.capacity, 0);
  const total = nights * subtotalPerNight;

  async function handleBook() {
    setError(null);
    if (status !== "authenticated") {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!range?.from || !range?.to) {
      setError("Please select check-in and check-out dates.");
      return;
    }
    if (nights < 1) {
      setError("Stay must be at least 1 night.");
      return;
    }
    if (selectedRoomIds.length === 0) {
      setError("Please select at least one room.");
      return;
    }
    if (guests < 1 || guests > totalCapacity) {
      setError(`Selected rooms can hold up to ${totalCapacity} guests.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmhouseId,
          roomIds: selectedRoomIds,
          checkIn: range.from.toISOString(),
          checkOut: range.to.toISOString(),
          guests,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create booking.");
        setLoading(false);
        return;
      }

      const { bookingId, order, razorpayKeyId } = data;

      if (!window.Razorpay || !order || !razorpayKeyId) {
        const confirm = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId, mock: true }),
        });
        if (confirm.ok) {
          router.push("/bookings?confirmed=" + bookingId);
        } else {
          setError("Payment provider unavailable. Booking saved as PENDING.");
          router.push("/bookings");
        }
        return;
      }

      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        name: "Karjat Farms",
        description: `Booking ${bookingId}`,
        prefill: {
          name: session.user?.name ?? "",
          email: session.user?.email ?? "",
        },
        theme: { color: "#15803d" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const verify = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId, ...response }),
          });
          if (verify.ok) {
            router.push("/bookings?confirmed=" + bookingId);
          } else {
            const err = await verify.json();
            setError(err.error ?? "Payment verification failed.");
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
      rzp.open();
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="card p-5 sticky top-20">
      <div className="rounded-md border border-stone-200 p-2 mb-4">
        <DayPicker
          mode="range"
          numberOfMonths={1}
          selected={range}
          onSelect={setRange}
          disabled={disabledDays}
        />
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-stone-900 mb-2">Pick your rooms</h3>
        <RoomSelector
          rooms={rooms}
          selectedIds={selectedRoomIds}
          onChange={setSelectedRoomIds}
          checkIn={range?.from}
          checkOut={range?.to}
        />
      </div>

      <div className="mb-3">
        <label className="label">Guests</label>
        <input
          type="number"
          min={1}
          max={Math.max(1, totalCapacity)}
          value={guests}
          onChange={(e) => setGuests(parseInt(e.target.value, 10) || 1)}
          className="input"
        />
        <p className="text-xs text-stone-500 mt-1">
          {selectedRooms.length === 0
            ? "Pick a room to see capacity"
            : `Selected rooms hold up to ${totalCapacity} guests`}
        </p>
      </div>

      {nights > 0 && selectedRooms.length > 0 && (
        <div className="border-t border-stone-200 pt-3 mb-3 space-y-1 text-sm">
          {selectedRooms.map((r) => (
            <div key={r.id} className="flex justify-between text-xs text-stone-600">
              <span>{r.name} · {formatInr(r.pricePerNight)} × {nights}</span>
              <span>{formatInr(r.pricePerNight * nights)}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold text-base pt-2 border-t border-stone-100">
            <span>Total ({nights} {nights === 1 ? "night" : "nights"})</span>
            <span>{formatInr(total)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm p-2">
          {error}
        </div>
      )}

      <button
        onClick={handleBook}
        disabled={loading || nights < 1 || selectedRoomIds.length === 0}
        className="btn-primary w-full py-3 text-base"
      >
        {loading
          ? "Processing…"
          : status === "authenticated"
            ? selectedRoomIds.length > 0
              ? `Reserve ${selectedRoomIds.length} room${selectedRoomIds.length > 1 ? "s" : ""}`
              : "Select a room"
            : "Login to book"}
      </button>

      <p className="text-xs text-stone-500 text-center mt-2">You won&apos;t be charged yet</p>

      {ownerPhone && (
        <>
          <div className="my-4 flex items-center gap-3 text-xs text-stone-400">
            <span className="flex-1 h-px bg-stone-200" />
            <span>or</span>
            <span className="flex-1 h-px bg-stone-200" />
          </div>
          <WhatsAppButton
            phone={ownerPhone}
            farmhouseTitle={farmhouseTitle}
            className="w-full py-3 text-base"
          />
          <p className="text-xs text-stone-500 text-center mt-2">Ask the host directly</p>
        </>
      )}
    </div>
  );
}
