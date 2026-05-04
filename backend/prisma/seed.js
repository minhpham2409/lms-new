const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Cleaning database...');
  // Delete in dependency order
  await prisma.videoProgress.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.material.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.review.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.parentChild.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.section.deleteMany();
  await prisma.course.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Creating users...');
  const password = await bcrypt.hash('123456', 10);

  // ===== ADMIN =====
  const admin = await prisma.user.create({
    data: { username: 'admin', email: 'admin@hoclotrinh.vn', password, firstName: 'Admin', lastName: 'System', role: 'admin', emailVerified: true },
  });

  // ===== TEACHERS =====
  const teachers = [];
  const teacherData = [
    { username: 'teacher_minh', email: 'minh@hoclotrinh.vn', firstName: 'Minh', lastName: 'Nguyễn' },
    { username: 'teacher_huong', email: 'huong@hoclotrinh.vn', firstName: 'Hương', lastName: 'Trần' },
    { username: 'teacher_john', email: 'john@hoclotrinh.vn', firstName: 'John', lastName: 'Smith' },
    { username: 'teacher_lan', email: 'lan@hoclotrinh.vn', firstName: 'Lan', lastName: 'Phạm' },
  ];
  for (const t of teacherData) {
    teachers.push(await prisma.user.create({ data: { ...t, password, role: 'teacher', emailVerified: true } }));
  }

  // ===== STUDENTS =====
  const students = [];
  const studentData = [
    { username: 'student_an', email: 'an@gmail.com', firstName: 'An', lastName: 'Nguyễn' },
    { username: 'student_binh', email: 'binh@gmail.com', firstName: 'Bình', lastName: 'Trần' },
    { username: 'student_chi', email: 'chi@gmail.com', firstName: 'Chi', lastName: 'Lê' },
    { username: 'student_dat', email: 'dat@gmail.com', firstName: 'Đạt', lastName: 'Phạm' },
    { username: 'student_em', email: 'em@gmail.com', firstName: 'Em', lastName: 'Hoàng' },
    { username: 'student_fu', email: 'fu@gmail.com', firstName: 'Phú', lastName: 'Ngô' },
    { username: 'student_giang', email: 'giang@gmail.com', firstName: 'Giang', lastName: 'Vũ' },
    { username: 'student_hai', email: 'hai@gmail.com', firstName: 'Hải', lastName: 'Đỗ' },
    { username: 'student_yen', email: 'yen@gmail.com', firstName: 'Yến', lastName: 'Bùi' },
    { username: 'student_khanh', email: 'khanh@gmail.com', firstName: 'Khánh', lastName: 'Đinh' },
  ];
  for (const s of studentData) {
    students.push(await prisma.user.create({ data: { ...s, password, role: 'student', emailVerified: true } }));
  }

  // ===== PARENTS =====
  const parents = [];
  const parentData = [
    { username: 'parent_thao', email: 'thao@gmail.com', firstName: 'Thảo', lastName: 'Nguyễn' },
    { username: 'parent_hung', email: 'hung@gmail.com', firstName: 'Hùng', lastName: 'Trần' },
  ];
  for (const p of parentData) {
    parents.push(await prisma.user.create({ data: { ...p, password, role: 'parent', emailVerified: true } }));
  }

  // Link parents to children
  await prisma.parentChild.create({ data: { parentId: parents[0].id, childId: students[0].id, status: 'accepted' } });
  await prisma.parentChild.create({ data: { parentId: parents[0].id, childId: students[1].id, status: 'accepted' } });
  await prisma.parentChild.create({ data: { parentId: parents[1].id, childId: students[2].id, status: 'accepted' } });

  console.log('📚 Creating courses...');
  const coursesData = [
    { title: 'Toán học cơ bản — Lớp 6', description: 'Nắm vững nền tảng toán học lớp 6 với video bài giảng chi tiết, bài tập tương tác và kiểm tra thường xuyên.', price: 0, status: 'published', authorId: teachers[0].id,
      sections: [
        { title: 'Giới thiệu', lessons: ['Chào mừng đến khóa học', 'Cách sử dụng nền tảng', 'Tổng quan chương trình'] },
        { title: 'Số tự nhiên', lessons: ['Khái niệm số tự nhiên', 'Phép cộng và trừ', 'Phép nhân và chia', 'Bài tập tổng hợp'] },
        { title: 'Phân số', lessons: ['Khái niệm phân số', 'Rút gọn phân số', 'So sánh phân số', 'Phép cộng trừ phân số', 'Phép nhân chia phân số', 'Bài tập phân số'] },
        { title: 'Hình học cơ bản', lessons: ['Điểm, đường thẳng, đoạn thẳng', 'Góc', 'Tam giác', 'Tứ giác', 'Diện tích và chu vi'] },
      ],
    },
    { title: 'Vật lý nâng cao — Lớp 8', description: 'Chinh phục Vật lý 8 với thí nghiệm mô phỏng, bài giảng trực quan và bài tập có lời giải chi tiết.', price: 199000, status: 'published', authorId: teachers[1].id,
      sections: [
        { title: 'Cơ học', lessons: ['Chuyển động cơ học', 'Vận tốc', 'Chuyển động đều', 'Lực — Hai lực cân bằng', 'Quán tính'] },
        { title: 'Nhiệt học', lessons: ['Nhiệt năng', 'Dẫn nhiệt', 'Đối lưu', 'Bức xạ nhiệt', 'Công thức tính nhiệt lượng'] },
        { title: 'Điện học', lessons: ['Sự nhiễm điện', 'Dòng điện', 'Cường độ dòng điện', 'Hiệu điện thế', 'Định luật Ohm'] },
      ],
    },
    { title: 'Tiếng Anh giao tiếp cơ bản', description: 'Luyện kỹ năng giao tiếp tiếng Anh hàng ngày qua video tình huống thực tế, từ vựng và ngữ pháp.', price: 0, status: 'published', authorId: teachers[2].id,
      sections: [
        { title: 'Getting Started', lessons: ['Greetings & Introductions', 'Numbers & Alphabet', 'Days & Months'] },
        { title: 'Daily Life', lessons: ['At School', 'At Home', 'Going Shopping', 'At the Restaurant'] },
        { title: 'Grammar Basics', lessons: ['Present Simple', 'Present Continuous', 'Past Simple', 'Future Tense'] },
      ],
    },
    { title: 'Hóa học vui — Lớp 9', description: 'Hóa học trở nên thú vị với thí nghiệm ảo, mô hình phân tử 3D và bài tập phân loại.', price: 149000, status: 'published', authorId: teachers[3].id,
      sections: [
        { title: 'Nguyên tử & Phân tử', lessons: ['Nguyên tử là gì?', 'Bảng tuần hoàn', 'Phân tử và liên kết'] },
        { title: 'Phản ứng hóa học', lessons: ['Sự biến đổi chất', 'Phản ứng hóa học', 'Cân bằng phương trình'] },
        { title: 'Hợp chất vô cơ', lessons: ['Oxit', 'Axit', 'Bazơ', 'Muối'] },
      ],
    },
    { title: 'Ngữ văn — Cảm thụ văn học lớp 7', description: 'Phát triển kỹ năng đọc hiểu, phân tích và viết văn nghị luận.', price: 0, status: 'published', authorId: teachers[0].id,
      sections: [
        { title: 'Thơ ca', lessons: ['Thơ lục bát', 'Thơ Đường luật', 'Phân tích bài thơ'] },
        { title: 'Truyện ngắn', lessons: ['Đọc hiểu truyện', 'Phân tích nhân vật', 'Viết bài cảm nhận'] },
      ],
    },
    { title: 'Lập trình Python cho người mới', description: 'Nhập môn lập trình Python từ con số 0, dành cho học sinh THCS.', price: 249000, status: 'published', authorId: teachers[2].id,
      sections: [
        { title: 'Cài đặt & Cơ bản', lessons: ['Cài đặt Python', 'Hello World', 'Biến và kiểu dữ liệu'] },
        { title: 'Cấu trúc điều khiển', lessons: ['If / Else', 'Vòng lặp For', 'Vòng lặp While', 'Bài tập'] },
        { title: 'Hàm & Module', lessons: ['Tạo hàm', 'Tham số và trả về', 'Import module'] },
      ],
    },
    { title: 'Toán nâng cao — Lớp 7', description: 'Khóa học nâng cao dành cho học sinh giỏi lớp 7.', price: 0, status: 'draft', authorId: teachers[0].id,
      sections: [
        { title: 'Đại số', lessons: ['Biểu thức đại số', 'Đa thức', 'Phương trình bậc nhất'] },
      ],
    },
  ];

  const courses = [];
  for (const cd of coursesData) {
    const { sections: secs, ...courseFields } = cd;
    const course = await prisma.course.create({ data: courseFields });
    courses.push(course);

    for (let si = 0; si < secs.length; si++) {
      const section = await prisma.section.create({
        data: { title: secs[si].title, order: si + 1, courseId: course.id },
      });
      for (let li = 0; li < secs[si].lessons.length; li++) {
        await prisma.lesson.create({
          data: {
            title: secs[si].lessons[li],
            content: `Nội dung chi tiết bài "${secs[si].lessons[li]}" thuộc chương "${secs[si].title}".`,
            order: li + 1,
            duration: 600 + Math.floor(Math.random() * 900),
            sectionId: section.id,
          },
        });
      }
    }
  }

  console.log('📝 Creating enrollments...');
  const enrollments = [
    { userId: students[0].id, courseId: courses[0].id, progress: 68 },
    { userId: students[0].id, courseId: courses[2].id, progress: 35 },
    { userId: students[0].id, courseId: courses[4].id, progress: 12 },
    { userId: students[1].id, courseId: courses[0].id, progress: 45 },
    { userId: students[1].id, courseId: courses[1].id, progress: 80 },
    { userId: students[2].id, courseId: courses[0].id, progress: 92 },
    { userId: students[2].id, courseId: courses[3].id, progress: 50 },
    { userId: students[3].id, courseId: courses[1].id, progress: 25 },
    { userId: students[3].id, courseId: courses[5].id, progress: 60 },
    { userId: students[4].id, courseId: courses[2].id, progress: 100 },
    { userId: students[4].id, courseId: courses[0].id, progress: 75 },
    { userId: students[5].id, courseId: courses[1].id, progress: 30 },
    { userId: students[5].id, courseId: courses[3].id, progress: 15 },
    { userId: students[6].id, courseId: courses[0].id, progress: 55 },
    { userId: students[6].id, courseId: courses[4].id, progress: 90 },
    { userId: students[7].id, courseId: courses[2].id, progress: 42 },
    { userId: students[8].id, courseId: courses[5].id, progress: 20 },
    { userId: students[9].id, courseId: courses[0].id, progress: 88 },
    { userId: students[9].id, courseId: courses[1].id, progress: 10 },
  ];
  for (const e of enrollments) {
    await prisma.enrollment.create({ data: { ...e, status: e.progress === 100 ? 'completed' : 'active' } });
  }

  console.log('⭐ Creating reviews...');
  const reviewsData = [
    { courseId: courses[0].id, userId: students[0].id, rating: 5, comment: 'Bài giảng rất dễ hiểu, cảm ơn thầy!' },
    { courseId: courses[0].id, userId: students[1].id, rating: 4, comment: 'Nội dung tốt, cần thêm bài tập thực hành.' },
    { courseId: courses[0].id, userId: students[2].id, rating: 5, comment: 'Con học tiến bộ rõ rệt, mẹ rất hài lòng.' },
    { courseId: courses[0].id, userId: students[6].id, rating: 5, comment: 'Thầy giảng rất hay!' },
    { courseId: courses[0].id, userId: students[9].id, rating: 4, comment: 'Khóa học chất lượng.' },
    { courseId: courses[1].id, userId: students[1].id, rating: 5, comment: 'Vật lý trở nên thú vị hơn nhiều!' },
    { courseId: courses[1].id, userId: students[3].id, rating: 4, comment: 'Cô giảng rõ ràng, dễ hiểu.' },
    { courseId: courses[1].id, userId: students[5].id, rating: 5, comment: 'Khóa đáng đồng tiền bát gạo.' },
    { courseId: courses[2].id, userId: students[0].id, rating: 4, comment: 'Tiếng Anh thực tế, rất hữu ích.' },
    { courseId: courses[2].id, userId: students[4].id, rating: 5, comment: 'Teacher John dạy cực hay!' },
    { courseId: courses[2].id, userId: students[7].id, rating: 4, comment: 'Nên thêm phần listening.' },
    { courseId: courses[3].id, userId: students[2].id, rating: 5, comment: 'Hóa học không còn nhàm chán nữa!' },
    { courseId: courses[3].id, userId: students[5].id, rating: 4, comment: 'Thí nghiệm ảo rất cool.' },
    { courseId: courses[5].id, userId: students[3].id, rating: 5, comment: 'Dễ hiểu cho người mới bắt đầu.' },
    { courseId: courses[5].id, userId: students[8].id, rating: 4, comment: 'Cần thêm project thực tế.' },
  ];
  for (const r of reviewsData) {
    await prisma.review.create({ data: r });
  }

  console.log('🎫 Creating coupons...');
  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME20', discount: 20, maxUses: 500, usedCount: 156, isActive: true, expiresAt: new Date('2026-06-30') },
      { code: 'SUMMER50K', discount: 50000, maxUses: 200, usedCount: 89, isActive: true, expiresAt: new Date('2026-07-15') },
      { code: 'HOCGIOI', discount: 30, maxUses: 100, usedCount: 45, isActive: true, expiresAt: new Date('2026-08-01') },
      { code: 'FREESHIP', discount: 100, maxUses: 300, usedCount: 300, isActive: false, expiresAt: new Date('2026-04-30') },
    ],
  });
  const coupons = await prisma.coupon.findMany();

  console.log('🛒 Creating orders...');
  const ordersData = [
    { userId: students[1].id, courseId: courses[1].id, price: 199000, status: 'completed' },
    { userId: students[3].id, courseId: courses[1].id, price: 199000, status: 'completed' },
    { userId: students[5].id, courseId: courses[1].id, price: 199000, status: 'completed', couponId: coupons[0].id },
    { userId: students[2].id, courseId: courses[3].id, price: 149000, status: 'completed' },
    { userId: students[5].id, courseId: courses[3].id, price: 149000, status: 'pending' },
    { userId: students[3].id, courseId: courses[5].id, price: 249000, status: 'completed' },
    { userId: students[8].id, courseId: courses[5].id, price: 249000, status: 'completed' },
    { userId: students[9].id, courseId: courses[1].id, price: 199000, status: 'pending' },
  ];
  for (const od of ordersData) {
    const finalPrice = od.couponId ? od.price * 0.8 : od.price;
    const order = await prisma.order.create({
      data: { userId: od.userId, totalPrice: od.price, finalPrice, status: od.status, couponId: od.couponId || null },
    });
    await prisma.orderItem.create({ data: { orderId: order.id, courseId: od.courseId, price: od.price } });
    if (od.status === 'completed') {
      await prisma.payment.create({
        data: { orderId: order.id, amount: finalPrice, status: 'completed', txnRef: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`, paidAt: new Date() },
      });
    }
  }

  console.log('🔔 Creating notifications...');
  const notifData = [
    { userId: students[0].id, title: 'Bài mới!', message: 'Thầy Minh vừa đăng bài mới: "Phép nhân chia phân số"', type: 'course' },
    { userId: students[0].id, title: 'Đạt 68% tiến độ', message: 'Chúc mừng bạn đã hoàn thành 68% khóa Toán lớp 6!', type: 'achievement' },
    { userId: students[0].id, title: 'Khuyến mãi mới', message: 'Dùng mã SUMMER50K để giảm 50k cho khóa tiếp theo.', type: 'promo', isRead: true },
    { userId: students[1].id, title: 'Điểm bài kiểm tra', message: 'Bạn đạt 9/10 bài kiểm tra Vật lý chương 2.', type: 'grade' },
    { userId: students[2].id, title: 'Chứng chỉ mới', message: 'Bạn nhận được chứng chỉ hoàn thành khóa Toán lớp 6!', type: 'certificate' },
    { userId: parents[0].id, title: 'Báo cáo tuần', message: 'Con An đã học 12.5 giờ tuần này, tiến bộ tốt.', type: 'report' },
    { userId: teachers[0].id, title: 'Câu hỏi mới', message: 'Học sinh Phạm Đạt đặt câu hỏi tại bài "Phân số".', type: 'question' },
  ];
  for (const n of notifData) {
    await prisma.notification.create({ data: n });
  }

  console.log('🏆 Creating certificates...');
  await prisma.certificate.create({
    data: { userId: students[4].id, courseId: courses[2].id, code: 'CERT-2026-001' },
  });
  await prisma.certificate.create({
    data: { userId: students[2].id, courseId: courses[0].id, code: 'CERT-2026-002' },
  });

  console.log('💬 Creating comments...');
  const allLessons = await prisma.lesson.findMany({ take: 5 });
  if (allLessons.length > 0) {
    await prisma.comment.create({ data: { lessonId: allLessons[0].id, userId: students[0].id, content: 'Thầy ơi, phần này con chưa hiểu lắm ạ.' } });
    await prisma.comment.create({ data: { lessonId: allLessons[0].id, userId: teachers[0].id, content: 'Con xem lại ví dụ ở phút 8:30 nhé, thầy giải thích kỹ rồi.' } });
    await prisma.comment.create({ data: { lessonId: allLessons[2].id, userId: students[1].id, content: 'Bài giảng rất hay, cảm ơn thầy!' } });
    await prisma.comment.create({ data: { lessonId: allLessons[3].id, userId: students[3].id, content: 'Cho con hỏi bài tập số 5 làm sao ạ?' } });
  }

  // Cart items
  await prisma.cartItem.create({ data: { userId: students[0].id, courseId: courses[1].id } });
  await prisma.cartItem.create({ data: { userId: students[0].id, courseId: courses[5].id } });
  await prisma.cartItem.create({ data: { userId: students[6].id, courseId: courses[3].id } });

  console.log('\n✅ Seed completed! Summary:');
  console.log(`   👤 Users:        ${1 + teachers.length + students.length + parents.length} (1 admin, ${teachers.length} teachers, ${students.length} students, ${parents.length} parents)`);
  console.log(`   📚 Courses:      ${courses.length}`);
  console.log(`   📝 Enrollments:  ${enrollments.length}`);
  console.log(`   ⭐ Reviews:      ${reviewsData.length}`);
  console.log(`   🛒 Orders:       ${ordersData.length}`);
  console.log(`   🎫 Coupons:      ${coupons.length}`);
  console.log(`   🔔 Notifications: ${notifData.length}`);
  console.log(`   🏆 Certificates: 2`);
  console.log('');
  console.log('========================================');
  console.log('   📋 TEST ACCOUNTS (password: 123456)');
  console.log('========================================');
  console.log('   🔴 Admin:    admin@hoclotrinh.vn');
  console.log('   🟢 Teacher:  minh@hoclotrinh.vn');
  console.log('   🟢 Teacher:  huong@hoclotrinh.vn');
  console.log('   🔵 Student:  an@gmail.com');
  console.log('   🔵 Student:  binh@gmail.com');
  console.log('   🔵 Student:  chi@gmail.com');
  console.log('   🟡 Parent:   thao@gmail.com');
  console.log('   🟡 Parent:   hung@gmail.com');
  console.log('========================================');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
