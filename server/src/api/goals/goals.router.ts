import { Router } from 'express'
import { z } from 'zod'
import { db } from '../../config/database.js'
import { authenticateToken } from '../../middleware/middleware.js'

type Status = 'in_progress' | 'completed' | 'abandoned'

const router = Router()

// helpers
const toDateOrNull = (v: string | null | undefined): Date | null => (v ? new Date(v) : null)

// ------- Schemas -------
const createGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  target_date: z.string().nullable().optional(), // ISO date, converted to Date
})

const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  target_date: z.string().nullable().optional(),
  status: z.enum(['in_progress', 'completed', 'abandoned']).optional(),
})

// ------- Create -------
router.post('/', authenticateToken, async (req, res, next): Promise<void> => {
  try {
    const body = createGoalSchema.parse(req.body)

    const inserted = await db
      .insertInto('goals')
      .values({
        user_id: req.userId!,
        title: body.title,
        description: body.description ?? '',
        target_date: toDateOrNull(body.target_date),
        status: 'in_progress' as Status,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    res.status(201).json(inserted)
  } catch (err) {
    next(err)
  }
})

// ------- List (mine) -------
router.get('/', authenticateToken, async (req, res, next): Promise<void> => {
  try {
    const rows = await db
      .selectFrom('goals')
      .selectAll()
      .where('user_id', '=', req.userId!)
      .orderBy('created_at', 'desc')
      .execute()

    res.json(rows)
  } catch (err) {
    next(err)
  }
})

// ------- Update (partial) -------
router.put('/:id', authenticateToken, async (req, res, next): Promise<void> => {
  try {
    const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(req.params)
    const patch = updateGoalSchema.parse(req.body)

    if (
      patch.title === undefined &&
      patch.description === undefined &&
      patch.target_date === undefined &&
      patch.status === undefined
    ) {
      res.status(400).json({ message: 'No fields to update' })
      return
    }

    const updates: {
      title?: string
      description?: string | null
      target_date?: Date | null
      status?: Status
    } = {}

    if (patch.title !== undefined) updates.title = patch.title
    if (patch.description !== undefined) updates.description = patch.description ?? null
    if (patch.target_date !== undefined) updates.target_date = toDateOrNull(patch.target_date)
    if (patch.status !== undefined) updates.status = patch.status

    const updated = await db
      .updateTable('goals')
      .set(updates)
      .where('id', '=', id)
      .where('user_id', '=', req.userId!)
      .returningAll()
      .executeTakeFirst()

    if (!updated) {
      res.status(404).json({ message: 'Goal not found' })
      return
    }

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// ------- Delete -------
router.delete('/:id', authenticateToken, async (req, res, next): Promise<void> => {
  try {
    const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(req.params)

    const del = await db
      .deleteFrom('goals')
      .where('id', '=', id)
      .where('user_id', '=', req.userId!)
      .returning(['id'])
      .executeTakeFirst()

    if (!del) {
      res.status(404).json({ message: 'Goal not found' })
      return
    }

    res.json({ ok: true, id: del.id })
  } catch (err) {
    next(err)
  }
})

// ---- EXPORTS (named + default) ----
export const goalsRouter = router
export default goalsRouter
