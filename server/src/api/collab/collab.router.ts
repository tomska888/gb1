import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import type { ExpressionBuilder } from 'kysely'
import { db } from '../../config/database.js'
import { authenticateToken } from '../../middleware/middleware.js'
import type { Database } from '../../types/db.js'

const router = Router()

/* ---------- helpers ---------- */

async function userOwnsGoal(userId: number, goalId: number): Promise<boolean> {
  const row = await db
    .selectFrom('goals')
    .select('user_id')
    .where('id', '=', goalId)
    .executeTakeFirst()
  return row?.user_id === userId
}

async function userHasShare(userId: number, goalId: number): Promise<boolean> {
  const row = await db
    .selectFrom('goal_shares')
    .select('id')
    .where('goal_id', '=', goalId)
    .where('buddy_id', '=', userId)
    .executeTakeFirst()
  return !!row
}

async function getShareForBuddy(userId: number, goalId: number) {
  return await db
    .selectFrom('goal_shares')
    .select(['permissions', 'owner_id'])
    .where('goal_id', '=', goalId)
    .where('buddy_id', '=', userId)
    .executeTakeFirst()
}

async function canAccess(userId: number, goalId: number): Promise<boolean> {
  if (await userOwnsGoal(userId, goalId)) return true
  if (await userHasShare(userId, goalId)) return true
  return false
}

/** buddies may post only if they have 'checkin' permission. owners can always post */
async function canPostOnGoal(userId: number, goalId: number): Promise<boolean> {
  if (await userOwnsGoal(userId, goalId)) return true
  const share = await getShareForBuddy(userId, goalId)
  return !!share && share.permissions === 'checkin'
}

/* ---------- validation ---------- */

const PathGoalId = z.object({ goalId: z.coerce.number().int().positive() })

/* =======================================================================
   SHARES  (/api/collab)
   ======================================================================= */

// POST /api/collab/goals/:goalId/share
router.post(
  '/goals/:goalId/share',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { goalId } = PathGoalId.parse(req.params)
      const { email, permissions } = z
        .object({
          email: z.string().email(),
          permissions: z.enum(['view', 'checkin']).optional().default('checkin'),
        })
        .parse(req.body)

      if (!(await userOwnsGoal(req.userId!, goalId))) {
        res.status(403).json({ message: 'Forbidden' }); return
      }

      const buddy = await db
        .selectFrom('users')
        .select(['id', 'email'])
        .where('email', '=', email)
        .executeTakeFirst()

      if (!buddy) { res.status(404).json({ message: 'User not found' }); return }
      if (buddy.id === req.userId) { res.status(400).json({ message: 'Cannot share with yourself' }); return }

      const inserted = await db
        .insertInto('goal_shares')
        .values({
          goal_id: goalId,
          owner_id: req.userId!,
          buddy_id: buddy.id,
          permissions,
        })
        .onConflict(oc => oc.columns(['goal_id', 'buddy_id']).doNothing())
        .returningAll()
        .executeTakeFirst()

      res.status(201).json(inserted ?? { alreadyShared: true })
    } catch (e) {
      next(e)
    }
  }
)

// GET /api/collab/goals/:goalId/shares
router.get(
  '/goals/:goalId/shares',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { goalId } = PathGoalId.parse(req.params)
      if (!(await userOwnsGoal(req.userId!, goalId))) { res.status(403).json({ message: 'Forbidden' }); return }

      const rows = await db
        .selectFrom('goal_shares')
        .innerJoin('users', 'users.id', 'goal_shares.buddy_id')
        .select([
          'goal_shares.id as id',
          'goal_shares.buddy_id as buddy_id',
          'users.email as email',
          'goal_shares.permissions as permissions',
          'goal_shares.created_at as created_at',
        ])
        .where('goal_shares.goal_id', '=', goalId)
        .execute()

      res.json(rows)
    } catch (e) { next(e) }
  }
)

