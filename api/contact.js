/* eslint-env node */
import nodemailer from "nodemailer";

const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 2000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WINDOW_MS = 30_000;

const submissions = new Map();

const getClientKey = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : (forwardedFor || "").split(",")[0].trim();
  const userAgent = req.headers["user-agent"] || "";
  return `${ip || "unknown"}:${userAgent}`;
};

const isRateLimited = (key) => {
  const now = Date.now();
  const previous = submissions.get(key) || 0;

  if (now - previous < WINDOW_MS) {
    return true;
  }

  submissions.set(key, now);
  return false;
};

const sanitizeText = (value) => String(value || "").trim();

const isPayloadValid = ({ name, email, message, company }) => {
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const key = getClientKey(req);
  if (isRateLimited(key)) {
    return res.status(429).json({ ok: false, error: "Too many requests" });
  }

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON body" });
  }
  const payload = {
    name: sanitizeText(body.name),
    email: sanitizeText(body.email),
    message: sanitizeText(body.message),
    company: sanitizeText(body.company),
  };

  if (!isPayloadValid(payload)) {
    return res.status(400).json({ ok: false, error: "Invalid input" });
  }

  const toEmail = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;
  const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER;

  if (!toEmail || !fromEmail || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({ ok: false, error: "Email service not configured" });
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

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Failed to send email" });
  }
}
