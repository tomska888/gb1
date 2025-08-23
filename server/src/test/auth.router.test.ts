import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';

const user = { email: `testuser-${Date.now()}@example.com`, password: 'password123' };

describe('Auth Router', () => {
  it('should sign up a new user again (fresh)', async () => {
    const anotherUser = { email: `fresh-${Date.now()}@example.com`, password: 'password123' };
    const res = await request(app).post('/api/auth/signup').send(anotherUser);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(anotherUser.email);
  });

  it('should log in an existing user', async () => {
    await request(app).post('/api/auth/signup').send(user);
    const res = await request(app).post('/api/auth/login').send(user);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('should not log in with incorrect password', async () => {
    await request(app).post('/api/auth/signup').send(user);
    const res = await request(app).post('/api/auth/login').send({ ...user, password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('should not sign up with invalid email', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'bademail', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('should not sign up with short password', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: `shortpass-${Date.now()}@example.com`, password: '123' });
    expect(res.status).toBe(400);
  });

  it('should not log in with unknown user', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nonexistent@example.com', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('should not log in with missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: '' });
    expect(res.status).toBe(400);
  });
});