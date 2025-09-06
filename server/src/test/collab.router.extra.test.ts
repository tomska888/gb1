import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import express from "express";

let app: express.Application;
let dbMock: any;
let sendSharedGoalEmailMock: any;

// helper: build a fresh chainable Kysely-like mock
function makeDbMock() {
  return {
    // chainable
    selectFrom: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    insertInto: vi.fn().mockReturnThis(),
    deleteFrom: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returningAll: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    clearSelect: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),

    // terminals
    executeTakeFirst: vi.fn(),
    executeTakeFirstOrThrow: vi.fn(),
    execute: vi.fn(),

    // used by revoke route (not hit here but keep harmless)
    transaction: vi.fn(() => ({
      execute: async (fn: any) => {
        const trx = {
          deleteFrom: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(undefined),
        };
        await fn(trx);
      },
    })),
  };
}

beforeEach(async () => {
  vi.resetModules();
  dbMock = makeDbMock();
  sendSharedGoalEmailMock = vi.fn();

  // mock modules ONLY for this file’s imports
  vi.doMock("../config/database.js", () => ({ db: dbMock }));
  vi.doMock("../lib/mailer.js", () => ({
    sendSharedGoalEmail: sendSharedGoalEmailMock,
  }));
  vi.doMock("../middleware/middleware.js", () => ({
    authenticateToken: (req: any, _res: any, next: any) => {
      req.userId = 1;
      next();
    },
  }));

  // import router after mocks
  const { default: collabRouter } = await import(
    "../api/collab/collab.router.js"
  );

  app = express();
  app.use(express.json());
  app.use("/api/collab", collabRouter);
});

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("Collaboration Router - Share Goal", () => {
  it("should successfully share a goal and send email", async () => {
    // call order:
    // 1) userOwnsGoal         -> executeTakeFirst
    // 2) buddy lookup         -> executeTakeFirst
    // 3) existing share?      -> executeTakeFirst
    // (insert)                -> executeTakeFirstOrThrow
    // 4) goal for email       -> executeTakeFirst
    // 5) owner for email      -> executeTakeFirst

    dbMock.executeTakeFirst
      .mockResolvedValueOnce({ user_id: 1 }) // owns
      .mockResolvedValueOnce({ id: 2, email: "buddy@example.com" }) // buddy
      .mockResolvedValueOnce(null) // not shared
      .mockResolvedValueOnce({
        title: "Learn Spanish",
        category: "Education",
        target_date: "2025-12-31",
      }) // goal
      .mockResolvedValueOnce({ email: "owner@example.com" }); // owner

    dbMock.executeTakeFirstOrThrow.mockResolvedValue({
      id: 10,
      goal_id: 123,
      owner_id: 1,
      buddy_id: 2,
      permissions: "checkin",
      created_at: new Date(),
    });

    sendSharedGoalEmailMock.mockResolvedValue(true);

    const res = await request(app)
      .post("/api/collab/goals/123/share")
      .send({ email: "buddy@example.com", permissions: "checkin" });

    expect(res.status).toBe(201);
    expect(res.body.goal_id).toBe(123);
    expect(res.body.emailSent).toBe(true);

    expect(sendSharedGoalEmailMock).toHaveBeenCalledWith({
      to: "buddy@example.com",
      ownerEmail: "owner@example.com",
      goalTitle: "Learn Spanish",
      goalCategory: "Education",
      targetDate: "2025-12-31",
      permission: "checkin",
      link: expect.stringContaining("/shared?ownerId=1"),
    });
  });

  it("should return 404 when user not found", async () => {
    dbMock.executeTakeFirst
      .mockResolvedValueOnce({ user_id: 1 }) // owns
      .mockResolvedValueOnce(null); // buddy not found

    const res = await request(app)
      .post("/api/collab/goals/123/share")
      .send({ email: "nonexistent@example.com", permissions: "view" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("User not found");
    expect(sendSharedGoalEmailMock).not.toHaveBeenCalled();
  });

  it("should return 409 when goal already shared with another user", async () => {
    dbMock.executeTakeFirst
      .mockResolvedValueOnce({ user_id: 1 }) // owns
      .mockResolvedValueOnce({ id: 2, email: "buddy@example.com" }) // buddy
      .mockResolvedValueOnce({ buddy_id: 3 }); // already shared with someone else

    const res = await request(app)
      .post("/api/collab/goals/123/share")
      .send({ email: "buddy@example.com", permissions: "checkin" });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain("already shared");
    expect(sendSharedGoalEmailMock).not.toHaveBeenCalled();
  });

  it("should handle email failure gracefully", async () => {
    dbMock.executeTakeFirst
      .mockResolvedValueOnce({ user_id: 1 }) // owns
      .mockResolvedValueOnce({ id: 2, email: "buddy@example.com" }) // buddy
      .mockResolvedValueOnce(null) // not shared yet
      .mockResolvedValueOnce({
        title: "Test Goal",
        category: null,
        target_date: null,
      }) // goal
      .mockResolvedValueOnce({ email: "owner@example.com" }); // owner

    dbMock.executeTakeFirstOrThrow.mockResolvedValue({
      id: 20,
      goal_id: 123,
      owner_id: 1,
      buddy_id: 2,
      permissions: "view",
      created_at: new Date(),
    });

    sendSharedGoalEmailMock.mockResolvedValue(false); // simulate SMTP fail

    const res = await request(app)
      .post("/api/collab/goals/123/share")
      .send({ email: "buddy@example.com", permissions: "view" });

    expect(res.status).toBe(201);
    expect(res.body.goal_id).toBe(123);
    expect(res.body.emailSent).toBe(false);
  });
});
