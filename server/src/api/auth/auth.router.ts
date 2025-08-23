import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../config/database.js';

export const authRouter = Router();

const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = signupSchema.parse(req.body);

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await db
      .insertInto('users')
      .values({
        email: email,
        password: passwordHash,
      })
      .returning(['id', 'email', 'created_at'])
      .executeTakeFirstOrThrow();

    res.status(201).json({
      message: 'User created successfully!',
      user: newUser,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Invalid input',
        errors: error.flatten().fieldErrors,
      });
      return;
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      res.status(409).json({
        message: 'This email address is already in use.',
      });
      return;
    }
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token: token,
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Invalid input',
        errors: error.flatten().fieldErrors,
      });
      return;
    }

    console.error('Error during login:', error);
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});