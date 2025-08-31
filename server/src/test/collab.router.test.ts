import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../index.js";

async function makeUser(prefix = "u") {
  const email = `${prefix}_${Math.random().toString(36).slice(2)}@example.com`;
  const password = "password123";
  await request(app).post("/api/auth/signup").send({ email, password });
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return { email, token: login.body.token, user: login.body.user };
}
async function createGoal(token: string, payload: any = {}) {
  const res = await request(app)
    .post("/api/goals")
    .set("Authorization", `Bearer ${token}`)
    .send({ title: "Shared Goal", ...payload });
  expect(res.status).toBe(201);
  return res.body;
}

describe("Collab Router", () => {
  it("share flow: 403 if not owner, 404 user not found, 400 self share, 201 share, 200 alreadyShared, 409 if already shared with someone else", async () => {
    const owner = await makeUser("owner");
    const buddy = await makeUser("buddy");
    const intruder = await makeUser("intruder");
    const goal = await createGoal(owner.token);

    // not owner -> 403
    const f1 = await request(app)
      .post(`/api/collab/goals/${goal.id}/share`)
      .set("Authorization", `Bearer ${buddy.token}`)
      .send({ email: owner.email });
    expect(f1.status).toBe(403);

    // user not found -> 404
    const nf = await request(app)
      .post(`/api/collab/goals/${goal.id}/share`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: "missing@example.com" });
    expect(nf.status).toBe(404);

    // self share -> 400
    const self = await request(app)
      .post(`/api/collab/goals/${goal.id}/share`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: owner.email });
    expect(self.status).toBe(400);

    // success -> 201
    const ok = await request(app)
      .post(`/api/collab/goals/${goal.id}/share`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: buddy.email, permissions: "checkin" });
    expect(ok.status).toBe(201);
    const share = ok.body;

    // already shared with the same user -> 200
    const again = await request(app)
      .post(`/api/collab/goals/${goal.id}/share`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: buddy.email });
    expect(again.status).toBe(200);
    expect(again.body.alreadyShared).toBe(true);

    // share with a different user -> 409 single-share rule
    const different = await request(app)
      .post(`/api/collab/goals/${goal.id}/share`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: intruder.email });
    expect(different.status).toBe(409);

    // list shares -> owner sees the buddy
    const list = await request(app)
      .get(`/api/collab/goals/${goal.id}/shares`)
      .set("Authorization", `Bearer ${owner.token}`);
    expect(list.status).toBe(200);
    expect(list.body.length).toBe(1);
    expect(list.body[0].buddy_id).toBe(share.buddy_id);
  });

  it("check-ins + messages permissions and completed-goal behavior", async () => {
    const owner = await makeUser("ow");
    const buddy = await makeUser("bd");
    const goal = await createGoal(owner.token);

    // share with "checkin" so buddy can post
    const s = await request(app)
      .post(`/api/collab/goals/${goal.id}/share`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: buddy.email, permissions: "checkin" });
    expect(s.status).toBe(201);
    const buddyId = s.body.buddy_id;

    // buddy posts a check-in
    const c1 = await request(app)
      .post(`/api/collab/goals/${goal.id}/checkins`)
      .set("Authorization", `Bearer ${buddy.token}`)
      .send({ status: "on_track", progress: 10, note: "hello" });
    expect(c1.status).toBe(201);

    // buddy posts a message
    const m1 = await request(app)
      .post(`/api/collab/goals/${goal.id}/messages`)
      .set("Authorization", `Bearer ${buddy.token}`)
      .send({ body: "keep going!" });
    expect(m1.status).toBe(201);

    // owner completes the goal
    const up = await request(app)
      .put(`/api/goals/${goal.id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ status: "completed" });
    expect(up.status).toBe(200);

    // buddy now blocked from posting check-ins/messages (409 for completed)
    const c2 = await request(app)
      .post(`/api/collab/goals/${goal.id}/checkins`)
      .set("Authorization", `Bearer ${buddy.token}`)
      .send({ status: "done" });
    expect(c2.status).toBe(409);

    const m2 = await request(app)
      .post(`/api/collab/goals/${goal.id}/messages`)
      .set("Authorization", `Bearer ${buddy.token}`)
      .send({ body: "can I still post?" });
    expect(m2.status).toBe(409);

    // owner can still post on completed goal
    const c3 = await request(app)
      .post(`/api/collab/goals/${goal.id}/checkins`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ status: "done" });
    expect(c3.status).toBe(201);

    // messages list shows last one and includes joined fields
    const msgs = await request(app)
      .get(`/api/collab/goals/${goal.id}/messages`)
      .set("Authorization", `Bearer ${owner.token}`);
    expect(msgs.status).toBe(200);
    expect(Array.isArray(msgs.body)).toBe(true);
    expect(msgs.body[0]).toHaveProperty("body");
    expect(msgs.body[0]).toHaveProperty("_status");
    expect(msgs.body[0]).toHaveProperty("_progress");

    // delete the share (owner) -> clears buddy checkins + messages
    const del = await request(app)
      .delete(`/api/collab/goals/${goal.id}/share/${buddyId}`)
      .set("Authorization", `Bearer ${owner.token}`);
    expect(del.status).toBe(200);
    expect(del.body).toMatchObject({
      ok: true,
      clearedMessages: true,
      clearedBuddyCheckins: true,
    });

    const sharesAfter = await request(app)
      .get(`/api/collab/goals/${goal.id}/shares`)
      .set("Authorization", `Bearer ${owner.token}`);
    expect(sharesAfter.status).toBe(200);
    expect(sharesAfter.body.length).toBe(0);
  });

  it("owners + shared goals listing + access control", async () => {
    const owner = await makeUser("owner2");
    const buddy = await makeUser("buddy2");
    const stranger = await makeUser("stranger");

    const goal = await createGoal(owner.token, {
      title: "Learn Rust",
      category: "learning",
      tags: "langs,sys",
    });

    // share with buddy
    const s = await request(app)
      .post(`/api/collab/goals/${goal.id}/share`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: buddy.email, permissions: "checkin" });
    expect(s.status).toBe(201);

    // buddy sees owners aggregation
    const owners = await request(app)
      .get("/api/collab/owners")
      .set("Authorization", `Bearer ${buddy.token}`);
    expect(owners.status).toBe(200);
    expect(owners.body[0].goal_count).toBeGreaterThanOrEqual(1);

    // buddy lists shared goals with filters
    const shared = await request(app)
      .get("/api/collab/goals/shared")
      .query({ q: "Rust", sort: "title_asc", status: "all" })
      .set("Authorization", `Bearer ${buddy.token}`);
    expect(shared.status).toBe(200);
    expect(shared.body.data.length).toBeGreaterThanOrEqual(1);

    // stranger cannot read checkins (no access)
    const forbidden = await request(app)
      .get(`/api/collab/goals/${goal.id}/checkins`)
      .set("Authorization", `Bearer ${stranger.token}`);
    expect(forbidden.status).toBe(403);

    // buddy with 'view' cannot post
    // revoke current share, share again with view
    await request(app)
      .delete(`/api/collab/goals/${goal.id}/share/${s.body.buddy_id}`)
      .set("Authorization", `Bearer ${owner.token}`);
    const s2 = await request(app)
      .post(`/api/collab/goals/${goal.id}/share`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: buddy.email, permissions: "view" });
    expect(s2.status).toBe(201);

    const cannotPost = await request(app)
      .post(`/api/collab/goals/${goal.id}/checkins`)
      .set("Authorization", `Bearer ${buddy.token}`)
      .send({ status: "on_track" });
    expect(cannotPost.status).toBe(403);
  });
});
