import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';
import { Penalty } from '@prisma/client';

const router = Router();

// Helper to convert Prisma enum to frontend lowercase penalty
const toClientPenalty = (p: Penalty): 'none' | '+2' | 'dnf' => {
  if (p === Penalty.PLUS_TWO) return '+2';
  if (p === Penalty.DNF) return 'dnf';
  return 'none';
};

// Helper to convert frontend string to Prisma enum
const toPrismaPenalty = (p?: string): Penalty => {
  if (p === '+2') return Penalty.PLUS_TWO;
  if (p === 'dnf') return Penalty.DNF;
  return Penalty.NONE;
};

// Helper to format Solve from database into clean frontend object
export const serializeSolve = (s: any) => {
  const seconds = s.timeMs / 1000;
  const effSeconds = s.penalty === Penalty.DNF 
    ? Infinity 
    : s.penalty === Penalty.PLUS_TWO 
    ? (s.timeMs + 2000) / 1000 
    : seconds;

  const recDate = new Date(s.recordedAt);
  const dateStr = recDate.toISOString().split('T')[0];
  const timeStr = recDate.toTimeString().slice(0, 8);

  const m = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  const ms = Math.floor((seconds - Math.floor(seconds)) * 100);
  const formattedTime = `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(2, '0').slice(0, 2)}`;

  return {
    id: Number(s.id),
    solveNumber: s.solveNumber,
    seconds,
    formattedTime,
    effectiveSeconds: effSeconds,
    date: dateStr,
    timestamp: timeStr,
    scramble: s.scramble,
    penalty: toClientPenalty(s.penalty),
    tags: s.tags || [],
    notes: s.notes || '',
    isPB: Boolean(s.isPb),
    sessionId: s.sessionId
  };
};

// 1. Get Solves for current user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { sessionId, dateFrom, dateTo, penalty, tag, sort } = req.query;

    // Resolve target session
    let targetSessionId = sessionId as string;
    if (!targetSessionId) {
      const activeSession = await prisma.session.findFirst({
        where: { userId, isActive: true }
      }) || await prisma.session.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      });

      if (!activeSession) {
        // Auto-create a session if none exists
        const newSession = await prisma.session.create({
          data: {
            userId,
            name: 'Main 3x3 Practice',
            puzzleType: '3x3',
            isActive: true
          }
        });
        targetSessionId = newSession.id;
      } else {
        targetSessionId = activeSession.id;
      }
    }

    // Build filter query
    const whereClause: any = {
      userId,
      sessionId: targetSessionId
    };

    if (dateFrom || dateTo) {
      whereClause.recordedAt = {};
      if (dateFrom) whereClause.recordedAt.gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo) whereClause.recordedAt.lte = new Date(`${dateTo}T23:59:59.999Z`);
    }

    if (penalty && penalty !== 'all') {
      if (penalty === 'clean') whereClause.penalty = Penalty.NONE;
      else if (penalty === '+2') whereClause.penalty = Penalty.PLUS_TWO;
      else if (penalty === 'dnf') whereClause.penalty = Penalty.DNF;
    }

    if (tag && tag !== 'all') {
      whereClause.tags = { has: tag as string };
    }

    // Sort order
    let orderBy: any = { solveNumber: 'desc' };
    if (sort === 'oldest') orderBy = { solveNumber: 'asc' };
    if (sort === 'fastest') orderBy = { effectiveTimeMs: 'asc' };
    if (sort === 'slowest') orderBy = { effectiveTimeMs: 'desc' };

    const rawSolves = await prisma.solve.findMany({
      where: whereClause,
      orderBy
    });

    const solves = rawSolves.map(serializeSolve);

    res.json({
      sessionId: targetSessionId,
      totalCount: solves.length,
      solves
    });
  } catch (error: any) {
    console.error('Error fetching solves:', error);
    res.status(500).json({ error: 'Failed to fetch solves' });
  }
});

