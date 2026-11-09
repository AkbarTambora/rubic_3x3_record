import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// List all sessions for current user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { solves: true }
        }
      }
    });

    res.json({ sessions });
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create a new session
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, puzzleType, description, setActive } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Session name is required' });
      return;
    }

    if (setActive) {
      // Deactivate other sessions
      await prisma.session.updateMany({
        where: { userId },
        data: { isActive: false }
      });
    }

    const session = await prisma.session.create({
      data: {
        userId,
        name: name.trim(),
        puzzleType: puzzleType || '3x3',
        description: description?.trim() || null,
        isActive: setActive !== undefined ? Boolean(setActive) : false
      }
    });

    res.status(201).json({ session });
  } catch (error: any) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update or set session as active
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { name, description, isActive } = req.body;

    const existing = await prisma.session.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (isActive) {
      // Deactivate all others first
      await prisma.session.updateMany({
        where: { userId },
        data: { isActive: false }
      });
    }

    const updated = await prisma.session.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      }
    });

    res.json({ session: updated });
  } catch (error: any) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete a session
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const totalCount = await prisma.session.count({ where: { userId } });
    if (totalCount <= 1) {
      res.status(400).json({ error: 'Cannot delete the only remaining session' });
      return;
    }

    const existing = await prisma.session.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    await prisma.session.delete({ where: { id } });

    // If active session was deleted, set another session active
    if (existing.isActive) {
      const firstRemaining = await prisma.session.findFirst({ where: { userId } });
      if (firstRemaining) {
        await prisma.session.update({
          where: { id: firstRemaining.id },
          data: { isActive: true }
        });
      }
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;
