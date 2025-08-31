import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../index.js";

describe("Auth Router – more cases", () => {
  it("should return 409 on duplicate signup (unique email violation)", async () => {
    const user = {
      email: `dup_${Math.random().toString(36).slice(2)}@example.com`,
      password: "password123",
    };

    const s1 = await request(app).post("/api/auth/signup").send(user);
    expect(s1.status).toBe(201);

    const s2 = await request(app).post("/api/auth/signup").send(user);
    expect(s2.status).toBe(409);
    expect(s2.body.message).toMatch(/already in use/i);
  });

  it("GET /api/auth/me -> 404 if user no longer exists (valid token pointing to missing id)", async () => {
    const token = jwt.sign({ userId: 999999 }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/User not found/i);
  });
});
