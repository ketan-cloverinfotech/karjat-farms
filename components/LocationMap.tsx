type Props = {
  query: string;          // place name, address, or "lat,long" used as Google Maps target
  title: string;          // farmhouse title (for the place pin label / map title)
  origin?: string;        // origin city for the directions button (default: Panvel)
};

const PANVEL_ORIGIN = "Panvel, Maharashtra";
// Approx Panvel → Karjat distance for the helper label
const APPROX_DRIVE = "≈ 1 hr 15 min (45 km)";

export function LocationMap({ query, title, origin = PANVEL_ORIGIN }: Props) {
  const dest = encodeURIComponent(query);
  const org = encodeURIComponent(origin);

  // Free, no-API-key embed (basic Google Maps iframe)
  const embedSrc = `https://maps.google.com/maps?q=${dest}&z=13&output=embed`;

  // Deep links — open in Google Maps app / web
  const directionsHref = `https://www.google.com/maps/dir/?api=1&origin=${org}&destination=${dest}&travelmode=driving`;
  const openHref = `https://www.google.com/maps/search/?api=1&query=${dest}`;

  return (
    <div className="rounded-lg border border-stone-200 overflow-hidden">
      <div className="relative w-full aspect-[16/9] bg-stone-100">
        <iframe
          src={embedSrc}
          title={`Map: ${title}`}
          className="absolute inset-0 w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="p-4 bg-white">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900">📍 {title}</p>
            <p className="text-xs text-stone-500 mt-0.5">
              From <span className="font-medium">{origin.split(",")[0]}</span> · {APPROX_DRIVE}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm inline-flex items-center gap-1.5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            Directions from {origin.split(",")[0]}
          </a>
          <a
            href={openHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline text-sm"
          >
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
