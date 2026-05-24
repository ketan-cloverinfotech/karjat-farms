import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseFarmhouse } from "@/lib/farmhouse";
import { BookingWidget } from "@/components/BookingWidget";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { LocationMap } from "@/components/LocationMap";
import { formatInr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FarmhouseDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await prisma.farmhouse.findUnique({
    where: { slug },
    include: {
      owner: { select: { name: true, phone: true } },
      rooms: {
        orderBy: { displayOrder: "asc" },
        include: {
          bookings: {
            where: {
              booking: { status: { in: ["PENDING", "CONFIRMED"] } },
            },
            include: {
              booking: { select: { checkIn: true, checkOut: true } },
            },
          },
        },
      },
      blockedDates: { select: { startDate: true, endDate: true } },
    },
  });

  if (!row) notFound();

  const f = parseFarmhouse(row);

  // Per-room booked ranges (used by RoomSelector to mark availability)
  const roomsWithAvailability = row.rooms.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    capacity: r.capacity,
    pricePerNight: r.pricePerNight,
    bookedRanges: r.bookings.map((br) => ({
      checkIn: br.booking.checkIn.toISOString(),
      checkOut: br.booking.checkOut.toISOString(),
    })),
  }));

  // Farmhouse-wide blocked dates (owner blocks) — disabled on the date picker
  const blockedRanges = row.blockedDates.map((b) => ({
    checkIn: b.startDate.toISOString(),
    checkOut: b.endDate.toISOString(),
  }));

  const minRoomPrice = row.rooms.length
    ? Math.min(...row.rooms.map((r) => r.pricePerNight))
    : f.pricePerNight;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">{f.title}</h1>
          <p className="text-stone-500 mt-1">📍 {f.location}</p>
        </div>
        {(row.contactPhone || row.owner.phone) && (
          <WhatsAppButton phone={(row.contactPhone || row.owner.phone)} farmhouseTitle={f.title} label="WhatsApp host" />
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-2 mb-8 rounded-lg overflow-hidden">
        {f.images[0] && (
          <div className="relative md:col-span-2 md:row-span-2 aspect-[4/3] bg-stone-100">
            <Image src={f.images[0]} alt={f.title} fill className="object-cover" sizes="50vw" unoptimized />
          </div>
        )}
        {f.images.slice(1, 5).map((img, i) => (
          <div key={i} className="relative aspect-[4/3] bg-stone-100 hidden md:block">
            <Image src={img} alt="" fill className="object-cover" sizes="25vw" unoptimized />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="border-b border-stone-200 pb-6 mb-6">
            <p className="text-sm text-stone-500">Hosted by {row.owner.name}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-stone-700">
              <span>🛏 {f.bedrooms} bedrooms</span>
              <span>🛁 {f.bathrooms} bathrooms</span>
              <span>👥 up to {f.maxGuests} guests</span>
              {row.rooms.length > 0 && <span>🚪 {row.rooms.length} bookable rooms</span>}
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-3">About this property</h2>
            <p className="text-stone-700 leading-relaxed whitespace-pre-line">{f.description}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-3">What this place offers</h2>
            <ul className="grid grid-cols-2 gap-2 text-stone-700">
              {f.amenities.map((a) => (
                <li key={a} className="flex items-center gap-2 text-sm">
                  <span className="text-green-700">✓</span> {a}
                </li>
              ))}
            </ul>
          </section>

          {(row.checkInTime || row.checkOutTime || row.cancellationPolicy) && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 mb-3">Booking details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {row.checkInTime && <Info label="Check-in" value={row.checkInTime} />}
                {row.checkOutTime && <Info label="Check-out" value={row.checkOutTime} />}
                {row.cancellationPolicy && <Info label="Cancellation" value={row.cancellationPolicy} />}
              </div>
            </section>
          )}

          {row.houseRules && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 mb-3">House rules</h2>
              <p className="text-stone-700 leading-relaxed whitespace-pre-line text-sm">{row.houseRules}</p>
            </section>
          )}

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-3">How to reach</h2>
            <LocationMap
              query={row.mapsQuery || `${f.title}, ${f.location}`}
              title={f.title}
            />
            {row.directions && (
              <p className="text-stone-700 leading-relaxed whitespace-pre-line text-sm mt-4">
                {row.directions}
              </p>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Pricing</h2>
            <p className="text-stone-700 text-sm">
              From <span className="font-semibold">{formatInr(minRoomPrice)}</span> per room, per night. Pick the rooms you want on the right.
            </p>
          </section>
        </div>

        <div>
          <BookingWidget
            farmhouseId={f.id}
            farmhouseTitle={f.title}
            ownerPhone={(row.contactPhone || row.owner.phone)}
            rooms={roomsWithAvailability}
            blockedRanges={blockedRanges}
          />
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-stone-50 border border-stone-200 px-3 py-2">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="font-medium text-stone-900 mt-0.5">{value}</p>
    </div>
  );
}
