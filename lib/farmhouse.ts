export type ParsedFarmhouse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
};

type RawFarmhouse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string;
  images: string;
};

export function parseFarmhouse(f: RawFarmhouse): ParsedFarmhouse {
  return {
    ...f,
    amenities: safeParseArray(f.amenities),
    images: safeParseArray(f.images),
  };
}

function safeParseArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