// DELETE /api/collab/goals/:goalId/share/:buddyId
router.delete(
  '/goals/:goalId/share/:buddyId',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { goalId, buddyId } = z.object({
        goalId: z.coerce.number().int().positive(),
        buddyId: z.coerce.number().int().positive(),
      }).parse(req.params)

      if (!(await userOwnsGoal(req.userId!, goalId))) { res.status(403).json({ message: 'Forbidden' }); return }

      await db.transaction().execute(async (trx) => {
        // remove chat/messages (global per-goal)
        await trx.deleteFrom('goal_messages').where('goal_id', '=', goalId).execute()
        // remove buddy-authored checkins (owner history stays)
        await trx
          .deleteFrom('goal_checkins')
          .where('goal_id', '=', goalId)
          .where('user_id', '=', buddyId)
          .execute()
        // remove the share row
        await trx
          .deleteFrom('goal_shares')
          .where('goal_id', '=', goalId)
          .where('buddy_id', '=', buddyId)
          .execute()
      })

      res.json({ ok: true, clearedMessages: true, clearedBuddyCheckins: true })
    } catch (e) { next(e) }
  }
)

/* =======================================================================
   WHO SHARES WITH ME
   ======================================================================= */

// GET /api/collab/owners
router.get(
  '/owners',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rows = await db
        .selectFrom('goal_shares')
        .innerJoin('users', 'users.id', 'goal_shares.owner_id')
        .select([
          'goal_shares.owner_id as owner_id',
          'users.email as email',
        ])
        .select((eb) => eb.fn.count<number>('goal_shares.goal_id').as('goal_count'))
        .where('goal_shares.buddy_id', '=', req.userId!)
        .groupBy(['goal_shares.owner_id', 'users.email'])
        .orderBy('users.email', 'asc')
        .execute()

      res.json(rows.map(r => ({
        owner_id: r.owner_id,
        email: r.email,
        goal_count: Number((r as any).goal_count ?? 0),
      })))
    } catch (e) { next(e) }
  }
)

/* =======================================================================
   LIST SHARED
   ======================================================================= */

// GET /api/collab/goals/shared
router.get(
  '/goals/shared',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const qp = z.object({
        page: z.coerce.number().int().positive().optional().default(1),
        pageSize: z.coerce.number().int().positive().max(50).optional().default(10),
        q: z.string().optional().default(''),
        sort: z.enum(['created_desc','created_asc','target_asc','target_desc','title_asc','title_desc'])
              .optional().default('created_desc'),
        category: z.string().optional().default(''),
        status: z.enum(['all','in_progress','completed','abandoned']).optional().default('all'),
        ownerId: z.coerce.number().int().positive().optional(),
      }).parse(req.query)

      let base = db
        .selectFrom('goals')
        .innerJoin('goal_shares', 'goal_shares.goal_id', 'goals.id')
        .select([
          'goals.id',
          'goals.user_id',
          'goals.title',
          'goals.description',
          'goals.target_date',
          'goals.status',
          'goals.created_at',
          'goals.category',
          'goals.tags',
          'goals.color',
          'goal_shares.owner_id',
          'goal_shares.permissions as permissions', // expose permission to client
        ])
        .where('goal_shares.buddy_id', '=', req.userId!)

      if (qp.ownerId) base = base.where('goal_shares.owner_id', '=', qp.ownerId)

      const withStatus = qp.status === 'all' ? base : base.where('goals.status', '=', qp.status)
      const withCat = qp.category ? withStatus.where('goals.category', '=', qp.category) : withStatus
      const withSearch = qp.q
        ? withCat.where((eb: ExpressionBuilder<Database, 'goals'>) =>
            eb.or([
              eb('goals.title', 'ilike', `%${qp.q}%`),
              eb('goals.description', 'ilike', `%${qp.q}%`),
              eb('goals.tags', 'ilike', `%${qp.q}%`),
            ])
          )
        : withCat

      let sorted = withSearch
      switch (qp.sort) {
        case 'created_asc':  sorted = sorted.orderBy('goals.created_at', 'asc'); break
        case 'created_desc': sorted = sorted.orderBy('goals.created_at', 'desc'); break
        case 'target_asc':   sorted = sorted.orderBy('goals.target_date', 'asc'); break
        case 'target_desc':  sorted = sorted.orderBy('goals.target_date', 'desc'); break
        case 'title_asc':    sorted = sorted.orderBy('goals.title', 'asc'); break
        case 'title_desc':   sorted = sorted.orderBy('goals.title', 'desc'); break
      }

      const offset = (qp.page - 1) * qp.pageSize
      const data = await sorted.limit(qp.pageSize).offset(offset).execute()

      const totalRow = await withSearch
        .clearSelect()
        .select((eb: ExpressionBuilder<Database, 'goals'>) => eb.fn.countAll<number>().as('count'))
        .executeTakeFirst()

      const total = Number((totalRow as unknown as { count?: number | string })?.count ?? 0)
      const totalPages = Math.max(1, Math.ceil(total / qp.pageSize))
      res.json({ data, page: qp.page, pageSize: qp.pageSize, total, totalPages })
    } catch (e) { next(e) }
  }
)

