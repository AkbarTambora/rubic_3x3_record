import { Router, Request, Response } from 'express';
import { prisma } from '../config/db';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    // Ping DB
    await prisma.$queryRaw`SELECT 1`;

    const [userCount, solveCount, competitionCount] = await Promise.all([
      prisma.user.count(),
      prisma.solve.count(),
      prisma.competition.count()
    ]);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'CubeStudio 3x3 Backend API',
      database: {
        connected: true,
        stats: {
          users: userCount,
          solves: solveCount,
          competitions: competitionCount
        }
      }
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'CubeStudio 3x3 Backend API',
      database: {
        connected: false,
        error: error.message
      }
    });
  }
});

export default router;
