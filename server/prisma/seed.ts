import { PrismaClient, Role, Penalty, CompetitionFormat } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BASELINE_SOLVES = [
  { id: 1, seconds: 134.00, date: "2026-10-01", time: "14:10:22", notes: "Session 1", scramble: "D2 R2 F2 U L2 U' B2 D' R2 F2 U' L2 U2 B' R D F2 R2 B' L'", tags: ["Session 1"] },
  { id: 2, seconds: 111.24, date: "2026-10-01", time: "14:15:45", notes: "Session 1", scramble: "U2 F2 D' B2 L2 B2 D F2 U' R2 U' L' D2 B' R' F D' L B' U", tags: ["Session 1"] },
  { id: 3, seconds: 122.91, date: "2026-10-01", time: "14:21:03", notes: "Session 1", scramble: "B2 L2 D2 R2 U2 B2 F2 D' F2 U' R' B' D F2 L D' R2 U' F", tags: ["Session 1"] },
  { id: 4, seconds: 120.02, date: "2026-10-01", time: "14:26:18", notes: "Session 1", scramble: "L2 B2 D2 R2 U' L2 D B2 D' F2 L' B R' U' L2 F' D2 L' U' B", tags: ["Session 1"] },
  { id: 5, seconds: 112.31, date: "2026-10-01", time: "14:30:50", notes: "Session 1", scramble: "R2 F2 U' B2 D' L2 D' B2 U' F2 R' B' L' D F' R2 U2 B' L' F", tags: ["Session 1"] },
  { id: 6, seconds: 112.12, date: "2026-10-01", time: "14:35:12", notes: "Session 1", scramble: "F2 D2 L2 U2 B2 R2 D' F2 U' B2 R D' L2 F' D2 R' F2 L' U' R", tags: ["Session 1"] },
  { id: 7, seconds: 107.94, date: "2026-10-02", time: "19:05:30", notes: "Session 2", scramble: "U2 L2 B2 D2 R2 U B2 D' F2 L2 U' R' D2 F' R2 B' L D2 F'", tags: ["Session 2"] },
  { id: 8, seconds: 120.75, date: "2026-10-02", time: "19:11:14", notes: "Session 2", scramble: "D2 B2 L2 U' R2 U' B2 U2 F2 D' L' U2 F' R' D' F2 L2 B2 U", tags: ["Session 2"] },
  { id: 9, seconds: 103.62, date: "2026-10-02", time: "19:16:40", notes: "Session 2", scramble: "R2 U2 F2 D' L2 U' B2 D' F2 L2 R' B D2 R2 F' U' L' B' D2", tags: ["Session 2"] },
  { id: 10, seconds: 88.62, date: "2026-10-02", time: "19:22:05", notes: "Smooth F2L", scramble: "B2 D2 R2 F2 U' L2 U' B2 D' F2 U L' D2 B' R F D' L B' U", tags: ["Smooth F2L", "Session 2"], isPb: true },
  { id: 11, seconds: 93.34, date: "2026-10-02", time: "19:28:50", notes: "Session 2", scramble: "L2 U2 F2 D2 R2 U' B2 D' L2 U' R' B' D F2 L D' R2 U' F", tags: ["Session 2"] },
  { id: 12, seconds: 110.42, date: "2026-10-02", time: "19:35:10", notes: "Session 2", scramble: "F2 R2 U' B2 D' L2 D' B2 U' F2 R' B' L' D F' R2 U2 B' L'", tags: ["Session 2"] },
  { id: 13, seconds: 110.66, date: "2026-10-03", time: "20:10:05", notes: "Session 3", scramble: "U2 F2 D' B2 L2 B2 D F2 U' R2 U' L' D2 B' R' F D' L B' U", tags: ["Session 3"] },
  { id: 14, seconds: 104.40, date: "2026-10-03", time: "20:16:22", notes: "Session 3", scramble: "D2 B2 L2 U' R2 U' B2 U2 F2 D' L' U2 F' R' D' F2 L2 B2 U", tags: ["Session 3"] },
  { id: 15, seconds: 112.57, date: "2026-10-03", time: "20:22:40", notes: "Session 3", scramble: "R2 F2 U' B2 D' L2 D' B2 U' F2 R' B' L' D F' R2 U2 B' L'", tags: ["Session 3"] },
  { id: 16, seconds: 149.44, date: "2026-10-03", time: "20:28:15", notes: "Lockup", scramble: "B2 L2 D2 R2 U2 B2 F2 D' F2 U' R' B' D F2 L D' R2 U' F", tags: ["Lockup", "Session 3"] }
];

