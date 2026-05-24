import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const imageUrl = z.string().refine(
  (s) => s.startsWith("/uploads/") || /^https?:\/\//.test(s),
  "Must be an uploaded path or http(s) URL."
);

const schema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(20).max(4000),
  location: z.string().min(3).max(200),
  pricePerNight: z.number().int().min(500).max(1_000_000),
  maxGuests: z.number().int().min(1).max(100),
  bedrooms: z.number().int().min(1).max(20),
  bathrooms: z.number().int().min(1).max(20),
  amenities: z.array(z.string().min(1)).min(1).max(50),
  images: z.array(imageUrl).min(1).max(20),
  houseRules: z.string().max(2000).optional().nullable(),
  checkInTime: z.string().max(40).optional().nullable(),
  checkOutTime: z.string().max(40).optional().nullable(),
  cancellationPolicy: z.string().max(200).optional().nullable(),
  directions: z.string().max(2000).optional().nullable(),
  mapsQuery: z.string().max(500).optional().nullable(),
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "OWNER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const data = parsed.data;

  let slug = slugify(data.title);
  let suffix = 0;
  while (await prisma.farmhouse.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(data.title)}-${suffix}`;
  }

  const created = await prisma.farmhouse.create({
    data: {
      title: data.title,
      description: data.description,
      location: data.location,
      pricePerNight: data.pricePerNight,
      maxGuests: data.maxGuests,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      houseRules: data.houseRules ?? null,
      checkInTime: data.checkInTime ?? null,
      checkOutTime: data.checkOutTime ?? null,
      cancellationPolicy: data.cancellationPolicy ?? null,
      directions: data.directions ?? null,
      mapsQuery: data.mapsQuery ?? null,
      slug,
      amenities: JSON.stringify(data.amenities),
      images: JSON.stringify(data.images),
      ownerId: session.user.id,
    },
  });

  return NextResponse.json({ farmhouse: created }, { status: 201 });
}
