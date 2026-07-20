import { Resend } from "resend";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

let client: Resend | null = null;

function getResend() {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("Resend is not configured. Set RESEND_API_KEY.");
    }
    client = new Resend(apiKey);
  }

  return client;
}

// Resend's shared sandbox sender — swap for a verified domain address once one is set up.
const FROM = "Patch <onboarding@resend.dev>";

export async function sendPasswordResetEmail({ to, resetUrl }: { to: string; resetUrl: string }) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Reset your Patch password",
    text:
      `We received a request to reset the password for your Patch account.\n\n` +
      `Reset it here (link expires in 1 hour):\n${resetUrl}\n\n` +
      `If you didn't request this, you can safely ignore this email — your password is unchanged.`,
  });
}

export async function sendVerificationEmail({ to, verifyUrl }: { to: string; verifyUrl: string }) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Verify your Patch email",
    text:
      `Welcome to Patch — waste nothing, wear everything.\n\n` +
      `Please confirm your email address (link expires in 24 hours):\n${verifyUrl}\n\n` +
      `If you didn't create a Patch account, you can ignore this email.`,
  });
}

export async function sendContactNotification({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  if (!to) {
    throw new Error("CONTACT_NOTIFY_EMAIL is not set.");
  }

  await getResend().emails.send({
    from: FROM,
    to,
    replyTo: email,
    subject: `New contact message: ${subject}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });
}

export async function sendOrderConfirmationEmail({ to, order }: { to: string; order: Order }) {
  const items = order.items
    .map((item) => {
      const color = item.color ? `, Color: ${item.color}` : "";
      return `- ${item.name} (${item.sku}) — Size: ${item.size}${color} — ${formatPrice(item.price, order.currency)}`;
    })
    .join("\n");

  const shipping = order.shippingAddress;
  const discount = order.discount
    ? `\nDiscount${order.couponCode ? ` (${order.couponCode})` : ""}: -${formatPrice(order.discount, order.currency)}`
    : "";
  const tracking = order.trackingNumber
    ? `\nTracking: ${order.carrier ? `${order.carrier} ` : ""}${order.trackingNumber}`
    : "";

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Patch order confirmation ${order.orderNumber}`,
    text:
      `Thanks for your order, ${shipping.fullName}.\n\n` +
      `Order: ${order.orderNumber}\n` +
      `Status: ${order.status}\n` +
      `Payment: ${order.paymentStatus} (${order.paymentMethod})\n\n` +
      `Items:\n${items}\n\n` +
      `Subtotal: ${formatPrice(order.subtotal, order.currency)}` +
      discount +
      `\nTotal: ${formatPrice(order.total, order.currency)}\n\n` +
      `Shipping to:\n${shipping.fullName}\n${shipping.phone}\n${shipping.email}\n${shipping.addressLine}, ${shipping.area}, ${shipping.city}` +
      (shipping.notes ? `\nNotes: ${shipping.notes}` : "") +
      tracking +
      `\n\nWe'll contact you with fulfillment updates soon.`,
  });
}
