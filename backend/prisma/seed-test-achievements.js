// Seed test data for achievement system testing
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const TEST_STUDENTS = [
  { username: 'hoanganh', firstName: 'Hoàng Anh', streak: 35 },
  { username: 'thuylinh', firstName: 'Thùy Linh', streak: 22 },
  { username: 'ducminh',  firstName: 'Đức Minh',  streak: 50 },
  { username: 'maitrang', firstName: 'Mai Trang',  streak: 14 },
  { username: 'quochuy',  firstName: 'Quốc Huy',  streak: 7 },
];

// Which badges each student earns (by code)
const STUDENT_BADGES = {
  'hoanganh': ['streak_3','streak_7','streak_14','streak_30','course_1','course_3','course_5','quiz_1','quiz_5','cert_1','cert_3','video_5','video_20','assign_1','assign_5','assign_15','comment_1','comment_10','enroll_1','enroll_3','enroll_5'],
  'thuylinh': ['streak_3','streak_7','streak_14','course_1','course_3','quiz_1','quiz_5','quiz_10','cert_1','video_5','video_20','video_50','assign_1','assign_5','comment_1','comment_10','comment_30','enroll_1','enroll_3'],
  'ducminh':  ['streak_3','streak_7','streak_14','streak_30','streak_60','course_1','course_3','course_5','course_10','quiz_1','quiz_5','quiz_10','quiz_20','cert_1','cert_3','cert_5','video_5','video_20','video_50','video_100','assign_1','assign_5','assign_15','assign_30','comment_1','comment_10','comment_30','comment_50','enroll_1','enroll_3','enroll_5','enroll_10'],
  'maitrang': ['streak_3','streak_7','streak_14','course_1','quiz_1','cert_1','video_5','assign_1','assign_5','comment_1','enroll_1','enroll_3'],
  'quochuy':  ['streak_3','streak_7','course_1','quiz_1','video_5','assign_1','comment_1','enroll_1'],
};

async function main() {
  console.log('Creating test students...');
  const hash = await bcrypt.hash('test1234', 10);

  for (const stu of TEST_STUDENTS) {
    // Upsert student
    const user = await prisma.user.upsert({
      where: { username: stu.username },
      create: {
        username: stu.username,
        email: `${stu.username}@test.com`,
        password: hash,
        firstName: stu.firstName,
        role: 'student',
        currentStreak: stu.streak,
        lastActivityDate: new Date(),
      },
      update: {
        firstName: stu.firstName,
        currentStreak: stu.streak,
        lastActivityDate: new Date(),
      },
    });

    console.log(`  ✓ ${stu.firstName} (id: ${user.id}, streak: ${stu.streak})`);

    // Award badges
    const badgeCodes = STUDENT_BADGES[stu.username] || [];
    for (const code of badgeCodes) {
      const badge = await prisma.badge.findUnique({ where: { code } });
      if (!badge) { console.log(`    ✗ Badge ${code} not found`); continue; }

      await prisma.userBadge.upsert({
        where: { userId_badgeId: { userId: user.id, badgeId: badge.id } },
        create: {
          userId: user.id,
          badgeId: badge.id,
          earnedAt: new Date(Date.now() - Math.random() * 30 * 86400000), // random within 30 days
        },
        update: {},
      });
    }
    console.log(`    ✓ Awarded ${badgeCodes.length} badges`);
  }

  console.log('\n✅ Test data seeded successfully!');
  console.log('Students created:');
  for (const stu of TEST_STUDENTS) {
    const badges = STUDENT_BADGES[stu.username] || [];
    console.log(`  - ${stu.firstName}: streak=${stu.streak}, badges=${badges.length}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
