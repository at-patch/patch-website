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
