import { Router } from 'express'
import { z } from 'zod'
import { db } from '../../config/database.js'
import { authenticateToken } from '../../middleware/middleware.js'

type Status = 'in_progress' | 'completed' | 'abandoned'
const router = Router()

const toDateOrNull = (v: string | null | undefined): Date | null => (v ? new Date(v) : null)

/* Schemas */
const createGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  target_date: z.string().nullable().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  color: z.string().optional(),
})
const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  target_date: z.string().nullable().optional(),
  status: z.enum(['in_progress', 'completed', 'abandoned']).optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  color: z.string().optional(),
})
const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(50).optional().default(10),
  status: z.enum(['all', 'in_progress', 'completed', 'abandoned']).optional().default('in_progress'),
  q: z.string().optional().default(''),
  sort: z.enum(['created_desc','created_asc','target_asc','target_desc','title_asc','title_desc']).optional().default('created_desc'),
  category: z.string().optional().default(''),
})

/* Create */
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
        category: body.category ?? null,
        tags: body.tags ?? null,
        color: body.color ?? null,
      } as any)
      .returningAll()
      .executeTakeFirstOrThrow()
    res.status(201).json(inserted)
  } catch (err) { next(err) }
})

/* List (pagination + filters) */
router.get('/', authenticateToken, async (req, res, next): Promise<void> => {
  try {
    const qp = listQuerySchema.parse(req.query)

    const base = db.selectFrom('goals').where('user_id', '=', req.userId!)
    const withStatus = qp.status === 'all' ? base : base.where('status', '=', qp.status as Exclude<typeof qp.status,'all'>)
    const withCat = qp.category ? withStatus.where('category' as any, '=', qp.category) : withStatus
    const withSearch = qp.q
      ? withCat.where(eb => eb.or([
          eb('title', 'ilike', `%${qp.q}%`),
          eb('description', 'ilike', `%${qp.q}%`),
          eb('tags' as any, 'ilike', `%${qp.q}%`),
        ]))
      : withCat

    let sorted = withSearch
    switch (qp.sort) {
      case 'created_asc':  sorted = sorted.orderBy('created_at', 'asc'); break
      case 'created_desc': sorted = sorted.orderBy('created_at', 'desc'); break
      case 'target_asc':   sorted = sorted.orderBy('target_date', 'asc'); break
      case 'target_desc':  sorted = sorted.orderBy('target_date', 'desc'); break
      case 'title_asc':    sorted = sorted.orderBy('title', 'asc'); break
      case 'title_desc':   sorted = sorted.orderBy('title', 'desc'); break
    }

    const offset = (qp.page - 1) * qp.pageSize
    const data = await sorted.selectAll().limit(qp.pageSize).offset(offset).execute()
    const totalRow = await withSearch.select(({ fn }) => fn.count<number>('id').as('count')).executeTakeFirst()
    const total = totalRow?.count ?? 0
    const totalPages = Math.max(1, Math.ceil(total / qp.pageSize))
    res.json({ data, page: qp.page, pageSize: qp.pageSize, total, totalPages })
  } catch (err) { next(err) }
})

/* Update */
router.put('/:id', authenticateToken, async (req, res, next): Promise<void> => {
  try {
    const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(req.params)
    const patch = updateGoalSchema.parse(req.body)
    if (Object.keys(patch).length === 0) { res.status(400).json({ message: 'No fields to update' }); return }

    const updates: any = {}
    if (patch.title !== undefined) updates.title = patch.title
    if (patch.description !== undefined) updates.description = patch.description ?? null
    if (patch.target_date !== undefined) updates.target_date = toDateOrNull(patch.target_date)
    if (patch.status !== undefined) updates.status = patch.status
    if (patch.category !== undefined) updates.category = patch.category ?? null
    if (patch.tags !== undefined) updates.tags = patch.tags ?? null
    if (patch.color !== undefined) updates.color = patch.color ?? null

    const updated = await db.updateTable('goals').set(updates)
      .where('id', '=', id).where('user_id', '=', req.userId!)
      .returningAll().executeTakeFirst()

    if (!updated) { res.status(404).json({ message: 'Goal not found' }); return }
    res.json(updated)
  } catch (err) { next(err) }
})

/* Delete */
router.delete('/:id', authenticateToken, async (req, res, next): Promise<void> => {
  try {
    const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(req.params)
    const del = await db.deleteFrom('goals').where('id', '=', id).where('user_id', '=', req.userId!).returning(['id']).executeTakeFirst()
    if (!del) { res.status(404).json({ message: 'Goal not found' }); return }
    res.json({ ok: true, id: del.id })
  } catch (err) { next(err) }
})

/* Categories (distinct) */
router.get('/categories', authenticateToken, async (req, res, next): Promise<void> => {
  try {
    const rows = await db.selectFrom('goals')
      .select('category' as any).distinct()
      .where('user_id', '=', req.userId!)
      .where('category' as any, 'is not', null)
      .orderBy('category' as any, 'asc').execute()
    res.json((rows.map(r => (r as any).category).filter(Boolean)) as string[])
  } catch (err) { next(err) }
})

/* Counters (for tab badges) */
router.get('/counters', authenticateToken, async (req, res, next): Promise<void> => {
  try {
    const q = (req.query.q as string) ?? ''
    const category = (req.query.category as string) ?? ''
    const base = db.selectFrom('goals').where('user_id', '=', req.userId!)
    const withCat = category ? base.where('category' as any, '=', category) : base
    const withSearch = q
      ? withCat.where(eb => eb.or([
          eb('title', 'ilike', `%${q}%`),
          eb('description', 'ilike', `%${q}%`),
          eb('tags' as any, 'ilike', `%${q}%`),
        ]))
      : withCat

    const rows = await withSearch
      .select(['status']).select(({ fn }) => fn.count<number>('id').as('cnt'))
      .groupBy('status').execute()

    let in_progress = 0, completed = 0, abandoned = 0
    for (const r of rows as Array<{ status: Status; cnt: number }>) {
      if (r.status === 'in_progress') in_progress = r.cnt
      if (r.status === 'completed')  completed = r.cnt
      if (r.status === 'abandoned')  abandoned = r.cnt
    }
    const all = in_progress + completed + abandoned
    res.json({ all, in_progress, completed, abandoned })
  } catch (err) { next(err) }
})

export const goalsRouter = router
export default goalsRouter
