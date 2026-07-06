import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 2000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WINDOW_MS = 30_000;

// Best-effort rate limit; resets whenever the serverless instance is recycled.
const submissions = new Map<string, number>();

const getClientKey = (req: Request) => {
  const forwardedFor = req.headers.get("x-forwarded-for") || "";
  const ip = forwardedFor.split(",")[0].trim();
  const userAgent = req.headers.get("user-agent") || "";
  return `${ip || "unknown"}:${userAgent}`;
};

const isRateLimited = (key: string) => {
  const now = Date.now();
  const previous = submissions.get(key) || 0;

  if (now - previous < WINDOW_MS) {
    return true;
  }

  submissions.set(key, now);
  return false;
};

const sanitizeText = (value: unknown) => String(value ?? "").trim();

interface ContactPayload {
  name: string;
  email: string;
  message: string;
  company: string;
}

const isPayloadValid = ({ name, email, message, company }: ContactPayload) => {
  if (company) return false;
  if (name.length < 2 || name.length > NAME_MAX_LENGTH) return false;
  if (!EMAIL_REGEX.test(email) || email.length > EMAIL_MAX_LENGTH) return false;
  if (message.length < MESSAGE_MIN_LENGTH || message.length > MESSAGE_MAX_LENGTH) return false;
  return true;
};

const getTransport = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

export async function POST(req: Request) {
  const key = getClientKey(req);
  if (isRateLimited(key)) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const payload: ContactPayload = {
    name: sanitizeText(body.name),
    email: sanitizeText(body.email),
    message: sanitizeText(body.message),
    company: sanitizeText(body.company),
  };

  if (!isPayloadValid(payload)) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }

  const toEmail = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;
  const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER;

  if (!toEmail || !fromEmail || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ ok: false, error: "Email service not configured" }, { status: 500 });
  }

  try {
    const transporter = getTransport();
    await transporter.sendMail({
      from: `"chingis.dev Contact" <${fromEmail}>`,
      to: toEmail,
      replyTo: payload.email,
      subject: `New contact form message from ${payload.name}`,
      text: [
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        "",
        "Message:",
        payload.message,
      ].join("\n"),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to send email" }, { status: 500 });
  }
}
