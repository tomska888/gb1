import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';

async function auth() {
  const email = `gextra_${Math.random().toString(36).slice(2)}@example.com`;
  const password = 'password123';
  await request(app).post('/api/auth/signup').send({ email, password });
  const login = await request(app).post('/api/auth/login').send({ email, password });
  return { token: login.body.token, email };
}

async function createGoal(token: string, payload: any = {}) {
  const res = await request(app)
    .post('/api/goals')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Seed', ...payload });
  expect(res.status).toBe(201);
  return res.body;
}

describe('Goals Router – extras', () => {
    it('should update fields including status and allowed nullables', async () => {
    const { token } = await auth();
    const g = await createGoal(token, {
        description: 'd1',
        target_date: null,
        category: 'fitness',
        tags: 'hi',
        color: '#ff0',
    });

    const patch = await request(app)
        .put(`/api/goals/${g.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
        title: 'Updated',
        description: '',
        target_date: null,
        status: 'completed',
        category: '',
        tags: '',
        color: '#00ff00',
        });

    expect(patch.status).toBe(200);
    expect(patch.body.title).toBe('Updated');
    expect(patch.body.description).toBe('');
    expect(patch.body.target_date).toBeNull();
    expect(patch.body.status).toBe('completed');
    expect(patch.body.category).toBe('');
    expect(patch.body.tags).toBe('');
    expect(patch.body.color).toBe('#00ff00');
    });

  it('should return 400 when updating with empty body', async () => {
    const { token } = await auth();
    const g = await createGoal(token);

    const res = await request(app)
      .put(`/api/goals/${g.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/No fields to update/i);
  });

  it('delete: 404 for missing and 200 for existing', async () => {
    const { token } = await auth();

    const notFound = await request(app)
      .delete('/api/goals/999999')
      .set('Authorization', `Bearer ${token}`);
    expect(notFound.status).toBe(404);

    const g = await createGoal(token);
    const ok = await request(app)
      .delete(`/api/goals/${g.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(ok.status).toBe(200);
    expect(ok.body.ok).toBe(true);
  });

    it('categories returns distinct non-null categories (sorted)', async () => {
    const { token } = await auth();
    await createGoal(token, { title: 'A', category: 'fitness' });
    await createGoal(token, { title: 'B', category: 'learning' });
    await createGoal(token, { title: 'C' });

    const res = await request(app)
        .get('/api/goals/categories')
        .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(['fitness', 'learning']);
    });

  it('counters compute numbers and respect filters', async () => {
    const { token } = await auth();
    const g1 = await createGoal(token, { title: 'Alpha', category: 'fitness' });
    const g2 = await createGoal(token, { title: 'Beta note', category: 'fitness' });
    const g3 = await createGoal(token, { title: 'Gamma', category: 'learning' });

    await request(app).put(`/api/goals/${g2.id}`).set('Authorization', `Bearer ${token}`).send({ status: 'completed' });
    await request(app).put(`/api/goals/${g3.id}`).set('Authorization', `Bearer ${token}`).send({ status: 'abandoned' });

    const c0 = await request(app).get('/api/goals/counters').set('Authorization', `Bearer ${token}`);
    expect(c0.status).toBe(200);
    expect(c0.body.all).toBe(3);
    expect(c0.body.in_progress).toBe(1);
    expect(c0.body.completed).toBe(1);
    expect(c0.body.abandoned).toBe(1);

    const c1 = await request(app)
      .get('/api/goals/counters')
      .query({ q: 'note', category: 'fitness' })
      .set('Authorization', `Bearer ${token}`);
    expect(c1.status).toBe(200);
    expect(c1.body.all).toBe(1);
    expect(c1.body.completed).toBe(1);
  });

  it('list supports filters & sorts', async () => {
    const { token } = await auth();
    await createGoal(token, { title: 'B title', target_date: null });
    await createGoal(token, { title: 'A title', target_date: null });

    const res1 = await request(app)
      .get('/api/goals')
      .query({ sort: 'title_asc' })
      .set('Authorization', `Bearer ${token}`);
    expect(res1.status).toBe(200);
    expect(res1.body.data[0].title).toBe('A title');

    const res2 = await request(app)
      .get('/api/goals')
      .query({ q: 'title', status: 'all', sort: 'created_desc' })
      .set('Authorization', `Bearer ${token}`);
    expect(res2.status).toBe(200);
    expect(Array.isArray(res2.body.data)).toBe(true);
  });
});
