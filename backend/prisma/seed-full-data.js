const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Badge definitions (same as achievements.service.ts)
const BADGE_DEFINITIONS = [
  { code: 'streak_3',   name: 'Ngọn lửa nhỏ',        icon: '🔥', category: 'streak', tier: 'bronze',   requirement: 3,   description: 'Học 3 ngày liên tiếp' },
  { code: 'streak_7',   name: 'Chiến binh tuần',      icon: '⚡', category: 'streak', tier: 'silver',   requirement: 7,   description: 'Học 7 ngày liên tiếp' },
  { code: 'streak_14',  name: 'Kiên trì',             icon: '💪', category: 'streak', tier: 'gold',     requirement: 14,  description: 'Học 14 ngày liên tiếp' },
  { code: 'streak_30',  name: 'Bền bỉ phi thường',    icon: '🏆', category: 'streak', tier: 'platinum', requirement: 30,  description: 'Học 30 ngày liên tiếp' },
  { code: 'streak_60',  name: 'Huyền thoại',          icon: '👑', category: 'streak', tier: 'diamond',  requirement: 60,  description: 'Học 60 ngày liên tiếp' },
  { code: 'streak_100', name: 'Bất khả chiến bại',    icon: '🌟', category: 'streak', tier: 'legendary',requirement: 100, description: 'Học 100 ngày liên tiếp' },
  { code: 'course_1',   name: 'Khởi đầu',             icon: '📘', category: 'course', tier: 'bronze',   requirement: 1,   description: 'Hoàn thành 1 khóa học' },
  { code: 'course_3',   name: 'Học sinh chăm chỉ',    icon: '📚', category: 'course', tier: 'silver',   requirement: 3,   description: 'Hoàn thành 3 khóa học' },
  { code: 'course_5',   name: 'Nhà thông thái',       icon: '🎓', category: 'course', tier: 'gold',     requirement: 5,   description: 'Hoàn thành 5 khóa học' },
  { code: 'course_10',  name: 'Bậc thầy',             icon: '🏅', category: 'course', tier: 'platinum', requirement: 10,  description: 'Hoàn thành 10 khóa học' },
  { code: 'course_20',  name: 'Tiến sĩ',              icon: '🎖️', category: 'course', tier: 'diamond',  requirement: 20,  description: 'Hoàn thành 20 khóa học' },
  { code: 'quiz_1',     name: 'Thử thách đầu',        icon: '✅', category: 'quiz', tier: 'bronze',   requirement: 1,   description: 'Hoàn thành 1 bài quiz' },
  { code: 'quiz_5',     name: 'Tay nhanh',             icon: '🧠', category: 'quiz', tier: 'silver',   requirement: 5,   description: 'Hoàn thành 5 bài quiz' },
  { code: 'quiz_10',    name: 'Bách chiến bách thắng', icon: '💎', category: 'quiz', tier: 'gold',     requirement: 10,  description: 'Hoàn thành 10 bài quiz' },
  { code: 'quiz_20',    name: 'Thần đồng',             icon: '🧩', category: 'quiz', tier: 'platinum', requirement: 20,  description: 'Hoàn thành 20 bài quiz' },
  { code: 'cert_1',     name: 'Tốt nghiệp',           icon: '📜', category: 'certificate', tier: 'bronze',  requirement: 1,  description: 'Nhận chứng chỉ đầu tiên' },
  { code: 'cert_3',     name: 'Sưu tầm chứng chỉ',    icon: '🏛️', category: 'certificate', tier: 'silver',  requirement: 3,  description: 'Nhận 3 chứng chỉ' },
  { code: 'cert_5',     name: 'Nhà sưu tập',           icon: '🗂️', category: 'certificate', tier: 'gold',    requirement: 5,  description: 'Nhận 5 chứng chỉ' },
  { code: 'cert_10',    name: 'Kho chứng chỉ',         icon: '🏆', category: 'certificate', tier: 'platinum',requirement: 10, description: 'Nhận 10 chứng chỉ' },
  { code: 'cert_20',    name: 'Huyền thoại chứng chỉ', icon: '👑', category: 'certificate', tier: 'diamond', requirement: 20, description: 'Nhận 20 chứng chỉ' },
  { code: 'video_5',    name: 'Mắt sáng',             icon: '👀', category: 'video', tier: 'bronze',   requirement: 5,   description: 'Xem 5 video bài giảng' },
  { code: 'video_20',   name: 'Nghiện học',            icon: '📺', category: 'video', tier: 'silver',   requirement: 20,  description: 'Xem 20 video bài giảng' },
  { code: 'video_50',   name: 'Tín đồ video',         icon: '🎬', category: 'video', tier: 'gold',     requirement: 50,  description: 'Xem 50 video bài giảng' },
  { code: 'video_100',  name: 'Kỷ lục video',         icon: '🎥', category: 'video', tier: 'platinum', requirement: 100, description: 'Xem 100 video bài giảng' },
  { code: 'assign_1',   name: 'Siêng năng',           icon: '✍️', category: 'assignment', tier: 'bronze',  requirement: 1,  description: 'Nộp 1 bài tập' },
  { code: 'assign_5',   name: 'Học trò gương mẫu',    icon: '📝', category: 'assignment', tier: 'silver',  requirement: 5,  description: 'Nộp 5 bài tập' },
  { code: 'assign_15',  name: 'Không bao giờ bỏ cuộc',icon: '🔖', category: 'assignment', tier: 'gold',    requirement: 15, description: 'Nộp 15 bài tập' },
  { code: 'assign_30',  name: 'Chiến binh bài tập',   icon: '📋', category: 'assignment', tier: 'platinum',requirement: 30, description: 'Nộp 30 bài tập' },
  { code: 'assign_50',  name: 'Vua bài tập',          icon: '🏅', category: 'assignment', tier: 'diamond', requirement: 50, description: 'Nộp 50 bài tập' },
  { code: 'comment_1',  name: 'Hòa đồng',             icon: '💬', category: 'social', tier: 'bronze',  requirement: 1,  description: 'Bình luận bài giảng đầu tiên' },
  { code: 'comment_10', name: 'Người giao lưu',        icon: '🗣️', category: 'social', tier: 'silver',  requirement: 10, description: 'Bình luận 10 lần' },
  { code: 'comment_30', name: 'Ngôi sao cộng đồng',    icon: '⭐', category: 'social', tier: 'gold',    requirement: 30, description: 'Bình luận 30 lần' },
  { code: 'comment_50', name: 'Trưởng nhóm',           icon: '🎙️', category: 'social', tier: 'platinum',requirement: 50, description: 'Bình luận 50 lần' },
  { code: 'enroll_1',   name: 'Tò mò',                icon: '🔍', category: 'enrollment', tier: 'bronze',  requirement: 1,  description: 'Đăng ký khóa học đầu tiên' },
  { code: 'enroll_3',   name: 'Khám phá',             icon: '🧭', category: 'enrollment', tier: 'silver',  requirement: 3,  description: 'Đăng ký 3 khóa học' },
  { code: 'enroll_5',   name: 'Đam mê học hỏi',       icon: '🌈', category: 'enrollment', tier: 'gold',    requirement: 5,  description: 'Đăng ký 5 khóa học' },
  { code: 'enroll_10',  name: 'Nghiện học tập',        icon: '🚀', category: 'enrollment', tier: 'platinum',requirement: 10, description: 'Đăng ký 10 khóa học' },
  { code: 'enroll_15',  name: 'Bách khoa toàn thư',    icon: '📖', category: 'enrollment', tier: 'diamond', requirement: 15, description: 'Đăng ký 15 khóa học' },
];

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000);
}

