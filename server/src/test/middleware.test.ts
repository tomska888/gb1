import { describe, it, expect, vi } from 'vitest';
import { authenticateToken } from '../middleware/middleware.js';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'testsecret';

describe('Middleware: authenticateToken', () => {
  it('should call next() if token is valid', () => {
    const token = jwt.sign({ userId: 123 }, process.env.JWT_SECRET as string);
    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    authenticateToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe(123);
  });

  it('should return 401 if no auth header', () => {
    const req = { headers: {} } as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
  });

  it('should return 403 if token is invalid', () => {
    const req = { headers: { authorization: 'Bearer invalidtoken' } } as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalled();
  });

  it('should return 403 if token is expired', () => {
    const expiredToken = jwt.sign({ userId: 1 }, process.env.JWT_SECRET as string, { expiresIn: -1 });
    const req = { headers: { authorization: `Bearer ${expiredToken}` } } as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalled();
  });
});