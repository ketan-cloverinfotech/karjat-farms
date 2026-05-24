import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().max(200).optional(),
});

async function assertOwnership(farmhouseId: string, userId: string) {
  const row = await prisma.farmhouse.findUnique({
    where: { id: farmhouseId },
    select: { ownerId: true },
  });
  if (!row) return { ok: false, status: 404 as const, msg: "Not found." };
  if (row.ownerId !== userId) return { ok: false, status: 403 as const, msg: "Forbidden." };
  return { ok: true as const };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const check = await assertOwnership(id, session.user.id);
  if (!check.ok) return NextResponse.json({ error: check.msg }, { status: check.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid dates." }, { status: 400 });
  }
  const { startDate, endDate, reason } = parsed.data;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) {
    return NextResponse.json({ error: "End must be after start." }, { status: 400 });
  }

  const overlapBooking = await prisma.booking.findFirst({
    where: {
      farmhouseId: id,
      status: { in: ["PENDING", "CONFIRMED"] },
      AND: [{ checkIn: { lt: end } }, { checkOut: { gt: start } }],
    },
  });
  if (overlapBooking) {
    return NextResponse.json(
      { error: "These dates overlap with an existing booking." },
      { status: 409 }
    );
  }

  const block = await prisma.blockedDate.create({
    data: { farmhouseId: id, startDate: start, endDate: end, reason: reason || null },
  });
  return NextResponse.json({ block }, { status: 201 });
}
