import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseFarmhouse } from "@/lib/farmhouse";
import { FarmhouseCard } from "@/components/FarmhouseCard";
import { HappyCustomers } from "@/components/HappyCustomers";

export default async function Home() {
  const all = await prisma.farmhouse.findMany({
    take: 6,
    orderBy: { createdAt: "asc" },
  });
  const farmhouses = all.map(parseFarmhouse);

  return (
    <>
      <section className="relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/50 to-stone-900/70" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-white">
          <h1 className="text-4xl sm:text-6xl font-bold leading-tight max-w-3xl">
            Your weekend escape, <span className="text-green-300">just 90 minutes</span> from Mumbai
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-stone-100 max-w-2xl">
            Hand-picked farmhouses, river villas and hilltop bungalows in Karjat — for families,
            friends and corporate offsites.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/farmhouses" className="btn-primary text-base px-6 py-3">
              Browse Farmhouses
            </Link>
            <Link href="#featured" className="btn-outline bg-white/10 border-white/30 text-white hover:bg-white/20 text-base px-6 py-3">
              See Featured
            </Link>
          </div>
        </div>
      </section>

      <section id="featured" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Featured Farmhouses</h2>
            <p className="text-stone-500 mt-1">Our most-loved properties this season</p>
          </div>
          <Link href="/farmhouses" className="text-sm font-medium text-green-700 hover:underline hidden sm:inline">
            View all →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {farmhouses.map((f) => (
            <FarmhouseCard key={f.id} f={f} />
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-stone-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl mb-2">🏊</div>
            <h3 className="font-semibold text-stone-900">Pool & River</h3>
            <p className="text-sm text-stone-500 mt-1">Every property has a pool or river access</p>
          </div>
          <div>
            <div className="text-3xl mb-2">🔥</div>
            <h3 className="font-semibold text-stone-900">Barbecue & Bonfires</h3>
            <p className="text-sm text-stone-500 mt-1">Set up for those late-night chats</p>
          </div>
          <div>
            <div className="text-3xl mb-2">🧑‍🍳</div>
            <h3 className="font-semibold text-stone-900">Chef on Request</h3>
            <p className="text-sm text-stone-500 mt-1">Authentic local food at most properties</p>
          </div>
        </div>
      </section>

      <HappyCustomers />
    </>
  );
}
