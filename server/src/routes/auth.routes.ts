import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cubestudio_super_secret_jwt_key_2026_wca';

const sanitizeUser = (user: any) => {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
};

// 1. Register
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, email, password, nickname } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Check existing
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: cleanEmail }
        ]
      }
    });

    if (existing) {
      if (existing.username === cleanUsername) {
        res.status(409).json({ error: 'Username is already taken' });
        return;
      }
      res.status(409).json({ error: 'Email is already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role: Role.USER,
        nickname: nickname?.trim() || cleanUsername,
        privacySettings: {
          create: {
            isProfilePublic: true,
            showSolvesHistory: true,
            showPbStats: true,
            showFollowers: true,
            showActivityHeatmap: true,
            allowFollow: true
          }
        },
        sessions: {
          create: {
            name: 'Main 3x3 Practice',
            puzzleType: '3x3',
            description: 'Default speedcubing session',
            isActive: true
          }
        }
      },
      include: {
        privacySettings: true,
        sessions: true
      }
    });

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register account' });
  }
});

// 2. Login
router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      res.status(400).json({ error: 'Username/Email and password are required' });
      return;
    }

    const cleanInput = usernameOrEmail.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanInput },
          { email: cleanInput }
        ]
      },
      include: {
        privacySettings: true,
        sessions: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid username/email or password' });
      return;
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      res.status(401).json({ error: 'Invalid username/email or password' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to process login' });
  }
});

// 3. Current User Profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        privacySettings: true,
        sessions: {
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            solves: true,
            followers: true,
            following: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

// 4. Update Profile
router.patch('/profile', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { nickname, bio, avatarUrl, wcaId } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nickname !== undefined && { nickname: nickname.trim() }),
        ...(bio !== undefined && { bio: bio.trim() }),
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl.trim() }),
        ...(wcaId !== undefined && { wcaId: wcaId.trim() || null })
      },
      include: {
        privacySettings: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: sanitizeUser(updated)
    });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('wcaId')) {
      res.status(409).json({ error: 'WCA ID is already linked to another account' });
      return;
    }
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 5. Update Privacy Settings
router.patch('/privacy', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      isProfilePublic,
      showSolvesHistory,
      showPbStats,
      showFollowers,
      showActivityHeatmap,
      allowFollow
    } = req.body;

    const privacy = await prisma.userPrivacySettings.upsert({
      where: { userId },
      update: {
        ...(isProfilePublic !== undefined && { isProfilePublic: Boolean(isProfilePublic) }),
        ...(showSolvesHistory !== undefined && { showSolvesHistory: Boolean(showSolvesHistory) }),
        ...(showPbStats !== undefined && { showPbStats: Boolean(showPbStats) }),
        ...(showFollowers !== undefined && { showFollowers: Boolean(showFollowers) }),
        ...(showActivityHeatmap !== undefined && { showActivityHeatmap: Boolean(showActivityHeatmap) }),
        ...(allowFollow !== undefined && { allowFollow: Boolean(allowFollow) })
      },
      create: {
        userId,
        isProfilePublic: isProfilePublic !== undefined ? Boolean(isProfilePublic) : true,
        showSolvesHistory: showSolvesHistory !== undefined ? Boolean(showSolvesHistory) : true,
        showPbStats: showPbStats !== undefined ? Boolean(showPbStats) : true,
        showFollowers: showFollowers !== undefined ? Boolean(showFollowers) : true,
        showActivityHeatmap: showActivityHeatmap !== undefined ? Boolean(showActivityHeatmap) : true,
        allowFollow: allowFollow !== undefined ? Boolean(allowFollow) : true
      }
    });

    res.json({
      message: 'Privacy settings updated',
      privacySettings: privacy
    });
  } catch (error: any) {
    console.error('Privacy update error:', error);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

// 6. Public User Profile Preview (Respects privacy settings)
router.get('/users/:username', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const username = (req.params.username as string).toLowerCase();
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        privacySettings: true,
        _count: {
          select: {
            solves: true,
            followers: true,
            following: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const privacy = user.privacySettings;
    if (privacy && !privacy.isProfilePublic) {
      res.status(403).json({
        error: 'This profile is private',
        isPrivate: true,
        username: user.username,
        nickname: user.nickname
      });
      return;
    }

    // If PB stats allowed, find Personal Best
    let pbSingle: number | null = null;
    if (!privacy || privacy.showPbStats) {
      const bestSolve = await prisma.solve.findFirst({
        where: {
          userId: user.id,
          penalty: { not: 'DNF' },
          effectiveTimeMs: { not: null }
        },
        orderBy: { effectiveTimeMs: 'asc' }
      });
      if (bestSolve?.effectiveTimeMs) {
        pbSingle = bestSolve.effectiveTimeMs / 1000;
      }
    }

    res.json({
      username: user.username,
      nickname: user.nickname,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      wcaId: user.wcaId,
      role: user.role,
      createdAt: user.createdAt,
      stats: {
        totalSolves: (!privacy || privacy.showSolvesHistory) ? user._count.solves : null,
        followersCount: (!privacy || privacy.showFollowers) ? user._count.followers : null,
        followingCount: (!privacy || privacy.showFollowers) ? user._count.following : null,
        pbSingle
      },
      privacySettings: privacy
    });
  } catch (error: any) {
    console.error('Error fetching public user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// 7. Admin List All Users (Admin Guard)
router.get('/admin/users', authenticateToken, requireRole(Role.ADMIN), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        nickname: true,
        wcaId: true,
        createdAt: true,
        _count: {
          select: { solves: true }
        }
      }
    });

    res.json({ users });
  } catch (error: any) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch user list' });
  }
});

export default router;
