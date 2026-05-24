import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { nightsBetween } from "@/lib/format";
import { getRazorpay, isRazorpayConfigured } from "@/lib/razorpay";

const schema = z.object({
  farmhouseId: z.string().min(1),
  roomIds: z.array(z.string().min(1)).min(1).max(50),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().int().min(1).max(200),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { farmhouseId, roomIds, checkIn, checkOut, guests } = parsed.data;
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (checkInDate < today) {
    return NextResponse.json({ error: "Check-in must be in the future." }, { status: 400 });
  }
  const nights = nightsBetween(checkInDate, checkOutDate);
  if (nights < 1) {
    return NextResponse.json({ error: "Stay must be at least 1 night." }, { status: 400 });
  }

  // All requested rooms must belong to the same farmhouse
  const rooms = await prisma.room.findMany({
    where: { id: { in: roomIds }, farmhouseId },
  });
  if (rooms.length !== roomIds.length) {
    return NextResponse.json(
      { error: "One or more rooms don't belong to this farmhouse." },
      { status: 400 }
    );
  }

  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  if (guests > totalCapacity) {
    return NextResponse.json(
      { error: `Selected rooms hold up to ${totalCapacity} guests.` },
      { status: 400 }
    );
  }

  // Farmhouse-wide blocks (owner blocked these dates entirely)
  const blockedOverlap = await prisma.blockedDate.findFirst({
    where: {
      farmhouseId,
      AND: [{ startDate: { lt: checkOutDate } }, { endDate: { gt: checkInDate } }],
    },
  });
  if (blockedOverlap) {
    return NextResponse.json({ error: "These dates are unavailable." }, { status: 409 });
  }

  // Per-room conflicts: any of the requested rooms already booked on overlapping dates?
  const conflict = await prisma.bookingRoom.findFirst({
    where: {
      roomId: { in: roomIds },
      booking: {
        status: { in: ["PENDING", "CONFIRMED"] },
        AND: [{ checkIn: { lt: checkOutDate } }, { checkOut: { gt: checkInDate } }],
      },
    },
    include: { room: { select: { name: true } } },
  });
  if (conflict) {
    return NextResponse.json(
      { error: `${conflict.room.name} is already booked for those dates.` },
      { status: 409 }
    );
  }

  const subtotalPerNight = rooms.reduce((sum, r) => sum + r.pricePerNight, 0);
  const totalAmount = nights * subtotalPerNight;

  const booking = await prisma.booking.create({
    data: {
      userId: session.user.id,
      farmhouseId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      totalAmount,
      status: "PENDING",
      rooms: {
        create: roomIds.map((rid) => ({ roomId: rid })),
      },
    },
  });

  if (!isRazorpayConfigured()) {
    return NextResponse.json({
      bookingId: booking.id,
      order: null,
      razorpayKeyId: null,
      note: "Razorpay not configured — booking will be confirmed without payment.",
    });
  }

  try {
    const rzp = getRazorpay();
    const order = await rzp.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: booking.id,
      notes: { bookingId: booking.id },
    });
    await prisma.booking.update({
      where: { id: booking.id },
      data: { razorpayOrderId: order.id },
    });
    return NextResponse.json({
      bookingId: booking.id,
      order,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (e) {
    console.error("Razorpay order create failed", e);
    return NextResponse.json({ error: "Could not create payment order." }, { status: 500 });
  }
}
