import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatInr, nightsBetween } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OwnerBookingsPage() {
  const session = await auth();
  const bookings = await prisma.booking.findMany({
    where: { farmhouse: { ownerId: session!.user.id } },
    include: {
      farmhouse: { select: { title: true } },
      user: { select: { name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-stone-900">All Bookings</h2>

      {bookings.length === 0 ? (
        <div className="card p-10 text-center text-stone-500">No bookings yet.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Farmhouse</th>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Guests</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-medium text-stone-900">{b.farmhouse.title}</td>
                  <td className="px-4 py-3">
                    <div>{b.user.name}</div>
                    <div className="text-xs text-stone-500">{b.user.email}</div>
                    {b.user.phone && <div className="text-xs text-stone-500">{b.user.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div>{formatDate(b.checkIn)}</div>
                    <div className="text-xs text-stone-500">
                      → {formatDate(b.checkOut)} ({nightsBetween(b.checkIn, b.checkOut)}n)
                    </div>
                  </td>
                  <td className="px-4 py-3">{b.guests}</td>
                  <td className="px-4 py-3 font-medium">{formatInr(b.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  return <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${cls}`}>{status}</span>;
}
