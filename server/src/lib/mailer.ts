import nodemailer from "nodemailer";

export interface ShareEmailPayload {
  to: string;
  ownerEmail: string;
  goalTitle: string;
  goalCategory?: string | null;
  targetDate?: string | null;
  permission: "view" | "checkin";
  link: string;
}

/**
 * Returns:
 *  - false when email is disabled / not configured (no-op)
 *  - true  when an email is attempted (SMTP configured)
 */
export async function sendSharedGoalEmail(
  p: ShareEmailPayload,
): Promise<boolean> {
  const enabled = process.env.ENABLE_EMAIL === "true";
  const host = process.env.SMTP_HOST;

  if (!enabled || !host) {
    console.log("[mailer] Email disabled/not configured. Would send:", {
      to: p.to,
      ownerEmail: p.ownerEmail,
      goalTitle: p.goalTitle,
      goalCategory: p.goalCategory ?? null,
      targetDate: p.targetDate ?? null,
      permission: p.permission,
      link: p.link,
    });
    return false;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false") === "true";
  const auth = { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! };
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;

  const transport = nodemailer.createTransport({ host, port, secure, auth });

  const subject = `Goal shared with you by ${p.ownerEmail}`;
  const text = [
    `Owner: ${p.ownerEmail}`,
    `Title: ${p.goalTitle}`,
    p.goalCategory ? `Category: ${p.goalCategory}` : null,
    p.targetDate ? `Target date: ${p.targetDate}` : null,
    `Permission: ${p.permission}`,
    `Open: ${p.link}`,
  ]
    .filter(Boolean)
    .join("\n");

  await transport.sendMail({ from, to: p.to, subject, text });
  return true;
}

// Back-compat: if anything imports sendShareEmail, keep it working.
export { sendSharedGoalEmail as sendShareEmail };
