import { prisma } from "@/lib/prisma";
import { parseFarmhouse } from "@/lib/farmhouse";
import { FarmhouseCard } from "@/components/FarmhouseCard";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  guests?: string;
  minPrice?: string;
  maxPrice?: string;
};

export default async function FarmhousesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const guests = sp.guests ? parseInt(sp.guests, 10) : undefined;
  const minPrice = sp.minPrice ? parseInt(sp.minPrice, 10) : undefined;
  const maxPrice = sp.maxPrice ? parseInt(sp.maxPrice, 10) : undefined;

  const rows = await prisma.farmhouse.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q } },
                { location: { contains: q } },
                { description: { contains: q } },
              ],
            }
          : {},
        guests ? { maxGuests: { gte: guests } } : {},
        minPrice ? { pricePerNight: { gte: minPrice } } : {},
        maxPrice ? { pricePerNight: { lte: maxPrice } } : {},
      ],
    },
    orderBy: { pricePerNight: "asc" },
  });

  const farmhouses = rows.map(parseFarmhouse);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900">Farmhouses in Karjat</h1>
        <p className="text-stone-500 mt-1">{farmhouses.length} properties available</p>
      </div>

      <form method="GET" className="card p-4 mb-8 grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="col-span-2">
          <label className="label">Search</label>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Location, name…"
            className="input"
          />
        </div>
        <div>
          <label className="label">Guests</label>
          <input
            type="number"
            name="guests"
            min={1}
            defaultValue={guests ?? ""}
            placeholder="Any"
            className="input"
          />
        </div>
        <div>
          <label className="label">Min ₹/night</label>
          <input
            type="number"
            name="minPrice"
            min={0}
            step={500}
            defaultValue={minPrice ?? ""}
            placeholder="0"
            className="input"
          />
        </div>
        <div>
          <label className="label">Max ₹/night</label>
          <input
            type="number"
            name="maxPrice"
            min={0}
            step={500}
            defaultValue={maxPrice ?? ""}
            placeholder="Any"
            className="input"
          />
        </div>
        <div className="col-span-2 md:col-span-5 flex gap-2">
          <button type="submit" className="btn-primary">Apply filters</button>
          <a href="/farmhouses" className="btn-outline">Clear</a>
        </div>
      </form>

      {farmhouses.length === 0 ? (
        <div className="text-center py-16 text-stone-500">
          No farmhouses match your filters. Try widening the search.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {farmhouses.map((f) => (
            <FarmhouseCard key={f.id} f={f} />
          ))}
        </div>
      )}
    </div>
  );
}
