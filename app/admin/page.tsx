import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const session = await auth();
  const ownerId = session!.user.id;

  const [farmhouseCount, bookings] = await Promise.all([
    prisma.farmhouse.count({ where: { ownerId } }),
    prisma.booking.findMany({
      where: { farmhouse: { ownerId } },
      include: { farmhouse: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const confirmedRevenue = await prisma.booking.aggregate({
    where: {
      farmhouse: { ownerId },
      status: "CONFIRMED",
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="My farmhouses" value={farmhouseCount.toString()} />
        <Stat label="Confirmed bookings" value={(confirmedRevenue._count ?? 0).toString()} />
        <Stat label="Confirmed revenue" value={formatInr(confirmedRevenue._sum.totalAmount ?? 0)} />
      </div>

      <div className="flex gap-3">
        <Link href="/admin/farmhouses/new" className="btn-primary">+ Add a farmhouse</Link>
        <Link href="/admin/bookings" className="btn-outline">View all bookings</Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-stone-900 mb-3">Recent bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-stone-500 text-sm">No bookings yet.</p>
        ) : (
          <div className="card divide-y divide-stone-200">
            {bookings.map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-900">{b.farmhouse.title}</p>
                  <p className="text-xs text-stone-500">
                    {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()} · {b.guests} guests
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatInr(b.totalAmount)}</p>
                  <p className="text-xs text-stone-500">{b.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="text-2xl font-bold text-stone-900 mt-1">{value}</p>
    </div>
  );
}
