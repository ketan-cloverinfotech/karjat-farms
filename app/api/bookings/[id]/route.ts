import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { id } = await params;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (booking.userId !== session.user.id && session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ status: "CANCELLED" });
  }

  await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  return NextResponse.json({ status: "CANCELLED" });
}
