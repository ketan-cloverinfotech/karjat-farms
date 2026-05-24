import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RoomsManager } from "@/components/RoomsManager";

export const dynamic = "force-dynamic";

export default async function RoomsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const farmhouse = await prisma.farmhouse.findUnique({
    where: { id },
    include: { rooms: { orderBy: { displayOrder: "asc" } } },
  });
  if (!farmhouse) notFound();
  if (farmhouse.ownerId !== session!.user.id) redirect("/admin/farmhouses");

  const rooms = farmhouse.rooms.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    capacity: r.capacity,
    pricePerNight: r.pricePerNight,
    displayOrder: r.displayOrder,
  }));

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/farmhouses" className="text-sm text-stone-500 hover:underline">
          ← My Farmhouses
        </Link>
        <h2 className="text-xl font-semibold text-stone-900 mt-1">Rooms — {farmhouse.title}</h2>
        <p className="text-sm text-stone-500 mt-1">
          Guests can book each room independently. Total capacity: {farmhouse.maxGuests} ·{" "}
          {farmhouse.bedrooms} bedrooms in the property.
        </p>
      </div>
      <RoomsManager
        farmhouseId={farmhouse.id}
        rooms={rooms}
        fallbackPrice={Math.max(500, Math.floor(farmhouse.pricePerNight / Math.max(1, farmhouse.bedrooms)))}
        fallbackCapacity={Math.max(1, Math.ceil(farmhouse.maxGuests / Math.max(1, farmhouse.bedrooms)))}
      />
    </div>
  );
}
