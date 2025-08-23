import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';

let token: string;

beforeAll(async () => {
  const email = `goaluser-${Date.now()}@example.com`;
  const password = 'password123';
  await request(app).post('/api/auth/signup').send({ email, password });
  const res = await request(app).post('/api/auth/login').send({ email, password });
  token = res.body.token;
});

describe('Goals Router', () => {
  it('should create a new goal', async () => {
    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Learn TypeScript',
        description: 'Complete the handbook',
        target_date: '2025-09-30',
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Learn TypeScript');
  });

  it('should create goal without description', async () => {
    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Goal with no description',
        target_date: '2025-10-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.description).toBeNull();
  });

  it('should create goal without target_date', async () => {
    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Goal with no target date',
        description: 'Still a valid goal',
      });

    expect(res.status).toBe(201);
    expect(res.body.target_date).toBeNull();
  });

  it('should get all goals for the user', async () => {
    const res = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should access protected test route', async () => {
    const res = await request(app)
      .get('/api/goals/test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBeDefined();
  });

  it('should reject access with missing token', async () => {
    const res = await request(app).get('/api/goals');
    expect(res.status).toBe(401);
  });

  it('should return 404 for non-existent route', async () => {
    const res = await request(app)
      .patch('/api/goals/999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Non-existent goal' });
    expect(res.status).toBe(404);
  });
});