import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
  capacity: z.number().int().min(1).max(50),
  pricePerNight: z.number().int().min(100).max(1_000_000),
  displayOrder: z.number().int().min(0).max(100).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  const farmhouse = await prisma.farmhouse.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!farmhouse) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (farmhouse.ownerId !== session.user.id) {
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

  const existingCount = await prisma.room.count({ where: { farmhouseId: id } });

  const room = await prisma.room.create({
    data: {
      farmhouseId: id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      capacity: parsed.data.capacity,
      pricePerNight: parsed.data.pricePerNight,
      displayOrder: parsed.data.displayOrder ?? existingCount,
    },
  });
  return NextResponse.json({ room }, { status: 201 });
}