/* =======================================================================
   CHECK-INS
   ======================================================================= */

// GET /api/collab/goals/:goalId/checkins
router.get(
  '/goals/:goalId/checkins',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { goalId } = PathGoalId.parse(req.params)
      if (!(await canAccess(req.userId!, goalId))) { res.status(403).json({ message: 'Forbidden' }); return }

      const rows = await db
        .selectFrom('goal_checkins')
        .selectAll()
        .where('goal_id', '=', goalId)
        .orderBy('created_at', 'desc')
        .limit(50)
        .execute()

      res.json(rows)
    } catch (e) { next(e) }
  }
)

// POST /api/collab/goals/:goalId/checkins
router.post(
  '/goals/:goalId/checkins',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { goalId } = PathGoalId.parse(req.params)

      if (!(await canAccess(req.userId!, goalId))) { res.status(403).json({ message: 'Forbidden' }); return }
      if (!(await canPostOnGoal(req.userId!, goalId))) { res.status(403).json({ message: 'Not allowed to post on this goal' }); return }

      // block buddies from posting on completed goals (owner can still post)
      const g = await db.selectFrom('goals').select(['status', 'user_id']).where('id', '=', goalId).executeTakeFirst()
      const isOwner = g?.user_id === req.userId
      if (g?.status === 'completed' && !isOwner) { res.status(409).json({ message: 'Goal is completed' }); return }

      const body = z.object({
        status: z.enum(['on_track', 'blocked', 'done']).optional().default('on_track'),
        progress: z.coerce.number().int().min(0).max(100).nullable().optional(),
        note: z.string().optional().default(''),
      }).parse(req.body)

      const row = await db
        .insertInto('goal_checkins')
        .values({
          goal_id: goalId,
          user_id: req.userId!,
          status: body.status,
          progress: body.progress ?? null,
          note: body.note ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      res.status(201).json(row)
    } catch (e) { next(e) }
  }
)

/* =======================================================================
   MESSAGES
   ======================================================================= */

// GET /api/collab/goals/:goalId/messages
router.get(
  '/goals/:goalId/messages',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { goalId } = PathGoalId.parse(req.params)
      if (!(await canAccess(req.userId!, goalId))) { res.status(403).json({ message: 'Forbidden' }); return }

      const rows = await db
        .selectFrom('goal_messages')
        .innerJoin('users', 'users.id', 'goal_messages.sender_id')
        .select([
          'goal_messages.id as id',
          'goal_messages.body as body',
          'goal_messages.created_at as created_at',
          'goal_messages.sender_id as sender_id',
          'users.email as email',
        ])
        .where('goal_messages.goal_id', '=', goalId)
        .orderBy('goal_messages.created_at', 'desc')
        .limit(50)
        .execute()

      res.json(rows)
    } catch (e) { next(e) }
  }
)

// POST /api/collab/goals/:goalId/messages
router.post(
  '/goals/:goalId/messages',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { goalId } = PathGoalId.parse(req.params)

      if (!(await canAccess(req.userId!, goalId))) { res.status(403).json({ message: 'Forbidden' }); return }
      if (!(await canPostOnGoal(req.userId!, goalId))) { res.status(403).json({ message: 'Not allowed to post on this goal' }); return }

      // lock buddies when goal is completed (owner may still add notes/messages if you want)
      const g = await db.selectFrom('goals').select(['status', 'user_id']).where('id', '=', goalId).executeTakeFirst()
      const isOwner = g?.user_id === req.userId
      if (g?.status === 'completed' && !isOwner) { res.status(409).json({ message: 'Goal is completed' }); return }

      const { body } = z.object({ body: z.string().min(1) }).parse(req.body)

      const row = await db
        .insertInto('goal_messages')
        .values({ goal_id: goalId, sender_id: req.userId!, body })
        .returningAll()
        .executeTakeFirstOrThrow()

      res.status(201).json(row)
    } catch (e) { next(e) }
  }
)

export default router
