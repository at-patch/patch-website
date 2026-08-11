import { Resend } from "resend";

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
    // Resend's shared sandbox sender — swap for a verified domain address once one is set up.
    from: "Patch <onboarding@resend.dev>",
    to,
    replyTo: email,
    subject: `New contact message: ${subject}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });
}

export async function sendPasswordResetEmail({ to, resetUrl }: { to: string; resetUrl: string }) {
  await getResend().emails.send({
    from: "Patch <onboarding@resend.dev>",
    to,
    subject: "Reset your Patch password",
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 30 minutes. If you didn't request this, ignore this email.`,
  });
}

export async function sendVerificationEmail({ to, verifyUrl }: { to: string; verifyUrl: string }) {
  await getResend().emails.send({
    from: "Patch <onboarding@resend.dev>",
    to,
    subject: "Verify your Patch account",
    text: `Verify your email: ${verifyUrl}\n\nThis link expires in 24 hours.`,
  });
}