async function main() {
  console.log('🌱 Starting CubeStudio Database Seeding...');

  // 1. Achievements Seeding
  const achievements = [
    { code: 'FIRST_SOLVE', title: 'First Step', description: 'Recorded your very first 3x3 solve', iconName: 'Box' },
    { code: 'SUB_120', title: 'Sub-2:00 Barrier', description: 'Achieved a solve time under 2 minutes', iconName: 'Zap' },
    { code: 'SUB_90', title: 'Sub-1:30 Breakthrough', description: 'Achieved a solve time under 1 minute 30 seconds', iconName: 'Flame' },
    { code: 'SUB_60', title: 'Sub-1:00 Club', description: 'Joined the legendary Sub-1:00 cubers', iconName: 'Trophy' }
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: {},
      create: ach
    });
  }
  console.log('✅ Achievements seeded');

  // 2. Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cubestudio.dev' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@cubestudio.dev',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      nickname: 'Head Admin',
      bio: 'CubeStudio Platform Administrator & Official Scrambler',
      privacySettings: {
        create: {
          isProfilePublic: true,
          showSolvesHistory: true,
          showPbStats: true,
          showFollowers: true,
          showActivityHeatmap: true,
          allowFollow: true
        }
      }
    }
  });
  console.log(`✅ Admin user seeded: ${admin.username} (email: ${admin.email})`);

  // 3. Demo Speedcuber User
  const userPassword = await bcrypt.hash('cuber123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'user@cubestudio.dev' },
    update: {},
    create: {
      username: 'micocuber',
      email: 'user@cubestudio.dev',
      passwordHash: userPassword,
      role: Role.USER,
      nickname: 'Mico Cuber',
      bio: 'Targeting Sub-1:15 • CFOP Solver • Gan 12 MagLev',
      privacySettings: {
        create: {
          isProfilePublic: true,
          showSolvesHistory: true,
          showPbStats: true,
          showFollowers: true,
          showActivityHeatmap: true,
          allowFollow: true
        }
      }
    }
  });
  console.log(`✅ Demo user seeded: ${demoUser.username} (email: ${demoUser.email})`);

  // 4. Default Session for Demo User
  let session = await prisma.session.findFirst({
    where: { userId: demoUser.id, name: 'Main 3x3 Practice' }
  });

  if (!session) {
    session = await prisma.session.create({
      data: {
        userId: demoUser.id,
        name: 'Main 3x3 Practice',
        puzzleType: '3x3',
        description: 'Primary CFOP speedcubing progression session',
        isActive: true
      }
    });
  }
  console.log(`✅ Session created: "${session.name}"`);

  // 5. Seed 16 Baseline Solves
  const existingSolvesCount = await prisma.solve.count({
    where: { sessionId: session.id }
  });

  if (existingSolvesCount === 0) {
    for (const item of BASELINE_SOLVES) {
      const recordedDate = new Date(`${item.date}T${item.time}`);
      const timeMs = Math.round(item.seconds * 1000);

      await prisma.solve.create({
        data: {
          userId: demoUser.id,
          sessionId: session.id,
          solveNumber: item.id,
          timeMs: timeMs,
          effectiveTimeMs: timeMs,
          penalty: Penalty.NONE,
          scramble: item.scramble,
          notes: item.notes,
          tags: item.tags,
          isPb: item.isPb || false,
          recordedAt: recordedDate
        }
      });
    }
    console.log(`✅ 16 baseline solves successfully imported to PostgreSQL!`);
  } else {
    console.log(`ℹ️ Solves already exist (${existingSolvesCount} records), skipping solve insertion.`);
  }

  // 6. Seed Sample Competition
  const existingComp = await prisma.competition.findFirst({
    where: { title: 'Weekend Blitz 3x3 Challenge' }
  });

  if (!existingComp) {
    const comp = await prisma.competition.create({
      data: {
        title: 'Weekend Blitz 3x3 Challenge',
        eventType: '3x3',
        format: CompetitionFormat.AO5,
        description: 'WCA standard Ao5 tournament. Complete 5 consecutive scrambles to qualify for the global leaderboard!',
        startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // Started yesterday
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6), // Ends in 6 days
        isActive: true,
        createdById: admin.id,
        scrambles: {
          create: [
            { roundNumber: 1, scrambleText: "F2 R2 U' B2 D' L2 D' B2 U' F2 R' B' L' D F' R2 U2 B' L' F" },
            { roundNumber: 2, scrambleText: "U2 F2 D' B2 L2 B2 D F2 U' R2 U' L' D2 B' R' F D' L B' U" },
            { roundNumber: 3, scrambleText: "D2 B2 L2 U' R2 U' B2 U2 F2 D' L' U2 F' R' D' F2 L2 B2 U" },
            { roundNumber: 4, scrambleText: "B2 L2 D2 R2 U2 B2 F2 D' F2 U' R' B' D F2 L D' R2 U' F" },
            { roundNumber: 5, scrambleText: "R2 U2 F2 D' L2 U' B2 D' F2 L2 R' B D2 R2 F' U' L' B' D2" }
          ]
        }
      }
    });
    console.log(`✅ Sample competition created: "${comp.title}" with 5 official scrambles`);
  }

  console.log('🚀 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
