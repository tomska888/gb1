// server/src/test/mailer.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";

const ORIG_ENV = { ...process.env };

async function loadMailerWith(
  env: Record<string, string | undefined>,
  mode: "none" | "success" | "verifyFail" | "sendFail" = "none",
) {
  vi.resetModules();
  process.env = { ...ORIG_ENV, ...env };

  // doMock is NOT hoisted; safe to use local "mode"
  vi.doMock("nodemailer", () => {
    if (mode === "none") {
      const createTransport = vi.fn(); // should not be called
      return { default: { createTransport }, createTransport };
    }

    const verify =
      mode === "verifyFail"
        ? vi.fn().mockRejectedValue(new Error("verify boom"))
        : vi.fn().mockResolvedValue(true);

    const sendMail =
      mode === "sendFail"
        ? vi.fn().mockRejectedValue(new Error("send boom"))
        : vi.fn().mockResolvedValue({ messageId: "x", response: "OK" });

    const createTransport = vi.fn(() => ({ verify, sendMail }));
    return { default: { createTransport }, createTransport };
  });

  // Import AFTER mocking
  const mailer = await import("../lib/mailer.js");
  const nodemailer = (await import("nodemailer")) as unknown as {
    createTransport: import("vitest").Mock;
  };

  return { mailer, nodemailer };
}

afterEach(() => {
  process.env = { ...ORIG_ENV };
  vi.restoreAllMocks();
});

describe("mailer.sendSharedGoalEmail", () => {
  it("no SMTP configured → returns false and does not throw", async () => {
    const { mailer, nodemailer } = await loadMailerWith(
      { ENABLE_EMAIL: undefined, SMTP_HOST: undefined },
      "none",
    );

    const ok = await mailer.sendSharedGoalEmail({
      to: "buddy@example.com",
      ownerEmail: "owner@example.com",
      goalTitle: "G",
      goalCategory: null,
      targetDate: null,
      permission: "checkin",
      link: "http://localhost:5174/shared?ownerId=1",
    });

    expect(ok).toBe(false);
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it("ENABLE_EMAIL=true but no SMTP_HOST → returns false", async () => {
    const { mailer, nodemailer } = await loadMailerWith(
      { ENABLE_EMAIL: "true", SMTP_HOST: undefined },
      "none",
    );

    const ok = await mailer.sendSharedGoalEmail({
      to: "b@example.com",
      ownerEmail: "o@example.com",
      goalTitle: "T",
      permission: "view",
      link: "http://x",
    });

    expect(ok).toBe(false);
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it("host present but missing creds → returns false", async () => {
    const { mailer, nodemailer } = await loadMailerWith(
      {
        ENABLE_EMAIL: "true",
        SMTP_HOST: "smtp.example.com",
        SMTP_USER: undefined, // <— ensure creds are unset
        SMTP_PASS: undefined, // <— ensure creds are unset
      },
      "none",
    );

    const ok = await mailer.sendSharedGoalEmail({
      to: "b@example.com",
      ownerEmail: "o@example.com",
      goalTitle: "T",
      permission: "checkin",
      link: "http://x",
    });

    expect(ok).toBe(false);
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it("full config → verify + sendMail succeed and payload looks right", async () => {
    const { mailer, nodemailer } = await loadMailerWith(
      {
        ENABLE_EMAIL: "true",
        SMTP_HOST: "smtp.example.com",
        SMTP_USER: "smtp-user@example.com",
        SMTP_PASS: "sekret",
        SMTP_PORT: "2525",
        SMTP_SECURE: "false",
        SMTP_FROM: "noreply@example.com",
      },
      "success",
    );

    const ok = await mailer.sendSharedGoalEmail({
      to: "buddy@example.com",
      ownerEmail: "owner@example.com",
      goalTitle: "Learn Spanish",
      goalCategory: "Education",
      targetDate: "2025-12-31",
      permission: "checkin",
      link: "http://localhost:5174/shared?ownerId=1",
    });

    expect(ok).toBe(true);

    expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
    const args = nodemailer.createTransport.mock.calls[0][0];
    expect(args).toMatchObject({
      host: "smtp.example.com",
      port: 2525,
      secure: false,
      auth: { user: "smtp-user@example.com", pass: "sekret" },
    });

    const transport = nodemailer.createTransport.mock.results[0].value as {
      verify: import("vitest").Mock;
      sendMail: import("vitest").Mock;
    };
    expect(transport.verify).toHaveBeenCalledTimes(1);
    expect(transport.sendMail).toHaveBeenCalledTimes(1);

    const mail = transport.sendMail.mock.calls[0][0];
    expect(mail.from).toBe("noreply@example.com");
    expect(mail.to).toBe("buddy@example.com");
    expect(mail.subject).toContain("owner@example.com");
    expect(mail.text).toContain("Learn Spanish");
    expect(mail.text).toContain("Education");
    expect(mail.text).toContain("2025-12-31");
    expect(mail.text).toContain("http://localhost:5174/shared?ownerId=1");
    expect(mail.html).toContain("Learn Spanish");
  });

  it("verify fails → returns false; sendMail not called", async () => {
    const { mailer, nodemailer } = await loadMailerWith(
      {
        ENABLE_EMAIL: "true",
        SMTP_HOST: "smtp.example.com",
        SMTP_USER: "u",
        SMTP_PASS: "p",
      },
      "verifyFail",
    );

    const ok = await mailer.sendSharedGoalEmail({
      to: "b@example.com",
      ownerEmail: "o@example.com",
      goalTitle: "X",
      permission: "view",
      link: "http://x",
    });

    expect(ok).toBe(false);

    const transport = nodemailer.createTransport.mock.results[0].value as {
      verify: import("vitest").Mock;
      sendMail: import("vitest").Mock;
    };
    expect(transport.verify).toHaveBeenCalledTimes(1);
    expect(transport.sendMail).not.toHaveBeenCalled();
  });

  it("sendMail fails → returns false", async () => {
    const { mailer, nodemailer } = await loadMailerWith(
      {
        ENABLE_EMAIL: "true",
        SMTP_HOST: "smtp.example.com",
        SMTP_USER: "u",
        SMTP_PASS: "p",
      },
      "sendFail",
    );

    const ok = await mailer.sendSharedGoalEmail({
      to: "b@example.com",
      ownerEmail: "o@example.com",
      goalTitle: "X",
      permission: "checkin",
      link: "http://x",
    });

    expect(ok).toBe(false);

    const transport = nodemailer.createTransport.mock.results[0].value as {
      verify: import("vitest").Mock;
      sendMail: import("vitest").Mock;
    };
    expect(transport.verify).toHaveBeenCalledTimes(1);
    expect(transport.sendMail).toHaveBeenCalledTimes(1);
  });
});
