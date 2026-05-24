import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BlockedDatesManager } from "@/components/BlockedDatesManager";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const farmhouse = await prisma.farmhouse.findUnique({
    where: { id },
    include: {
      blockedDates: { orderBy: { startDate: "asc" } },
      bookings: {
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
        select: { checkIn: true, checkOut: true },
      },
    },
  });
  if (!farmhouse) notFound();
  if (farmhouse.ownerId !== session!.user.id) redirect("/admin/farmhouses");

  const blocks = farmhouse.blockedDates.map((b) => ({
    id: b.id,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    reason: b.reason,
  }));
  const bookedRanges = farmhouse.bookings.map((b) => ({
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/farmhouses" className="text-sm text-stone-500 hover:underline">
          ← My Farmhouses
        </Link>
        <h2 className="text-xl font-semibold text-stone-900 mt-1">
          Availability — {farmhouse.title}
        </h2>
      </div>
      <BlockedDatesManager
        farmhouseId={farmhouse.id}
        blocks={blocks}
        bookedRanges={bookedRanges}
      />
    </div>
  );
}
