const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hash = await bcrypt.hash('Admin123!', 10);

  // ─── Users ───────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lms.com' },
    update: { password: hash },
    create: {
      email: 'admin@lms.com',
      username: 'admin',
      password: hash,
      firstName: 'Admin',
      lastName: 'LMS',
      role: 'admin',
      isActive: true,
    },
  });

  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher1@lms.com' },
    update: { password: hash },
    create: {
      email: 'teacher1@lms.com',
      username: 'teacher1',
      password: hash,
      firstName: 'Nguyen',
      lastName: 'Van A',
      role: 'teacher',
      isActive: true,
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@lms.com' },
    update: { password: hash },
    create: {
      email: 'teacher2@lms.com',
      username: 'teacher2',
      password: hash,
      firstName: 'Tran',
      lastName: 'Thi B',
      role: 'teacher',
      isActive: true,
    },
  });

  const student1 = await prisma.user.upsert({
    where: { email: 'student1@lms.com' },
    update: { password: hash },
    create: {
      email: 'student1@lms.com',
      username: 'student1',
      password: hash,
      firstName: 'Le',
      lastName: 'Van C',
      role: 'student',
      isActive: true,
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@lms.com' },
    update: { password: hash },
    create: {
      email: 'student2@lms.com',
      username: 'student2',
      password: hash,
      firstName: 'Pham',
      lastName: 'Thi D',
      role: 'student',
      isActive: true,
    },
  });

  const parent1 = await prisma.user.upsert({
    where: { email: 'parent1@lms.com' },
    update: { password: hash },
    create: {
      email: 'parent1@lms.com',
      username: 'parent1',
      password: hash,
      firstName: 'Hoang',
      lastName: 'Van E',
      role: 'parent',
      isActive: true,
    },
  });

  const parent2 = await prisma.user.upsert({
    where: { email: 'parent2@lms.com' },
    update: { password: hash },
    create: {
      email: 'parent2@lms.com',
      username: 'parent2',
      password: hash,
      firstName: 'Vu',
      lastName: 'Thi F',
      role: 'parent',
      isActive: true,
    },
  });

  const student3 = await prisma.user.upsert({
    where: { email: 'student3@lms.com' },
    update: { password: hash },
    create: {
      email: 'student3@lms.com',
      username: 'student3',
      password: hash,
      firstName: 'Dang',
      lastName: 'Van G',
      role: 'student',
      isActive: true,
    },
  });

  console.log('Users created');

  // ─── Courses ─────────────────────────────────────────────────────────────────
  const course1 = await prisma.course.upsert({
    where: { id: 'course-001' },
    update: {},
    create: {
      id: 'course-001',
      title: 'Lập trình Python từ cơ bản đến nâng cao',
      description: 'Khoá học Python toàn diện giúp bạn nắm vững lập trình từ zero đến hero. Học cấu trúc dữ liệu, OOP, xử lý file, web scraping và nhiều hơn nữa.',
      price: 499000,
      thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
      status: 'published',
      authorId: teacher1.id,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { id: 'course-002' },
    update: {},
    create: {
      id: 'course-002',
      title: 'Web Development với React & Next.js',
      description: 'Xây dựng web app hiện đại với React 18, Next.js 14, TypeScript và Tailwind CSS. Từ cơ bản đến deploy production.',
      price: 799000,
      thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400',
      status: 'published',
      authorId: teacher1.id,
    },
  });

  const course3 = await prisma.course.upsert({
    where: { id: 'course-003' },
    update: {},
    create: {
      id: 'course-003',
      title: 'Machine Learning với Python & Scikit-Learn',
      description: 'Học Machine Learning thực hành với Python, NumPy, Pandas, Matplotlib và Scikit-Learn. Bao gồm các thuật toán phổ biến nhất.',
      price: 999000,
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
      status: 'published',
      authorId: teacher2.id,
    },
  });

  const course4 = await prisma.course.upsert({
    where: { id: 'course-004' },
    update: {},
    create: {
      id: 'course-004',
      title: 'English for Beginners - Tiếng Anh cơ bản',
      description: 'Khoá học tiếng Anh dành cho người mới bắt đầu. Học từ vựng, ngữ pháp và giao tiếp hàng ngày một cách tự nhiên.',
      price: 0,
      thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400',
      status: 'published',
      authorId: teacher2.id,
    },
  });

  const course5 = await prisma.course.upsert({
    where: { id: 'course-005' },
    update: {},
    create: {
      id: 'course-005',
      title: 'UI/UX Design với Figma',
      description: 'Thiết kế giao diện người dùng chuyên nghiệp với Figma. Từ wireframe đến prototype hoàn chỉnh.',
      price: 599000,
      thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400',
      status: 'draft',
      authorId: teacher1.id,
    },
  });

  /** Chờ admin duyệt — để test bảng quản trị */
  await prisma.course.upsert({
    where: { id: 'course-006' },
    update: {},
    create: {
      id: 'course-006',
      title: 'DevOps & Docker cho người mới (chờ duyệt)',
      description: 'CI/CD, container, triển khai ứng dụng. Khóa đang ở trạng thái pending để admin test phê duyệt.',
      price: 349000,
      thumbnail: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=400',
      status: 'pending',
      authorId: teacher2.id,
    },
  });

  console.log('Courses created');

  // ─── Sections & Lessons (course1 - Python) ───────────────────────────────────
  const sec1_1 = await prisma.section.upsert({
    where: { courseId_order: { courseId: course1.id, order: 1 } },
    update: {},
    create: { title: 'Giới thiệu Python', order: 1, courseId: course1.id },
  });
  const sec1_2 = await prisma.section.upsert({
    where: { courseId_order: { courseId: course1.id, order: 2 } },
    update: {},
    create: { title: 'Cấu trúc dữ liệu', order: 2, courseId: course1.id },
  });
  const sec1_3 = await prisma.section.upsert({
    where: { courseId_order: { courseId: course1.id, order: 3 } },
    update: {},
    create: { title: 'Lập trình hướng đối tượng', order: 3, courseId: course1.id },
  });

  const lesson1_1 = await prisma.lesson.upsert({
    where: { sectionId_order: { sectionId: sec1_1.id, order: 1 } },
    update: {},
    create: {
      title: 'Python là gì? Tại sao nên học Python?',
      content: 'Python là ngôn ngữ lập trình bậc cao, dễ học, mạnh mẽ và được sử dụng rộng rãi trong nhiều lĩnh vực.',
      videoUrl: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
      duration: 15,
      order: 1,
      sectionId: sec1_1.id,
    },
  });
  const lesson1_2 = await prisma.lesson.upsert({
    where: { sectionId_order: { sectionId: sec1_1.id, order: 2 } },
    update: {},
    create: {
      title: 'Cài đặt Python và VS Code',
      content: 'Hướng dẫn cài đặt môi trường phát triển Python trên Windows, Mac và Linux.',
      videoUrl: 'https://www.youtube.com/watch?v=YYXdXT2l-Gg',
      duration: 20,
      order: 2,
      sectionId: sec1_1.id,
    },
  });
  const lesson1_3 = await prisma.lesson.upsert({
    where: { sectionId_order: { sectionId: sec1_1.id, order: 3 } },
    update: {},
    create: {
      title: 'Biến, kiểu dữ liệu và toán tử',
      content: 'Tìm hiểu về biến, các kiểu dữ liệu cơ bản và các toán tử trong Python.',
      videoUrl: 'https://www.youtube.com/watch?v=khKv-8q7YmY',
      duration: 25,
      order: 3,
      sectionId: sec1_1.id,
    },
  });
  const lesson1_4 = await prisma.lesson.upsert({
    where: { sectionId_order: { sectionId: sec1_2.id, order: 1 } },
    update: {},
    create: {
      title: 'List và Tuple',
      content: 'Học cách sử dụng List và Tuple trong Python.',
      videoUrl: 'https://www.youtube.com/watch?v=W8KRzm-HUcc',
      duration: 30,
      order: 1,
      sectionId: sec1_2.id,
    },
  });
  const lesson1_5 = await prisma.lesson.upsert({
    where: { sectionId_order: { sectionId: sec1_2.id, order: 2 } },
    update: {},
    create: {
      title: 'Dictionary và Set',
      content: 'Tìm hiểu Dictionary và Set - hai cấu trúc dữ liệu quan trọng.',
      videoUrl: 'https://www.youtube.com/watch?v=daefaLgNkw0',
      duration: 28,
      order: 2,
      sectionId: sec1_2.id,
    },
  });
  const lesson1_6 = await prisma.lesson.upsert({
    where: { sectionId_order: { sectionId: sec1_3.id, order: 1 } },
    update: {},
    create: {
      title: 'Class và Object',
      content: 'Lập trình hướng đối tượng với Class và Object trong Python.',
      videoUrl: 'https://www.youtube.com/watch?v=JeznW_7DlB0',
      duration: 35,
      order: 1,
      sectionId: sec1_3.id,
    },
  });

  // ─── Sections & Lessons (course2 - React) ────────────────────────────────────
  const sec2_1 = await prisma.section.upsert({
    where: { courseId_order: { courseId: course2.id, order: 1 } },
    update: {},
    create: { title: 'React Fundamentals', order: 1, courseId: course2.id },
  });
  const sec2_2 = await prisma.section.upsert({
    where: { courseId_order: { courseId: course2.id, order: 2 } },
    update: {},
    create: { title: 'Next.js & Full Stack', order: 2, courseId: course2.id },
  });

  const lesson2_1 = await prisma.lesson.upsert({
    where: { sectionId_order: { sectionId: sec2_1.id, order: 1 } },
    update: {},
    create: {
      title: 'React là gì và tại sao cần dùng?',
      content: 'Giới thiệu về React - thư viện JavaScript phổ biến nhất hiện nay.',
      videoUrl: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM',
      duration: 18,
      order: 1,
      sectionId: sec2_1.id,
    },
  });
  const lesson2_2 = await prisma.lesson.upsert({
    where: { sectionId_order: { sectionId: sec2_1.id, order: 2 } },
    update: {},
    create: {
      title: 'Components, Props và State',
      content: 'Hiểu về Components, Props và State - ba khái niệm cốt lõi của React.',
      videoUrl: 'https://www.youtube.com/watch?v=O6P86uwfdR0',
      duration: 40,
      order: 2,
      sectionId: sec2_1.id,
    },
  });
  const lesson2_3 = await prisma.lesson.upsert({
    where: { sectionId_order: { sectionId: sec2_2.id, order: 1 } },
    update: {},
    create: {
      title: 'Next.js App Router',
      content: 'Tìm hiểu về Next.js 14 App Router - cách tổ chức pages và routing.',
      videoUrl: 'https://www.youtube.com/watch?v=__mSgDEOyv8',
      duration: 45,
      order: 1,
      sectionId: sec2_2.id,
    },
  });

  // ─── Sections & Lessons (course3 - ML) ───────────────────────────────────────
  const sec3_1 = await prisma.section.upsert({
    where: { courseId_order: { courseId: course3.id, order: 1 } },
    update: {},
    create: { title: 'Giới thiệu Machine Learning', order: 1, courseId: course3.id },
  });

  const lesson3_1 = await prisma.lesson.upsert({
    where: { sectionId_order: { sectionId: sec3_1.id, order: 1 } },
    update: {},
    create: {
      title: 'Machine Learning là gì?',
      content: 'Tổng quan về Machine Learning và các ứng dụng thực tế.',
      videoUrl: 'https://www.youtube.com/watch?v=ukzFI9rgwfU',
      duration: 22,
      order: 1,
      sectionId: sec3_1.id,
    },
  });

  // ─── Sections & Lessons (course4 - English) ──────────────────────────────────
  const sec4_1 = await prisma.section.upsert({
    where: { courseId_order: { courseId: course4.id, order: 1 } },
    update: {},
    create: { title: 'Bảng chữ cái và phát âm', order: 1, courseId: course4.id },
  });
  const sec4_2 = await prisma.section.upsert({
    where: { courseId_order: { courseId: course4.id, order: 2 } },
    update: {},
    create: { title: 'Từ vựng cơ bản', order: 2, courseId: course4.id },
  });

  const lesson4_1 = await prisma.lesson.upsert({
    where: { sectionId_order: { sectionId: sec4_1.id, order: 1 } },
    update: {},
    create: {
      title: 'Bảng chữ cái tiếng Anh',
      content: 'Học bảng chữ cái tiếng Anh và cách phát âm chuẩn.',
      videoUrl: 'https://www.youtube.com/watch?v=Hd9A3TZJPXU',
      duration: 10,
      order: 1,
      sectionId: sec4_1.id,
    },
  });
  const lesson4_2 = await prisma.lesson.upsert({
    where: { sectionId_order: { sectionId: sec4_2.id, order: 1 } },
    update: {},
    create: {
      title: '100 từ vựng tiếng Anh thông dụng nhất',
      content: 'Học 100 từ vựng cơ bản được sử dụng nhiều nhất trong giao tiếp hàng ngày.',
      videoUrl: 'https://www.youtube.com/watch?v=HRIlUcFlYqs',
      duration: 20,
      order: 1,
      sectionId: sec4_2.id,
    },
  });

  console.log('Sections & Lessons created');

  // ─── Enrollments ─────────────────────────────────────────────────────────────
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student1.id, courseId: course1.id } },
    update: {},
    create: { userId: student1.id, courseId: course1.id, status: 'active', progress: 66 },
  });
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student1.id, courseId: course4.id } },
    update: {},
    create: { userId: student1.id, courseId: course4.id, status: 'active', progress: 100 },
  });
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student2.id, courseId: course2.id } },
    update: {},
    create: { userId: student2.id, courseId: course2.id, status: 'active', progress: 33 },
  });
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student2.id, courseId: course4.id } },
    update: {},
    create: { userId: student2.id, courseId: course4.id, status: 'active', progress: 50 },
  });
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student3.id, courseId: course3.id } },
    update: {},
    create: { userId: student3.id, courseId: course3.id, status: 'active', progress: 25 },
  });
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student3.id, courseId: course1.id } },
    update: {},
    create: { userId: student3.id, courseId: course1.id, status: 'active', progress: 10 },
  });
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student1.id, courseId: course2.id } },
    update: {},
    create: { userId: student1.id, courseId: course2.id, status: 'active', progress: 40 },
  });

  console.log('Enrollments created');

  // ─── Video Progress ───────────────────────────────────────────────────────────
  await prisma.videoProgress.upsert({
    where: { userId_lessonId: { userId: student1.id, lessonId: lesson1_1.id } },
    update: {},
    create: { userId: student1.id, lessonId: lesson1_1.id, completed: true, watchTime: 900 },
  });
  await prisma.videoProgress.upsert({
    where: { userId_lessonId: { userId: student1.id, lessonId: lesson1_2.id } },
    update: {},
    create: { userId: student1.id, lessonId: lesson1_2.id, completed: true, watchTime: 1200 },
  });
  await prisma.videoProgress.upsert({
    where: { userId_lessonId: { userId: student1.id, lessonId: lesson1_3.id } },
    update: {},
    create: { userId: student1.id, lessonId: lesson1_3.id, completed: true, watchTime: 1500 },
  });
  await prisma.videoProgress.upsert({
    where: { userId_lessonId: { userId: student1.id, lessonId: lesson1_4.id } },
    update: {},
    create: { userId: student1.id, lessonId: lesson1_4.id, completed: true, watchTime: 1800 },
  });
  await prisma.videoProgress.upsert({
    where: { userId_lessonId: { userId: student1.id, lessonId: lesson4_1.id } },
    update: {},
    create: { userId: student1.id, lessonId: lesson4_1.id, completed: true, watchTime: 600 },
  });
  await prisma.videoProgress.upsert({
    where: { userId_lessonId: { userId: student1.id, lessonId: lesson4_2.id } },
    update: {},
    create: { userId: student1.id, lessonId: lesson4_2.id, completed: true, watchTime: 1200 },
  });

  console.log('Video progress created');

  // ─── Reviews ─────────────────────────────────────────────────────────────────
  await prisma.review.upsert({
    where: { courseId_userId: { courseId: course1.id, userId: student1.id } },
    update: {},
    create: {
      courseId: course1.id,
      userId: student1.id,
      rating: 5,
      comment: 'Khoá học rất hay, giảng viên giải thích dễ hiểu. Mình đã học xong và áp dụng được ngay vào công việc!',
    },
  });
  await prisma.review.upsert({
    where: { courseId_userId: { courseId: course2.id, userId: student2.id } },
    update: {},
    create: {
      courseId: course2.id,
      userId: student2.id,
      rating: 4,
      comment: 'Nội dung tốt, có nhiều ví dụ thực tế. Mong có thêm bài tập thực hành.',
    },
  });
  await prisma.review.upsert({
    where: { courseId_userId: { courseId: course4.id, userId: student1.id } },
    update: {},
    create: {
      courseId: course4.id,
      userId: student1.id,
      rating: 5,
      comment: 'Miễn phí mà chất lượng cực tốt! Rất phù hợp cho người mới bắt đầu.',
    },
  });

  console.log('Reviews created');

  // ─── Comments ────────────────────────────────────────────────────────────────
  await prisma.comment.upsert({
    where: { id: 'comment-001' },
    update: {},
    create: {
      id: 'comment-001',
      lessonId: lesson1_1.id,
      userId: student1.id,
      content: 'Bài giảng rất rõ ràng, cảm ơn thầy!',
    },
  });
  await prisma.comment.upsert({
    where: { id: 'comment-002' },
    update: {},
    create: {
      id: 'comment-002',
      lessonId: lesson1_1.id,
      userId: student2.id,
      content: 'Mình chưa hiểu phần cài đặt trên Mac, thầy có thể giải thích thêm không?',
    },
  });

  console.log('Comments created');

  // ─── Notifications ────────────────────────────────────────────────────────────
  const notifs = [
    { userId: student1.id, title: 'Chào mừng đến với LMS!', message: 'Bắt đầu học ngay hôm nay và mở khoá tiềm năng của bạn.', type: 'info', isRead: false },
    { userId: student1.id, title: 'Bạn đã đăng ký khoá học thành công', message: 'Khoá học "Lập trình Python từ cơ bản đến nâng cao" đã được kích hoạt.', type: 'success', isRead: true },
    { userId: student1.id, title: 'Nhắc nhở học tập', message: 'Bạn chưa học trong 3 ngày. Hãy tiếp tục khoá Python nhé!', type: 'warning', isRead: false },
    { userId: student2.id, title: 'Chào mừng đến với LMS!', message: 'Bắt đầu học ngay hôm nay và mở khoá tiềm năng của bạn.', type: 'info', isRead: false },
    { userId: teacher1.id, title: 'Khoá học mới được duyệt', message: 'Khoá học "Lập trình Python" của bạn đã được phê duyệt và xuất bản.', type: 'success', isRead: false },
    { userId: parent1.id, title: 'Chào mừng phụ huynh!', message: 'Bạn có thể theo dõi tiến độ học tập của con qua trang Phụ huynh.', type: 'info', isRead: false },
    { userId: parent2.id, title: 'Yêu cầu liên kết đã gửi', message: 'Học sinh cần chấp nhận để bạn xem tiến độ.', type: 'warning', isRead: false },
    { userId: teacher2.id, title: 'Khóa học chờ duyệt', message: 'Một khóa học mới đang chờ admin phê duyệt.', type: 'info', isRead: false },
  ];
  for (const n of notifs) await prisma.notification.create({ data: n });

  console.log('Notifications created');

  // ─── Coupons ─────────────────────────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: 'SALE20' },
    update: {},
    create: {
      code: 'SALE20',
      discount: 20,
      maxUses: 100,
      isActive: true,
      expiresAt: new Date('2026-12-31'),
    },
  });
  await prisma.coupon.upsert({
    where: { code: 'NEWUSER50' },
    update: {},
    create: {
      code: 'NEWUSER50',
      discount: 50,
      maxUses: 50,
      isActive: true,
      expiresAt: new Date('2026-12-31'),
    },
  });
  await prisma.coupon.upsert({
    where: { code: 'FREE100' },
    update: {},
    create: {
      code: 'FREE100',
      discount: 100,
      maxUses: 10,
      isActive: true,
      expiresAt: new Date('2026-12-31'),
    },
  });

  console.log('Coupons created');

  // ─── Certificate (student1 completed course4 - 100%) ─────────────────────────
  await prisma.certificate.upsert({
    where: { userId_courseId: { userId: student1.id, courseId: course4.id } },
    update: {},
    create: {
      userId: student1.id,
      courseId: course4.id,
      code: 'CERT-ENG-2024-001',
    },
  });

  console.log('Certificates created');

  // ─── Parent-Child link ────────────────────────────────────────────────────────
  await prisma.parentChild.upsert({
    where: { parentId_childId: { parentId: parent1.id, childId: student1.id } },
    update: {},
    create: {
      parentId: parent1.id,
      childId: student1.id,
      status: 'accepted',
    },
  });
  await prisma.parentChild.upsert({
    where: { parentId_childId: { parentId: parent1.id, childId: student2.id } },
    update: {},
    create: {
      parentId: parent1.id,
      childId: student2.id,
      status: 'accepted',
    },
  });
  await prisma.parentChild.upsert({
    where: { parentId_childId: { parentId: parent2.id, childId: student3.id } },
    update: {},
    create: {
      parentId: parent2.id,
      childId: student3.id,
      status: 'pending',
    },
  });

  console.log('Parent-child links created');

  // ─── Assignment & Quiz ────────────────────────────────────────────────────────
  const assignment1 = await prisma.assignment.upsert({
    where: { id: 'asgn-001' },
    update: {},
    create: {
      id: 'asgn-001',
      title: 'Bài tập: Viết chương trình tính giai thừa',
      description: 'Viết hàm Python tính giai thừa của một số nguyên dương bằng đệ quy và vòng lặp. So sánh hiệu quả của hai cách.',
      type: 'essay',
      lessonId: lesson1_3.id,
      dueDate: new Date('2026-06-30'),
      maxScore: 100,
    },
  });

  const assignment2 = await prisma.assignment.upsert({
    where: { id: 'asgn-002' },
    update: {},
    create: {
      id: 'asgn-002',
      title: 'Quiz: Kiểm tra kiến thức Python cơ bản',
      description: 'Kiểm tra kiến thức về biến, kiểu dữ liệu và toán tử trong Python.',
      type: 'quiz',
      lessonId: lesson1_2.id,
      maxScore: 10,
    },
  });

  const quiz1 = await prisma.quiz.upsert({
    where: { assignmentId: assignment2.id },
    update: {},
    create: {
      assignmentId: assignment2.id,
      timeLimit: 15,
    },
  });

  try {
  await prisma.question.createMany({
    data: [
      {
        id: 'q-001',
        quizId: quiz1.id,
        content: 'Python là ngôn ngữ lập trình gì?',
        options: JSON.stringify(['Biên dịch', 'Thông dịch', 'Hợp ngữ', 'Máy móc']),
        answer: 'Thông dịch',
        score: 2,
        order: 1,
      },
      {
        id: 'q-002',
        quizId: quiz1.id,
        content: 'Kiểu dữ liệu nào sau đây là bất biến (immutable) trong Python?',
        options: JSON.stringify(['List', 'Dictionary', 'Tuple', 'Set']),
        answer: 'Tuple',
        score: 2,
        order: 2,
      },
      {
        id: 'q-003',
        quizId: quiz1.id,
        content: 'Kết quả của 10 // 3 trong Python là?',
        options: JSON.stringify(['3.33', '3', '4', '1']),
        answer: '3',
        score: 2,
        order: 3,
      },
      {
        id: 'q-004',
        quizId: quiz1.id,
        content: 'Hàm nào dùng để in ra màn hình trong Python?',
        options: JSON.stringify(['echo()', 'print()', 'console.log()', 'printf()']),
        answer: 'print()',
        score: 2,
        order: 4,
      },
      {
        id: 'q-005',
        quizId: quiz1.id,
        content: 'Kết quả của len("Hello") là?',
        options: JSON.stringify(['4', '5', '6', 'Error']),
        answer: '5',
        score: 2,
        order: 5,
      },
    ],
  });
  } catch (e) {
    if (e.code !== 'P2002') throw e;
  }

  console.log('Assignments & Quiz created');

  // ─── Orders & Payments (sample) ───────────────────────────────────────────────
  const order1 = await prisma.order.upsert({
    where: { id: 'order-001' },
    update: {},
    create: {
      id: 'order-001',
      userId: student2.id,
      totalPrice: 499000,
      finalPrice: 499000,
      status: 'paid',
    },
  });
  await prisma.orderItem.upsert({
    where: { id: 'oi-001' },
    update: {},
    create: { id: 'oi-001', orderId: order1.id, courseId: course1.id, price: 499000 },
  });
  await prisma.payment.upsert({
    where: { orderId: order1.id },
    update: {},
    create: {
      orderId: order1.id,
      amount: 499000,
      status: 'paid',
      paidAt: new Date(),
    },
  });

  const order2 = await prisma.order.upsert({
    where: { id: 'order-002' },
    update: {},
    create: {
      id: 'order-002',
      userId: student1.id,
      totalPrice: 799000,
      finalPrice: 639200,
      status: 'paid',
    },
  });
  await prisma.orderItem.upsert({
    where: { id: 'oi-002' },
    update: {},
    create: { id: 'oi-002', orderId: order2.id, courseId: course2.id, price: 799000 },
  });
  await prisma.payment.upsert({
    where: { orderId: order2.id },
    update: {},
    create: {
      orderId: order2.id,
      amount: 639200,
      status: 'paid',
      paidAt: new Date(),
    },
  });

  const order3 = await prisma.order.upsert({
    where: { id: 'order-003' },
    update: {},
    create: {
      id: 'order-003',
      userId: student3.id,
      totalPrice: 999000,
      finalPrice: 999000,
      status: 'paid',
    },
  });
  await prisma.orderItem.upsert({
    where: { id: 'oi-003' },
    update: {},
    create: { id: 'oi-003', orderId: order3.id, courseId: course3.id, price: 999000 },
  });
  await prisma.payment.upsert({
    where: { orderId: order3.id },
    update: {},
    create: {
      orderId: order3.id,
      amount: 999000,
      status: 'paid',
      paidAt: new Date(),
    },
  });

  console.log('Orders & Payments created');

  // ─── Cart items ───────────────────────────────────────────────────────────────
  await prisma.cartItem.upsert({
    where: { userId_courseId: { userId: student1.id, courseId: course3.id } },
    update: {},
    create: { userId: student1.id, courseId: course3.id },
  });

  console.log('Cart items created');

  console.log('\n✅ Seed completed!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Tài khoản test (password: Admin123!)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 Admin    : admin@lms.com / Admin123!');
  console.log('👨‍🏫 Teacher 1: teacher1@lms.com / Admin123!');
  console.log('👨‍🏫 Teacher 2: teacher2@lms.com / Admin123!');
  console.log('🎓 Student 1: student1@lms.com / Admin123!');
  console.log('🎓 Student 2: student2@lms.com / Admin123!');
  console.log('👪 Parent 1 : parent1@lms.com / Admin123!');
  console.log('👪 Parent 2 : parent2@lms.com / Admin123!');
  console.log('🎓 Student 3: student3@lms.com / Admin123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Coupon codes: SALE20 | NEWUSER50 | FREE100');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