function randomDate(startDaysAgo, endDaysAgo) {
  const start = Date.now() - startDaysAgo * 86400000;
  const end = Date.now() - endDaysAgo * 86400000;
  return new Date(start + Math.random() * (end - start));
}

async function main() {
  console.log('🔧 Seeding comprehensive data (badges, video progress, quizzes, assignments, streaks)...\n');

  // ========== 1. SEED BADGES ==========
  console.log('🏅 Seeding badge definitions...');
  for (const def of BADGE_DEFINITIONS) {
    await prisma.badge.upsert({
      where: { code: def.code },
      create: def,
      update: { name: def.name, description: def.description, icon: def.icon, tier: def.tier, requirement: def.requirement },
    });
  }
  console.log(`   ✓ ${BADGE_DEFINITIONS.length} badges upserted`);

  // ========== 2. GET EXISTING DATA ==========
  const students = await prisma.user.findMany({ where: { role: 'student' }, orderBy: { username: 'asc' } });
  const enrollments = await prisma.enrollment.findMany({ include: { course: { include: { sections: { include: { lessons: true } } } } } });
  const allLessons = await prisma.lesson.findMany({ include: { section: { include: { course: true } } } });

  console.log(`   Found ${students.length} students, ${enrollments.length} enrollments, ${allLessons.length} lessons`);

  // ========== 3. UPDATE STREAKS ==========
  console.log('\n🔥 Setting student streaks...');
  const streakValues = [25, 18, 42, 10, 55, 7, 3, 14, 30, 5];
  for (let i = 0; i < students.length; i++) {
    const streak = streakValues[i] || Math.floor(Math.random() * 20) + 1;
    await prisma.user.update({
      where: { id: students[i].id },
      data: {
        currentStreak: streak,
        lastActivityDate: daysAgo(0), // today
      },
    });
    console.log(`   ✓ ${students[i].username}: streak=${streak}`);
  }

  // ========== 4. VIDEO PROGRESS ==========
  console.log('\n📹 Creating video progress...');
  let vpCount = 0;
  for (const enrollment of enrollments) {
    const courseLessons = allLessons.filter(l => l.section.course.id === enrollment.courseId);
    const progressRatio = enrollment.progress / 100;
    const completedCount = Math.floor(courseLessons.length * progressRatio);

    for (let i = 0; i < courseLessons.length; i++) {
      const lesson = courseLessons[i];
      const completed = i < completedCount;
      const watchedPct = completed ? 100 : (i === completedCount ? Math.floor(Math.random() * 60 + 20) : 0);
      if (watchedPct === 0) continue;

      const duration = lesson.duration || 900;
      const watchTime = Math.floor(duration * watchedPct / 100);

      try {
        await prisma.videoProgress.upsert({
          where: { userId_lessonId: { userId: enrollment.userId, lessonId: lesson.id } },
          create: {
            userId: enrollment.userId,
            lessonId: lesson.id,
            completed,
            watchTime,
            watchedPercentage: watchedPct,
            updatedAt: randomDate(30, 0),
          },
          update: { completed, watchTime, watchedPercentage: watchedPct },
        });
        vpCount++;
      } catch (e) { /* skip duplicates */ }
    }
  }
  console.log(`   ✓ ${vpCount} video progress records`);

  // ========== 5. ASSIGNMENTS + QUIZZES ==========
  console.log('\n📝 Creating assignments & quizzes...');
  let assignCount = 0;
  let quizCount = 0;

  // Create assignments for ~60% of lessons
  const lessonsForAssignment = allLessons.filter((_, i) => i % 3 !== 2);
  for (const lesson of lessonsForAssignment) {
    const isQuiz = Math.random() > 0.5;
    const assignment = await prisma.assignment.create({
      data: {
        title: isQuiz ? `Quiz: ${lesson.title}` : `Bài tập: ${lesson.title}`,
        description: isQuiz ? `Kiểm tra kiến thức bài "${lesson.title}"` : `Bài tập thực hành cho bài "${lesson.title}"`,
        type: isQuiz ? 'quiz' : 'essay',
        lessonId: lesson.id,
        maxScore: 100,
        dueDate: new Date(Date.now() + 30 * 86400000),
      },
    });
    assignCount++;

    if (isQuiz) {
      const quiz = await prisma.quiz.create({
        data: {
          assignmentId: assignment.id,
          timeLimit: 15,
        },
      });

      // Create 5 questions per quiz
      const questionTemplates = [
        { content: `Câu hỏi 1 về "${lesson.title}"`, options: JSON.stringify(['A. Đáp án A', 'B. Đáp án B', 'C. Đáp án C', 'D. Đáp án D']), answer: 'A' },
        { content: `Câu hỏi 2 về "${lesson.title}"`, options: JSON.stringify(['A. Đúng', 'B. Sai', 'C. Không chắc', 'D. Tất cả']), answer: 'B' },
        { content: `Câu hỏi 3 về "${lesson.title}"`, options: JSON.stringify(['A. Phương án 1', 'B. Phương án 2', 'C. Phương án 3', 'D. Phương án 4']), answer: 'C' },
        { content: `Câu hỏi 4 về "${lesson.title}"`, options: JSON.stringify(['A. Lựa chọn A', 'B. Lựa chọn B', 'C. Lựa chọn C', 'D. Lựa chọn D']), answer: 'A' },
        { content: `Câu hỏi 5 về "${lesson.title}"`, options: JSON.stringify(['A. Sai', 'B. Đúng', 'C. Chưa rõ', 'D. Không']), answer: 'B' },
      ];
      for (let qi = 0; qi < questionTemplates.length; qi++) {
        await prisma.question.create({
          data: { quizId: quiz.id, ...questionTemplates[qi], score: 20, order: qi + 1 },
        });
      }
      quizCount++;
    }
  }
  console.log(`   ✓ ${assignCount} assignments, ${quizCount} quizzes with questions`);

  // ========== 6. SUBMISSIONS & QUIZ ATTEMPTS ==========
  console.log('\n✍️ Creating submissions & quiz attempts...');
  let subCount = 0;
  let attemptCount = 0;

  for (const enrollment of enrollments) {
    const courseLessons = allLessons.filter(l => l.section.course.id === enrollment.courseId);
    const progressRatio = enrollment.progress / 100;
    const completedLessonCount = Math.floor(courseLessons.length * progressRatio);

    for (let i = 0; i < completedLessonCount && i < courseLessons.length; i++) {
      const lesson = courseLessons[i];
      const assignments = await prisma.assignment.findMany({
        where: { lessonId: lesson.id },
        include: { quiz: true },
      });

      for (const assignment of assignments) {
        // Create submission
        const score = Math.floor(Math.random() * 40 + 60); // 60-100
        const statuses = ['graded', 'graded', 'graded', 'pending'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        try {
          await prisma.submission.upsert({
            where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: enrollment.userId } },
            create: {
              assignmentId: assignment.id,
              studentId: enrollment.userId,
              content: assignment.type === 'essay' ? `Bài làm của học sinh cho "${assignment.title}"` : null,
              score: status === 'graded' ? score : null,
              feedback: status === 'graded' ? (score >= 80 ? 'Tốt lắm!' : 'Cần cải thiện thêm.') : null,
              status,
              gradedAt: status === 'graded' ? randomDate(20, 0) : null,
              createdAt: randomDate(25, 1),
            },
            update: {},
          });
          subCount++;
        } catch (e) { /* skip */ }

        // Create quiz attempt if it's a quiz
        if (assignment.quiz) {
          const quizScore = Math.floor(Math.random() * 60 + 40); // 40-100
          try {
            await prisma.quizAttempt.upsert({
              where: { quizId_studentId: { quizId: assignment.quiz.id, studentId: enrollment.userId } },
              create: {
                quizId: assignment.quiz.id,
                studentId: enrollment.userId,
                answers: JSON.stringify({ 1: 'A', 2: 'B', 3: 'C', 4: 'A', 5: 'B' }),
                score: quizScore,
                maxScore: 100,
                createdAt: randomDate(25, 0),
              },
              update: {},
            });
            attemptCount++;
          } catch (e) { /* skip */ }
        }
      }
    }
  }
  console.log(`   ✓ ${subCount} submissions, ${attemptCount} quiz attempts`);

  // ========== 7. AWARD BADGES ==========
  console.log('\n🏅 Awarding badges to students...');
  const allBadges = await prisma.badge.findMany();
  let badgeAwardCount = 0;

  for (const student of students) {
    const [streak, completedCourses, quizAttempts, certificates, videosWatched, assignmentsSub, commentsCount, enrollCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: student.id }, select: { currentStreak: true } }),
      prisma.enrollment.count({ where: { userId: student.id, progress: { gte: 100 } } }),
      prisma.quizAttempt.count({ where: { studentId: student.id } }),
      prisma.certificate.count({ where: { userId: student.id } }),
      prisma.videoProgress.count({ where: { userId: student.id, completed: true } }),
      prisma.submission.count({ where: { studentId: student.id } }),
      prisma.comment.count({ where: { userId: student.id } }),
      prisma.enrollment.count({ where: { userId: student.id } }),
    ]);

    for (const badge of allBadges) {
      let current = 0;
      if (badge.category === 'streak') current = streak?.currentStreak || 0;
      else if (badge.category === 'course') current = completedCourses;
      else if (badge.category === 'quiz') current = quizAttempts;
      else if (badge.category === 'certificate') current = certificates;
      else if (badge.category === 'video') current = videosWatched;
      else if (badge.category === 'assignment') current = assignmentsSub;
      else if (badge.category === 'social') current = commentsCount;
      else if (badge.category === 'enrollment') current = enrollCount;

      if (current >= badge.requirement) {
        try {
          await prisma.userBadge.upsert({
            where: { userId_badgeId: { userId: student.id, badgeId: badge.id } },
            create: { userId: student.id, badgeId: badge.id, earnedAt: randomDate(30, 0) },
            update: {},
          });
          badgeAwardCount++;
        } catch (e) { /* skip */ }
      }
    }
  }
  console.log(`   ✓ ${badgeAwardCount} badges awarded`);

  // ========== 8. MONTHLY WINNERS (past months) ==========
  console.log('\n🏆 Creating monthly race history...');
  const now = new Date();
  const pastMonths = [
    { month: now.getMonth() === 0 ? 11 : now.getMonth(), year: now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear() }, // last month
    { month: now.getMonth() <= 1 ? 10 + now.getMonth() : now.getMonth() - 1, year: now.getMonth() <= 1 ? now.getFullYear() - 1 : now.getFullYear() }, // 2 months ago
  ];

  for (const pm of pastMonths) {
    const existing = await prisma.monthlyWinner.findFirst({ where: { month: pm.month, year: pm.year } });
    if (existing) { console.log(`   ⏭️ ${pm.month}/${pm.year} already exists`); continue; }

    const top3 = students.slice(0, 3);
    const rewards = [{ rank: 1, discount: 20 }, { rank: 2, discount: 10 }, { rank: 3, discount: 5 }];

    for (let ri = 0; ri < rewards.length; ri++) {
      const xp = 500 - ri * 120 + Math.floor(Math.random() * 50);
      const code = `MONTHLY${pm.month}${pm.year}-TOP${rewards[ri].rank}-${top3[ri].id.substring(0, 4).toUpperCase()}${Math.floor(Math.random() * 9000 + 1000)}`;

      await prisma.coupon.create({
        data: {
          code,
          discount: rewards[ri].discount,
          maxUses: 1,
          isActive: false, // past month coupons
          type: 'streak',
          userId: top3[ri].id,
          expiresAt: new Date(pm.year, pm.month, 1),
        },
      });

      await prisma.monthlyWinner.create({
        data: {
          userId: top3[ri].id,
          month: pm.month,
          year: pm.year,
          rank: rewards[ri].rank,
          xp,
          discount: rewards[ri].discount,
          couponCode: code,
        },
      });
    }
    console.log(`   ✓ Winners for ${pm.month}/${pm.year}`);
  }

  // ========== SUMMARY ==========
  const counts = await Promise.all([
    prisma.badge.count(),
    prisma.userBadge.count(),
    prisma.videoProgress.count(),
    prisma.assignment.count(),
    prisma.submission.count(),
    prisma.quiz.count(),
    prisma.quizAttempt.count(),
    prisma.monthlyWinner.count(),
  ]);

  console.log('\n✅ Full seed completed! Summary:');
  console.log(`   🏅 Badges:          ${counts[0]} definitions`);
  console.log(`   🎖️  User Badges:     ${counts[1]} awarded`);
  console.log(`   📹 Video Progress:  ${counts[2]} records`);
  console.log(`   📝 Assignments:     ${counts[3]}`);
  console.log(`   ✍️  Submissions:     ${counts[4]}`);
  console.log(`   ❓ Quizzes:         ${counts[5]}`);
  console.log(`   📊 Quiz Attempts:   ${counts[6]}`);
  console.log(`   🏆 Monthly Winners: ${counts[7]}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
