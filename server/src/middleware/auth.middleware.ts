import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  nickname: string | null;
  avatarUrl: string | null;
  wcaId: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'cubestudio_super_secret_jwt_key_2026_wca';

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        nickname: true,
        avatarUrl: true,
        wcaId: true
      }
    });

    if (!user) {
      res.status(401).json({ error: 'User not found or token invalid' });
      return;
    }

    req.user = user as AuthUser;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token is invalid or expired' });
    return;
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        nickname: true,
        avatarUrl: true,
        wcaId: true
      }
    });

    if (user) {
      req.user = user as AuthUser;
    }
  } catch {
    // Ignore invalid token for optional auth
  }

  next();
};

export const requireRole = (role: Role) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ error: `Forbidden: requires ${role} role` });
      return;
    }

    next();
  };
};
