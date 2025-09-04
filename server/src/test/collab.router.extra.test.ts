import { describe, it, expect, vi, afterEach } from "vitest";

const ORIG_ENV = { ...process.env };

async function loadMailerWith(
  env: Record<string, string | undefined>,
  mockNodemailer: boolean,
) {
  vi.resetModules();
  process.env = { ...ORIG_ENV, ...env };

  if (mockNodemailer) {
    vi.mock("nodemailer", () => {
      const sendMail = vi.fn(async () => ({}));
      const createTransport = vi.fn(() => ({ sendMail }));
      return { default: { createTransport }, createTransport };
    });
  } else {
    vi.mock("nodemailer", () => {
      const createTransport = vi.fn();
      return { default: { createTransport }, createTransport };
    });
  }

  return await import("../lib/mailer.js");
}

afterEach(() => {
  process.env = { ...ORIG_ENV };
  vi.restoreAllMocks();
});

describe("mailer.sendSharedGoalEmail", () => {
  it("no SMTP configured → returns false and does not throw", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    const { sendSharedGoalEmail } = await loadMailerWith(
      { ENABLE_EMAIL: undefined, SMTP_HOST: undefined },
      false,
    );

    const ok = await sendSharedGoalEmail({
      to: "buddy@example.com",
      ownerEmail: "owner@example.com",
      goalTitle: "G",
      goalCategory: null,
      targetDate: null,
      permission: "checkin",
      link: "http://localhost:5174/shared?ownerId=1",
    });

    expect(ok).toBe(false);
    log.mockRestore();
  });
});
