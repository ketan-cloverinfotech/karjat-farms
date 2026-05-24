import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseFarmhouse } from "@/lib/farmhouse";
import { formatInr } from "@/lib/format";
import { DeleteFarmhouseButton } from "@/components/DeleteFarmhouseButton";

export const dynamic = "force-dynamic";

export default async function OwnerFarmhousesPage() {
  const session = await auth();
  const rows = await prisma.farmhouse.findMany({
    where: { ownerId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });
  const farmhouses = rows.map(parseFarmhouse);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-stone-900">My Farmhouses</h2>
        <Link href="/admin/farmhouses/new" className="btn-primary">+ Add new</Link>
      </div>

      {farmhouses.length === 0 ? (
        <div className="card p-10 text-center text-stone-500">
          You haven&apos;t listed any farmhouses yet.
        </div>
      ) : (
        <div className="card divide-y divide-stone-200">
          {farmhouses.map((f) => (
            <div key={f.id} className="p-4 flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-md overflow-hidden bg-stone-100 flex-shrink-0">
                {f.images[0] && (
                  <Image src={f.images[0]} alt="" fill className="object-cover" sizes="80px" unoptimized />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/farmhouses/${f.slug}`} className="font-semibold text-stone-900 hover:underline truncate block">
                  {f.title}
                </Link>
                <p className="text-sm text-stone-500 truncate">{f.location}</p>
                <p className="text-sm text-stone-700 mt-1">
                  {formatInr(f.pricePerNight)}/night · {f.bedrooms} BR · up to {f.maxGuests}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <Link href={`/admin/farmhouses/${f.id}/rooms`} className="btn-outline">Rooms</Link>
                <Link href={`/admin/farmhouses/${f.id}/availability`} className="btn-outline">Dates</Link>
                <Link href={`/admin/farmhouses/${f.id}/edit`} className="btn-outline">Edit</Link>
                <DeleteFarmhouseButton farmhouseId={f.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
