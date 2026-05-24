import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const imageUrl = z.string().refine(
  (s) => s.startsWith("/uploads/") || /^https?:\/\//.test(s),
  "Must be an uploaded path or http(s) URL."
);

const schema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(20).max(4000).optional(),
  location: z.string().min(3).max(200).optional(),
  pricePerNight: z.number().int().min(500).max(1_000_000).optional(),
  maxGuests: z.number().int().min(1).max(100).optional(),
  bedrooms: z.number().int().min(1).max(20).optional(),
  bathrooms: z.number().int().min(1).max(20).optional(),
  amenities: z.array(z.string().min(1)).min(1).max(50).optional(),
  images: z.array(imageUrl).min(1).max(20).optional(),
  houseRules: z.string().max(2000).optional().nullable(),
  checkInTime: z.string().max(40).optional().nullable(),
  checkOutTime: z.string().max(40).optional().nullable(),
  cancellationPolicy: z.string().max(200).optional().nullable(),
  directions: z.string().max(2000).optional().nullable(),
  mapsQuery: z.string().max(500).optional().nullable(),
});

async function assertOwnership(id: string, userId: string) {
  const row = await prisma.farmhouse.findUnique({ where: { id } });
  if (!row) return { ok: false, status: 404 as const, msg: "Not found." };
  if (row.ownerId !== userId) return { ok: false, status: 403 as const, msg: "Forbidden." };
  return { ok: true as const, row };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const check = await assertOwnership(id, session.user.id);
  if (!check.ok) return NextResponse.json({ error: check.msg }, { status: check.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const updated = await prisma.farmhouse.update({
    where: { id },
    data: {
      title: d.title,
      description: d.description,
      location: d.location,
      pricePerNight: d.pricePerNight,
      maxGuests: d.maxGuests,
      bedrooms: d.bedrooms,
      bathrooms: d.bathrooms,
      amenities: d.amenities ? JSON.stringify(d.amenities) : undefined,
      images: d.images ? JSON.stringify(d.images) : undefined,
      houseRules: d.houseRules ?? undefined,
      checkInTime: d.checkInTime ?? undefined,
      checkOutTime: d.checkOutTime ?? undefined,
      cancellationPolicy: d.cancellationPolicy ?? undefined,
      directions: d.directions ?? undefined,
      mapsQuery: d.mapsQuery ?? undefined,
    },
  });
  return NextResponse.json({ farmhouse: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const check = await assertOwnership(id, session.user.id);
  if (!check.ok) return NextResponse.json({ error: check.msg }, { status: check.status });

  await prisma.farmhouse.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
