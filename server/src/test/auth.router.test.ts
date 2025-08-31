import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';

function u() {
  const id = Math.random().toString(36).slice(2);
  return { email: `user_${id}@example.com`, password: 'password123' };
}

describe('Auth Router', () => {
  it('should sign up and then log in successfully', async () => {
    const user = u();

    const signup = await request(app).post('/api/auth/signup').send(user);
    expect(signup.status).toBe(201);

    const login = await request(app).post('/api/auth/login').send(user);
    expect(login.status).toBe(200);
    expect(login.body.token).toBeDefined();
    expect(login.body.user?.email).toBe(user.email);
    expect(login.body.user?.created_at).toBeDefined();
  });

  it('should not log in with incorrect password', async () => {
    const user = u();
    await request(app).post('/api/auth/signup').send(user);

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong' });

    expect(bad.status).toBe(401);
  });

  it('should not sign up with invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'nope', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('should not sign up with short password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'a@b.com', password: 'short' });
    expect(res.status).toBe(400);
  });

  it('should not log in with unknown user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me should work with a valid token', async () => {
    const user = u();
    await request(app).post('/api/auth/signup').send(user);
    const login = await request(app).post('/api/auth/login').send(user);

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(me.status).toBe(200);
    expect(me.body.email).toBe(user.email);
    expect(me.body.id).toBeDefined();
  });
});