// 2. Create / Record New Solve
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    let {
      seconds,
      timeMs,
      penalty,
      scramble,
      inspectionSeconds,
      notes,
      tags,
      isPb,
      sessionId,
      recordedAt
    } = req.body;

    if (timeMs === undefined && seconds !== undefined) {
      timeMs = Math.round(Number(seconds) * 1000);
    }

    if (timeMs === undefined || isNaN(timeMs)) {
      res.status(400).json({ error: 'Valid timeMs or seconds is required' });
      return;
    }

    // Determine session
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const activeSession = await prisma.session.findFirst({
        where: { userId, isActive: true }
      }) || await prisma.session.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      });

      if (!activeSession) {
        const created = await prisma.session.create({
          data: { userId, name: 'Main 3x3 Practice', isActive: true }
        });
        targetSessionId = created.id;
      } else {
        targetSessionId = activeSession.id;
      }
    }

    // Determine solveNumber
    const lastSolve = await prisma.solve.findFirst({
      where: { userId, sessionId: targetSessionId },
      orderBy: { solveNumber: 'desc' }
    });
    const nextSolveNumber = (lastSolve?.solveNumber || 0) + 1;

    const prismaPenalty = toPrismaPenalty(penalty);
    let effectiveTimeMs: number | null = timeMs;
    if (prismaPenalty === Penalty.DNF) {
      effectiveTimeMs = null;
    } else if (prismaPenalty === Penalty.PLUS_TWO) {
      effectiveTimeMs = timeMs + 2000;
    }

    // Check if new PB
    if (isPb === undefined && effectiveTimeMs !== null) {
      const bestExisting = await prisma.solve.findFirst({
        where: {
          userId,
          sessionId: targetSessionId,
          penalty: { not: Penalty.DNF },
          effectiveTimeMs: { not: null }
        },
        orderBy: { effectiveTimeMs: 'asc' }
      });

      if (!bestExisting || (bestExisting.effectiveTimeMs && effectiveTimeMs < bestExisting.effectiveTimeMs)) {
        isPb = true;
      } else {
        isPb = false;
      }
    }

    const newSolve = await prisma.solve.create({
      data: {
        userId,
        sessionId: targetSessionId,
        solveNumber: nextSolveNumber,
        timeMs,
        effectiveTimeMs,
        penalty: prismaPenalty,
        scramble: scramble || '',
        inspectionSeconds: inspectionSeconds ? Number(inspectionSeconds) : null,
        notes: notes || null,
        tags: Array.isArray(tags) ? tags : [],
        isPb: Boolean(isPb),
        recordedAt: recordedAt ? new Date(recordedAt) : new Date()
      }
    });

    res.status(201).json({ solve: serializeSolve(newSolve) });
  } catch (error: any) {
    console.error('Error creating solve:', error);
    res.status(500).json({ error: 'Failed to record solve' });
  }
});

// 3. Update Solve (Penalty, Tags, Notes)
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const solveId = BigInt(req.params.id as string);
    const { penalty, notes, tags } = req.body;

    const existing = await prisma.solve.findFirst({
      where: { id: solveId, userId }
    });

    if (!existing) {
      res.status(404).json({ error: 'Solve not found' });
      return;
    }

    const dataToUpdate: any = {};

    if (penalty !== undefined) {
      const prismaPenalty = toPrismaPenalty(penalty);
      dataToUpdate.penalty = prismaPenalty;
      if (prismaPenalty === Penalty.DNF) {
        dataToUpdate.effectiveTimeMs = null;
      } else if (prismaPenalty === Penalty.PLUS_TWO) {
        dataToUpdate.effectiveTimeMs = existing.timeMs + 2000;
      } else {
        dataToUpdate.effectiveTimeMs = existing.timeMs;
      }
    }

    if (notes !== undefined) {
      dataToUpdate.notes = notes?.trim() || null;
    }

    if (tags !== undefined) {
      dataToUpdate.tags = Array.isArray(tags) ? tags : [];
    }

    const updated = await prisma.solve.update({
      where: { id: solveId },
      data: dataToUpdate
    });

    res.json({ solve: serializeSolve(updated) });
  } catch (error: any) {
    console.error('Error updating solve:', error);
    res.status(500).json({ error: 'Failed to update solve' });
  }
});

