import Razorpay from "razorpay";
import crypto from "node:crypto";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export function isRazorpayConfigured(): boolean {
  return Boolean(
    keyId &&
      keySecret &&
      keyId !== "rzp_test_placeholder" &&
      keySecret !== "placeholder_secret"
  );
}

export function getRazorpay(): Razorpay {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay keys not configured.");
  }
  return new Razorpay({ key_id: keyId!, key_secret: keySecret! });
}

export function verifyRazorpaySignature(opts: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!keySecret) return false;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${opts.orderId}|${opts.paymentId}`)
    .digest("hex");
  return expected === opts.signature;
}
