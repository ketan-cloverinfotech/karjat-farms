import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseFarmhouse } from "@/lib/farmhouse";
import { FarmhouseForm } from "@/components/FarmhouseForm";

export default async function EditFarmhousePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const row = await prisma.farmhouse.findUnique({ where: { id } });
  if (!row) notFound();
  if (row.ownerId !== session!.user.id) redirect("/admin/farmhouses");
  const f = parseFarmhouse(row);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-stone-900">Edit {f.title}</h2>
      <FarmhouseForm
        mode="edit"
        initial={{
          id: f.id,
          title: f.title,
          description: f.description,
          location: f.location,
          pricePerNight: f.pricePerNight,
          maxGuests: f.maxGuests,
          bedrooms: f.bedrooms,
          bathrooms: f.bathrooms,
          amenities: f.amenities,
          images: f.images,
          houseRules: row.houseRules ?? "",
          checkInTime: row.checkInTime ?? "2:00 PM",
          checkOutTime: row.checkOutTime ?? "11:00 AM",
          cancellationPolicy: row.cancellationPolicy ?? "Moderate",
          directions: row.directions ?? "",
          mapsQuery: row.mapsQuery ?? "",
        }}
      />
    </div>
  );
}