// 4. Delete Solve
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const solveId = BigInt(req.params.id as string);

    const existing = await prisma.solve.findFirst({
      where: { id: solveId, userId }
    });

    if (!existing) {
      res.status(404).json({ error: 'Solve not found' });
      return;
    }

    await prisma.solve.delete({ where: { id: solveId } });

    res.json({ message: 'Solve deleted successfully', id: Number(solveId) });
  } catch (error: any) {
    console.error('Error deleting solve:', error);
    res.status(500).json({ error: 'Failed to delete solve' });
  }
});

// 5. Batch Sync Solves from Client (Migration / Local Sync)
router.post('/sync', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { solves, sessionId } = req.body;

    if (!Array.isArray(solves) || solves.length === 0) {
      res.status(400).json({ error: 'Solves array required for sync' });
      return;
    }

    // Determine session
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const activeSession = await prisma.session.findFirst({
        where: { userId, isActive: true }
      }) || await prisma.session.findFirst({
        where: { userId }
      });
      targetSessionId = activeSession?.id;
      if (!targetSessionId) {
        const created = await prisma.session.create({
          data: { userId, name: 'Main 3x3 Practice', isActive: true }
        });
        targetSessionId = created.id;
      }
    }

    // Fetch existing solves to avoid duplicates (based on scramble + approximate recordedAt or solveNumber)
    const existing = await prisma.solve.findMany({
      where: { userId, sessionId: targetSessionId }
    });

    const existingScrambles = new Set(existing.map(s => s.scramble.trim()));
    let nextSolveNum = (existing.reduce((max, s) => Math.max(max, s.solveNumber), 0)) + 1;

    let addedCount = 0;
    for (const item of solves) {
      const scramble = (item.scramble || '').trim();
      // Skip if exactly same scramble already in session
      if (scramble && existingScrambles.has(scramble)) {
        continue;
      }

      const seconds = typeof item.seconds === 'number' ? item.seconds : (item.timeMs ? item.timeMs / 1000 : 0);
      const timeMs = Math.round(seconds * 1000);
      const p = toPrismaPenalty(item.penalty);
      const effectiveTimeMs = p === Penalty.DNF ? null : p === Penalty.PLUS_TWO ? timeMs + 2000 : timeMs;

      let recordedAt = new Date();
      if (item.date && item.timestamp) {
        recordedAt = new Date(`${item.date}T${item.timestamp}`);
        if (isNaN(recordedAt.getTime())) recordedAt = new Date();
      }

      await prisma.solve.create({
        data: {
          userId,
          sessionId: targetSessionId,
          solveNumber: nextSolveNum++,
          timeMs,
          effectiveTimeMs,
          penalty: p,
          scramble,
          notes: item.notes || null,
          tags: Array.isArray(item.tags) ? item.tags : [],
          isPb: Boolean(item.isPB || item.isPb),
          recordedAt
        }
      });

      if (scramble) existingScrambles.add(scramble);
      addedCount++;
    }

    // Return updated solves list
    const updatedRaw = await prisma.solve.findMany({
      where: { userId, sessionId: targetSessionId },
      orderBy: { solveNumber: 'desc' }
    });

    res.json({
      message: `Successfully synced ${addedCount} solves`,
      syncedCount: addedCount,
      totalCount: updatedRaw.length,
      solves: updatedRaw.map(serializeSolve)
    });
  } catch (error: any) {
    console.error('Batch sync error:', error);
    res.status(500).json({ error: 'Failed to sync solves' });
  }
});

export default router;
