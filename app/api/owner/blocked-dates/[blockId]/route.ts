import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { blockId } = await params;

  const block = await prisma.blockedDate.findUnique({
    where: { id: blockId },
    include: { farmhouse: { select: { ownerId: true } } },
  });
  if (!block) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (block.farmhouse.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await prisma.blockedDate.delete({ where: { id: blockId } });
  return NextResponse.json({ ok: true });
}
