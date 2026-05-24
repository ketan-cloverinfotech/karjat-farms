import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatInr, nightsBetween } from "@/lib/format";
import { CancelBookingButton } from "@/components/CancelBookingButton";

export const dynamic = "force-dynamic";

export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/bookings");
  }
  const sp = await searchParams;

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { farmhouse: { select: { title: true, slug: true, location: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-stone-900 mb-6">My Bookings</h1>

      {sp.confirmed && (
        <div className="mb-6 rounded-md bg-green-50 border border-green-200 text-green-800 p-4">
          ✓ Your booking is confirmed! Reference: <span className="font-mono text-xs">{sp.confirmed}</span>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-stone-600 mb-4">You haven&apos;t booked anything yet.</p>
          <Link href="/farmhouses" className="btn-primary">Browse farmhouses</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <Link
                  href={`/farmhouses/${b.farmhouse.slug}`}
                  className="text-lg font-semibold text-stone-900 hover:underline"
                >
                  {b.farmhouse.title}
                </Link>
                <p className="text-sm text-stone-500">📍 {b.farmhouse.location}</p>
                <div className="mt-2 text-sm text-stone-700">
                  <span>📅 {formatDate(b.checkIn)} → {formatDate(b.checkOut)}</span>
                  <span className="text-stone-400 mx-2">·</span>
                  <span>{nightsBetween(b.checkIn, b.checkOut)} nights</span>
                  <span className="text-stone-400 mx-2">·</span>
                  <span>{b.guests} guests</span>
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-semibold">{formatInr(b.totalAmount)}</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
              {b.status !== "CANCELLED" && <CancelBookingButton bookingId={b.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "CONFIRMED"
      ? "bg-green-100 text-green-800"
      : status === "PENDING"
        ? "bg-amber-100 text-amber-800"
        : "bg-stone-100 text-stone-600";
  return <span className={`ml-3 text-xs font-medium rounded-full px-2 py-0.5 ${cls}`}>{status}</span>;
}
