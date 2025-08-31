import request from "supertest";
import { app } from "../index.js";
import { expect, describe, it } from "vitest";

function uniqEmail(prefix: string) {
  return `${prefix}.${Date.now()}_${Math.floor(Math.random() * 1e6)}@test.local`;
}

async function createUserAndToken(
  email = uniqEmail("user"),
  password = "password123",
) {
  const signup = await request(app)
    .post("/api/auth/signup")
    .send({ email, password });
  expect([200, 201]).toContain(signup.status);

  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  expect(login.status).toBe(200);
  expect(login.body.token).toBeDefined();

  const me = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${login.body.token}`);
  expect(me.status).toBe(200);

  return { email, token: login.body.token as string, user: me.body };
}

async function createGoal(token: string, body: any = {}) {
  const res = await request(app)
    .post("/api/goals")
    .set("Authorization", `Bearer ${token}`)
    .send({ title: "Goal", ...body });
  expect(res.status).toBe(201);
  return res.body;
}

async function shareGoal(
  ownerToken: string,
  goalId: number,
  email: string,
  permissions: "view" | "checkin" = "checkin",
) {
  const res = await request(app)
    .post(`/api/collab/goals/${goalId}/share`)
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ email, permissions });
  expect([200, 201]).toContain(res.status);
  return res;
}

describe("Collab Router – extra coverage (isolated cases)", () => {
  it("GET /goals/:goalId/shares returns list for owner, 403 for buddy", async () => {
    const owner = await createUserAndToken(uniqEmail("owner"));
    const buddy = await createUserAndToken(uniqEmail("buddy"));

    const goal = await createGoal(owner.token, { title: "Alpha Collab" });
    await shareGoal(owner.token, goal.id, buddy.email, "checkin");

    const ok = await request(app)
      .get(`/api/collab/goals/${goal.id}/shares`)
      .set("Authorization", `Bearer ${owner.token}`);
    expect(ok.status).toBe(200);
    expect(Array.isArray(ok.body)).toBe(true);
    expect(ok.body[0]).toMatchObject({
      buddy_id: expect.any(Number),
      email: buddy.email,
    });

    const forbidden = await request(app)
      .get(`/api/collab/goals/${goal.id}/shares`)
      .set("Authorization", `Bearer ${buddy.token}`);
    expect(forbidden.status).toBe(403);
  });

  it("DELETE /goals/:goalId/share/:buddyId revokes access and clears dependent data", async () => {
    const owner = await createUserAndToken(uniqEmail("owner"));
    const buddy = await createUserAndToken(uniqEmail("buddy"));

    const goal = await createGoal(owner.token, { title: "Delta" });
    await shareGoal(owner.token, goal.id, buddy.email, "checkin");

    // buddy posts checkin + message first
    const c1 = await request(app)
      .post(`/api/collab/goals/${goal.id}/checkins`)
      .set("Authorization", `Bearer ${buddy.token}`)
      .send({ status: "on_track", progress: 40, note: "checking in" });
    expect(c1.status).toBe(201);

    const m1 = await request(app)
      .post(`/api/collab/goals/${goal.id}/messages`)
      .set("Authorization", `Bearer ${buddy.token}`)
      .send({ body: "hello!" });
    expect(m1.status).toBe(201);

    // revoke share
    const del = await request(app)
      .delete(`/api/collab/goals/${goal.id}/share/${buddy.user.id}`)
      .set("Authorization", `Bearer ${owner.token}`);
    expect(del.status).toBe(200);
    expect(del.body).toMatchObject({
      ok: true,
      clearedMessages: true,
      clearedBuddyCheckins: true,
    });

    // buddy now forbidden
    const after = await request(app)
      .get(`/api/collab/goals/${goal.id}/checkins`)
      .set("Authorization", `Bearer ${buddy.token}`);
    expect(after.status).toBe(403);
  });

  it("GET /owners aggregates owners for buddy and shows goal_count", async () => {
    const owner = await createUserAndToken(uniqEmail("owner"));
    const buddy = await createUserAndToken(uniqEmail("buddy"));

    const g1 = await createGoal(owner.token, { title: "One" });
    const g2 = await createGoal(owner.token, { title: "Two" });
    await shareGoal(owner.token, g1.id, buddy.email, "checkin");
    await shareGoal(owner.token, g2.id, buddy.email, "view");

    const owners = await request(app)
      .get("/api/collab/owners")
      .set("Authorization", `Bearer ${buddy.token}`);
    expect(owners.status).toBe(200);
    const mine = owners.body.find((r: any) => r.email === owner.email);
    expect(mine).toBeTruthy();
    expect(typeof mine.goal_count).toBe("number");
    expect(mine.goal_count).toBeGreaterThanOrEqual(2);
  });

  it("GET /goals/shared supports ownerId, q/category filters, and every sort branch", async () => {
    const owner = await createUserAndToken(uniqEmail("owner"));
    const buddy = await createUserAndToken(uniqEmail("buddy"));

    const g = await createGoal(owner.token, {
      title: "Zeta Music",
      category: "music",
      tags: "jam",
      target_date: null,
    });
    await shareGoal(owner.token, g.id, buddy.email, "checkin");

    const filters = await request(app)
      .get("/api/collab/goals/shared")
      .query({ q: "Zeta", category: "music", ownerId: owner.user.id })
      .set("Authorization", `Bearer ${buddy.token}`);
    expect(filters.status).toBe(200);
    expect(filters.body.data.some((x: any) => x.id === g.id)).toBe(true);

    for (const sort of [
      "created_asc",
      "created_desc",
      "target_asc",
      "target_desc",
      "title_asc",
      "title_desc",
    ] as const) {
      const r = await request(app)
        .get("/api/collab/goals/shared")
        .query({ sort })
        .set("Authorization", `Bearer ${buddy.token}`);
      expect(r.status).toBe(200);
    }

    const paged = await request(app)
      .get("/api/collab/goals/shared")
      .query({ page: 1, pageSize: 5 })
      .set("Authorization", `Bearer ${buddy.token}`);
    expect(paged.status).toBe(200);
    expect(paged.body).toHaveProperty("totalPages");
  });

  it("check-ins: view buddy blocked; checkin buddy ok; completed blocks buddy but not owner", async () => {
    const owner = await createUserAndToken(uniqEmail("owner"));
    const viewBuddy = await createUserAndToken(uniqEmail("vbuddy"));
    const checkBuddy = await createUserAndToken(uniqEmail("cbuddy"));

    const goalV = await createGoal(owner.token, { title: "ViewOnly" });
    await shareGoal(owner.token, goalV.id, viewBuddy.email, "view");

    const viewTry = await request(app)
      .post(`/api/collab/goals/${goalV.id}/checkins`)
      .set("Authorization", `Bearer ${viewBuddy.token}`)
      .send({ status: "on_track", progress: 10 });
    expect(viewTry.status).toBe(403);

    const ownerOk = await request(app)
      .post(`/api/collab/goals/${goalV.id}/checkins`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ status: "blocked", progress: 0 });
    expect(ownerOk.status).toBe(201);

    const goalC = await createGoal(owner.token, { title: "CheckinOK" });
    await shareGoal(owner.token, goalC.id, checkBuddy.email, "checkin");

    const buddyOk = await request(app)
      .post(`/api/collab/goals/${goalC.id}/checkins`)
      .set("Authorization", `Bearer ${checkBuddy.token}`)
      .send({ status: "on_track", progress: 55, note: "moving" });
    expect(buddyOk.status).toBe(201);

    // complete and ensure buddy blocked but owner allowed
    const complete = await request(app)
      .put(`/api/goals/${goalC.id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ status: "completed" });
    expect(complete.status).toBe(200);

    const buddyBlocked = await request(app)
      .post(`/api/collab/goals/${goalC.id}/checkins`)
      .set("Authorization", `Bearer ${checkBuddy.token}`)
      .send({ status: "done", progress: 100 });
    expect(buddyBlocked.status).toBe(409);

    const ownerStillOk = await request(app)
      .post(`/api/collab/goals/${goalC.id}/checkins`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ status: "done", progress: 100 });
    expect(ownerStillOk.status).toBe(201);
  });

  it("messages: checkin buddy can post, message rows expose _status/_progress; completed blocks buddy but not owner", async () => {
    const owner = await createUserAndToken(uniqEmail("owner"));
    const buddy = await createUserAndToken(uniqEmail("buddy"));

    const goal = await createGoal(owner.token, { title: "Msgs" });
    await shareGoal(owner.token, goal.id, buddy.email, "checkin");

    // establish status/progress context
    const c = await request(app)
      .post(`/api/collab/goals/${goal.id}/checkins`)
      .set("Authorization", `Bearer ${buddy.token}`)
      .send({ status: "on_track", progress: 40 });
    expect(c.status).toBe(201);

    const m = await request(app)
      .post(`/api/collab/goals/${goal.id}/messages`)
      .set("Authorization", `Bearer ${buddy.token}`)
      .send({ body: "msg after checkin" });
    expect(m.status).toBe(201);

    const msgs = await request(app)
      .get(`/api/collab/goals/${goal.id}/messages`)
      .set("Authorization", `Bearer ${buddy.token}`);
    expect(msgs.status).toBe(200);
    expect(Array.isArray(msgs.body)).toBe(true);
    expect(msgs.body[0]).toHaveProperty("_status", "on_track");
    expect(msgs.body[0]).toHaveProperty("_progress", 40);

    //buddy blocked, owner allowed
    const complete = await request(app)
      .put(`/api/goals/${goal.id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ status: "completed" });
    expect(complete.status).toBe(200);

    const buddyBlocked = await request(app)
      .post(`/api/collab/goals/${goal.id}/messages`)
      .set("Authorization", `Bearer ${buddy.token}`)
      .send({ body: "should block" });
    expect(buddyBlocked.status).toBe(409);

    const ownerOk = await request(app)
      .post(`/api/collab/goals/${goal.id}/messages`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ body: "owner can still post" });
    expect(ownerOk.status).toBe(201);
  });
});
