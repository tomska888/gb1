import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';

async function auth() {
  const email = `g_${Math.random().toString(36).slice(2)}@example.com`;
  const password = 'password123';
  await request(app).post('/api/auth/signup').send({ email, password });
  const login = await request(app).post('/api/auth/login').send({ email, password });
  return { token: login.body.token, email };
}

describe('Goals Router', () => {
  it('should create a new goal', async () => {
    const { token } = await auth();

    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Learn TypeScript',
        description: 'Finish docs',
        target_date: null,
        category: 'learning',
        tags: 'ts,dev',
        color: '#ff00ff',
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Learn TypeScript');
    expect(res.body.status).toBe('in_progress');
  });

  it('should create goal without description (defaults to empty string)', async () => {
    const { token } = await auth();

    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'No Description',
        target_date: null,
      });

    expect(res.status).toBe(201);
    expect(res.body.description).toBe('');
  });

  it('should create goal without target_date (stored as null)', async () => {
    const { token } = await auth();

    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'No date' });

    expect(res.status).toBe(201);
    expect(res.body.target_date).toBeNull();
  });

  it('should get paginated goals for the user', async () => {
    const { token } = await auth();

    await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'G1' });

    const res = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.page).toBe(1);
    expect(Number(res.body.total)).toBeGreaterThanOrEqual(1);
  });

  it('should access protected /api/auth/me (instead of non-existent test route)', async () => {
    const { token, email } = await auth();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
  });

  it('should reject access with missing token', async () => {
    const res = await request(app).get('/api/goals');
    expect(res.status).toBe(401);
  });

  it('should return 404 for non-existent route under /api/goals', async () => {
    const { token } = await auth();
    const res = await request(app)
      .get('/api/goals/not-here')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
