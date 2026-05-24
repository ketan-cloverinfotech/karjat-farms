import Link from "next/link";
import Image from "next/image";
import type { ParsedFarmhouse } from "@/lib/farmhouse";
import { formatInr } from "@/lib/format";

export function FarmhouseCard({ f }: { f: ParsedFarmhouse }) {
  const cover = f.images[0];
  return (
    <Link href={`/farmhouses/${f.slug}`} className="card group block hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] bg-stone-100">
        {cover ? (
          <Image
            src={cover}
            alt={f.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-400">No image</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-stone-900 line-clamp-1">{f.title}</h3>
        </div>
        <p className="text-sm text-stone-500 mt-0.5">{f.location}</p>
        <div className="flex items-center gap-3 text-xs text-stone-600 mt-2">
          <span>🛏 {f.bedrooms} BR</span>
          <span>·</span>
          <span>👥 up to {f.maxGuests}</span>
          <span>·</span>
          <span>🛁 {f.bathrooms}</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="font-semibold text-stone-900">{formatInr(f.pricePerNight)}</span>
            <span className="text-stone-500 text-sm"> /night</span>
          </div>
          <span className="text-xs text-green-700 font-medium group-hover:underline">View →</span>
        </div>
      </div>
    </Link>
  );
}
