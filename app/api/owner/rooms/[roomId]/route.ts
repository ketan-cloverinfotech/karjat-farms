import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).optional().nullable(),
  capacity: z.number().int().min(1).max(50).optional(),
  pricePerNight: z.number().int().min(100).max(1_000_000).optional(),
  displayOrder: z.number().int().min(0).max(100).optional(),
});

async function assertOwnership(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { farmhouse: { select: { ownerId: true } } },
  });
  if (!room) return { ok: false, status: 404 as const, msg: "Not found." };
  if (room.farmhouse.ownerId !== userId)
    return { ok: false, status: 403 as const, msg: "Forbidden." };
  return { ok: true as const, room };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { roomId } = await params;
  const check = await assertOwnership(roomId, session.user.id);
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

  const updated = await prisma.room.update({
    where: { id: roomId },
    data: {
      name: d.name,
      description: d.description ?? undefined,
      capacity: d.capacity,
      pricePerNight: d.pricePerNight,
      displayOrder: d.displayOrder,
    },
  });
  return NextResponse.json({ room: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { roomId } = await params;
  const check = await assertOwnership(roomId, session.user.id);
  if (!check.ok) return NextResponse.json({ error: check.msg }, { status: check.status });

  // Block deletion if the room has any active bookings
  const activeBooking = await prisma.bookingRoom.findFirst({
    where: {
      roomId,
      booking: { status: { in: ["PENDING", "CONFIRMED"] } },
    },
  });
  if (activeBooking) {
    return NextResponse.json(
      { error: "Cannot delete — this room has active bookings." },
      { status: 409 }
    );
  }

  await prisma.room.delete({ where: { id: roomId } });
  return NextResponse.json({ ok: true });
}
