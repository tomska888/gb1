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

export async function sendSharedGoalEmail(
  p: ShareEmailPayload,
): Promise<boolean> {
  const enabled = process.env.ENABLE_EMAIL === "true";
  const host = process.env.SMTP_HOST;

  console.log("[mailer] Configuration check:", {
    enabled,
    host,
    hasUser: !!process.env.SMTP_USER,
    hasPass: !!process.env.SMTP_PASS,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE || "false",
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
  });

  if (!enabled) {
    console.log("[mailer] Email is disabled (ENABLE_EMAIL != 'true')");
    return false;
  }

  if (!host) {
    console.log("[mailer] SMTP_HOST is not configured");
    return false;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(
      "[mailer] SMTP credentials not configured (SMTP_USER/SMTP_PASS missing)",
    );
    return false;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false") === "true";
  const auth = { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! };
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;

  console.log("[mailer] SMTP configuration:", {
    host,
    port,
    secure,
    from,
    user: auth.user.replace(/(.{2}).*(@.*)/, "$1***$2"),
  });

  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth,
      debug: true,
      logger: true,
    });

    console.log("[mailer] Testing SMTP connection...");
    await transport.verify();
    console.log("[mailer] SMTP connection verified successfully");

    const subject = `🎯 Goal shared with you by ${p.ownerEmail}`;

    const text = [
      `${p.ownerEmail} has shared a goal with you!`,
      ``,
      `Goal: ${p.goalTitle}`,
      p.goalCategory ? `Category: ${p.goalCategory}` : null,
      p.targetDate ? `Target date: ${p.targetDate}` : null,
      `Permission: ${p.permission === "checkin" ? "Check-in & View" : "View Only"}`,
      ``,
      `View the goal: ${p.link}`,
    ]
      .filter(Boolean)
      .join("\n");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">🎯 Goal Shared with You!</h2>
        <p><strong>${p.ownerEmail}</strong> has shared a goal with you:</p>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
          <h3 style="margin-top: 0; color: #007bff;">${p.goalTitle}</h3>
          ${p.goalCategory ? `<p><strong>Category:</strong> ${p.goalCategory}</p>` : ""}
          ${p.targetDate ? `<p><strong>Target Date:</strong> ${p.targetDate}</p>` : ""}
          <p><strong>Permission:</strong> ${p.permission === "checkin" ? "Check-in & View" : "View Only"}</p>
        </div>

        <a href="${p.link}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0;">
          View Goal →
        </a>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">
          This email was sent because ${p.ownerEmail} shared a goal with you.
          If you didn't expect this email, you can safely ignore it.
        </p>
      </div>
    `;

    console.log("[mailer] Sending email to:", p.to);
    console.log("[mailer] Email subject:", subject);

    const result = await transport.sendMail({
      from,
      to: p.to,
      subject,
      text,
      html,
    });

    console.log("[mailer] Email sent successfully!");
    console.log("[mailer] Message ID:", result.messageId);
    console.log("[mailer] Response:", result.response);

    return true;
  } catch (error) {
    console.error("[mailer] Failed to send email:");
    console.error("[mailer] Error details:", error);

    if (error instanceof Error) {
      console.error("[mailer] Error message:", error.message);
      console.error("[mailer] Error stack:", error.stack);
    }

    return false;
  }
}

export { sendSharedGoalEmail as sendShareEmail };
