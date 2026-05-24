import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isRazorpayConfigured, verifyRazorpaySignature } from "@/lib/razorpay";

const schema = z.object({
  bookingId: z.string().min(1),
  razorpay_order_id: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  razorpay_signature: z.string().optional(),
  mock: z.boolean().optional(),
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

  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature, mock } = parsed.data;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (!isRazorpayConfigured() || mock) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
    });
    return NextResponse.json({ status: "CONFIRMED", mock: true });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json(
      { error: "Missing payment fields." },
      { status: 400 }
    );
  }

  const ok = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!ok) {
    return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CONFIRMED",
      razorpayPaymentId: razorpay_payment_id,
    },
  });

  return NextResponse.json({ status: "CONFIRMED" });
}
