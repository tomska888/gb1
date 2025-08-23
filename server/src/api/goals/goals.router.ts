import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { authenticateToken } from '../../middleware/middleware.js';

export const goalsRouter = Router();

const createGoalSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().optional(),
  target_date: z.string().date().optional(),
});

goalsRouter.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, target_date } = createGoalSchema.parse(req.body);
    const userId = req.userId!;

    const newGoal = await db
      .insertInto('goals')
      .values({
        user_id: userId,
        title: title,
        description: description,
        target_date: target_date ? new Date(target_date) : undefined,
        status: "in_progress",
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    res.status(201).json(newGoal);
    return;

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Invalid input',
        errors: error.flatten().fieldErrors,
      });
      return;
    }
    console.error('Error creating goal:', error);
    res.status(500).json({ message: 'Failed to create goal.' });
    return;
  }
});

goalsRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const goals = await db
      .selectFrom('goals')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .execute();

    res.status(200).json(goals);

  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ message: 'Failed to fetch goals.' });
  }
});

goalsRouter.get('/test', authenticateToken, (req: Request, res: Response) => {
  res.status(200).json({
    message: `You have accessed a protected route!`,
    userId: req.userId,
  });
});