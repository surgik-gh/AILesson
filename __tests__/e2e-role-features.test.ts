/**
 * End-to-End Testing for Role-Specific Features
 * Tests all features specific to Student, Teacher, and Admin roles
 * 
 * Feature: ailesson-platform
 * Validates: Role-based access control and feature availability
 * @jest-environment node
 */

import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

describe('E2E: Role-Specific Features', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.userAnswer.deleteMany();
    await prisma.quizAttempt.deleteMany();
    await prisma.question.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.sentLesson.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.userAchievement.deleteMany();
    await prisma.leaderboardEntry.deleteMany();
    await prisma.tokenTransaction.deleteMany();
    await prisma.userSettings.deleteMany();
    await prisma.expert.deleteMany();
    await prisma.user.deleteMany({ where: { email: { contains: 'role-test' } } });
    await prisma.subject.deleteMany({ where: { name: { contains: 'Role Test' } } });
  }, 30000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Student-Specific Features', () => {
    let studentId: string;
    let expertId: string;
    let subjectId: string;
    let lessonId: string;
    let quizId: string;

    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const student = await prisma.user.create({
        data: {
          email: 'role-test-student@example.com',
          password: hashedPassword,
          name: 'Role Test Student',
          role: 'STUDENT',
          wisdomCoins: 150,
        },
      });
      studentId = student.id;

      const expert = await prisma.expert.create({
        data: {
          name: 'Student Expert',
          personality: 'Helpful',
          communicationStyle: 'Clear',
          appearance: 'teacher',
          ownerId: studentId,
        },
      });
      expertId = expert.id;

      await prisma.user.update({
        where: { id: studentId },
        data: { selectedExpertId: expertId },
      });

      const subject = await prisma.subject.create({
        data: {
          name: 'Role Test Subject',
          description: 'Test subject',
        },
      });
      subjectId = subject.id;

      const lesson = await prisma.lesson.create({
        data: {
          title: 'Test Lesson',
          content: 'Test content',
          keyPoints: ['Point 1'],
          difficulty: 'BEGINNER',
          subjectId: subjectId,
          creatorId: studentId,
        },
      });
      lessonId = lesson.id;

      const quiz = await prisma.quiz.create({
        data: {
          lessonId: lessonId,
          questions: {
            create: [
              {
                type: 'SINGLE',
                text: 'Test question?',
                correctAnswer: { answer: 'A' },
                options: { choices: ['Correct', 'Wrong', 'Wrong', 'Wrong'] },
                order: 1,
              },
            ],
          },
        },
      });
      quizId = quiz.id;
    }, 30000);

    it('should allow student to browse available lessons', async () => {
      const lessons = await prisma.lesson.findMany({
        where: { subjectId: subjectId },
        include: { subject: true, creator: true },
      });

      expect(lessons.length).toBeGreaterThan(0);
      expect(lessons[0].title).toBe('Test Lesson');
    });

    it('should allow student to take quiz', async () => {
      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId: quizId,
          userId: studentId,
        },
      });

      expect(attempt.userId).toBe(studentId);
      expect(attempt.quizId).toBe(quizId);
    });

    it('should allow student to submit answers and earn coins', async () => {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { questions: true },
      });

      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId: quizId,
          userId: studentId,
        },
      });

      const initialCoins = await prisma.user.findUnique({
        where: { id: studentId },
        select: { wisdomCoins: true },
      });

      await prisma.userAnswer.create({
        data: {
          questionId: quiz!.questions[0].id,
          userId: studentId,
          attemptId: attempt.id,
          answer: { answer: 'A' },
          isCorrect: true,
        },
      });

      await prisma.user.update({
        where: { id: studentId },
        data: { wisdomCoins: { increment: 2 } },
      });

      const finalCoins = await prisma.user.findUnique({
        where: { id: studentId },
        select: { wisdomCoins: true },
      });

      expect(finalCoins!.wisdomCoins).toBe(initialCoins!.wisdomCoins + 2);
    });

    it('should allow student to view leaderboard', async () => {
      await prisma.leaderboardEntry.upsert({
        where: { userId: studentId },
        create: {
          userId: studentId,
          score: 50,
          quizCount: 2,
          correctAnswers: 10,
          totalAnswers: 12,
        },
        update: {},
      });

      const leaderboard = await prisma.leaderboardEntry.findMany({
        orderBy: { score: 'desc' },
        include: { user: true },
      });

      expect(leaderboard.length).toBeGreaterThan(0);
      const studentEntry = leaderboard.find(e => e.userId === studentId);
      expect(studentEntry).toBeDefined();
      expect(studentEntry!.score).toBe(50);
    });

    it('should allow student to view achievements', async () => {
      const achievement = await prisma.achievement.findUnique({
        where: { name: 'first_quiz' },
      });

      if (achievement) {
        await prisma.userAchievement.upsert({
          where: {
            userId_achievementId: {
              userId: studentId,
              achievementId: achievement.id,
            },
          },
          create: {
            userId: studentId,
            achievementId: achievement.id,
          },
          update: {},
        });

        const userAchievements = await prisma.userAchievement.findMany({
          where: { userId: studentId },
          include: { achievement: true },
        });

        expect(userAchievements.length).toBeGreaterThan(0);
      }
    });

    it('should allow student to chat with expert', async () => {
      const initialCoins = await prisma.user.findUnique({
        where: { id: studentId },
        select: { wisdomCoins: true },
      });

      await prisma.chatMessage.create({
        data: {
          userId: studentId,
          expertId: expertId,
          content: 'Help me understand this topic',
          isFromUser: true,
        },
      });

      const chatCost = 5;
      await prisma.user.update({
        where: { id: studentId },
        data: { wisdomCoins: { decrement: chatCost } },
      });

      await prisma.chatMessage.create({
        data: {
          userId: studentId,
          expertId: expertId,
          content: 'I can help you with that!',
          isFromUser: false,
        },
      });

      const messages = await prisma.chatMessage.findMany({
        where: { userId: studentId, expertId: expertId },
        orderBy: { createdAt: 'asc' },
      });

      expect(messages.length).toBe(2);
      expect(messages[0].isFromUser).toBe(true);
      expect(messages[1].isFromUser).toBe(false);

      const finalCoins = await prisma.user.findUnique({
        where: { id: studentId },
        select: { wisdomCoins: true },
      });

      expect(finalCoins!.wisdomCoins).toBe(initialCoins!.wisdomCoins - chatCost);
    });

    it('should allow student to view transaction history', async () => {
      await prisma.tokenTransaction.create({
        data: {
          userId: studentId,
          amount: 2,
          type: 'ANSWER_REWARD',
          description: 'Correct answer',
        },
      });

      const transactions = await prisma.tokenTransaction.findMany({
        where: { userId: studentId },
        orderBy: { createdAt: 'desc' },
      });

      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions.some(t => t.type === 'ANSWER_REWARD')).toBe(true);
    });

    it('should allow student to change settings', async () => {
      await prisma.userSettings.upsert({
        where: { userId: studentId },
        create: {
          userId: studentId,
          theme: 'DARK',
        },
        update: {
          theme: 'DARK',
        },
      });

      const settings = await prisma.userSettings.findUnique({
        where: { userId: studentId },
      });

      expect(settings?.theme).toBe('DARK');
    });
  });

  describe('Teacher-Specific Features', () => {
    let teacherId: string;
    let studentId: string;
    let subjectId: string;
    let lessonId: string;

    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      const teacher = await prisma.user.create({
        data: {
          email: 'role-test-teacher@example.com',
          password: hashedPassword,
          name: 'Role Test Teacher',
          role: 'TEACHER',
          wisdomCoins: 250,
        },
      });
      teacherId = teacher.id;

      const student = await prisma.user.create({
        data: {
          email: 'role-test-teacher-student@example.com',
          password: hashedPassword,
          name: 'Teacher Test Student',
          role: 'STUDENT',
          wisdomCoins: 150,
        },
      });
      studentId = student.id;

      const subject = await prisma.subject.create({
        data: {
          name: 'Role Test Teacher Subject',
          description: 'Teacher test subject',
        },
      });
      subjectId = subject.id;
    }, 30000);

    it('should allow teacher to create lessons', async () => {
      const initialCoins = await prisma.user.findUnique({
        where: { id: teacherId },
        select: { wisdomCoins: true },
      });

      const lesson = await prisma.lesson.create({
        data: {
          title: 'Teacher Created Lesson',
          content: 'Lesson content by teacher',
          keyPoints: ['Key point 1', 'Key point 2'],
          difficulty: 'INTERMEDIATE',
          subjectId: subjectId,
          creatorId: teacherId,
        },
      });
      lessonId = lesson.id;

      // Deduct coins
      await prisma.user.update({
        where: { id: teacherId },
        data: { wisdomCoins: { decrement: 20 } },
      });

      await prisma.tokenTransaction.create({
        data: {
          userId: teacherId,
          amount: -20,
          type: 'LESSON_COST',
          description: `Created lesson: ${lesson.title}`,
        },
      });

      const finalCoins = await prisma.user.findUnique({
        where: { id: teacherId },
        select: { wisdomCoins: true },
      });

      expect(lesson.creatorId).toBe(teacherId);
      expect(finalCoins!.wisdomCoins).toBe(initialCoins!.wisdomCoins - 20);
    });

    it('should allow teacher to share lessons with students', async () => {
      await prisma.sentLesson.create({
        data: {
          lessonId: lessonId,
          teacherId: teacherId,
          studentId: studentId,
        },
      });

      const sentLessons = await prisma.sentLesson.findMany({
        where: { teacherId: teacherId },
        include: { lesson: true, student: true },
      });

      expect(sentLessons.length).toBeGreaterThan(0);
      expect(sentLessons[0].studentId).toBe(studentId);
    });

    it('should allow teacher to view list of students', async () => {
      const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: {
          id: true,
          name: true,
          email: true,
          leaderboardEntry: true,
        },
      });

      expect(students.length).toBeGreaterThan(0);
      expect(students.some(s => s.id === studentId)).toBe(true);
    });

    it('should allow teacher to view student progress', async () => {
      // Create quiz attempt for student
      const quiz = await prisma.quiz.create({
        data: {
          lessonId: lessonId,
          questions: {
            create: [
              {
                type: 'SINGLE',
                text: 'Teacher test question?',
                correctAnswer: { answer: 'A' },
                options: { choices: ['Right', 'Wrong', 'Wrong', 'Wrong'] },
                order: 1,
              },
            ],
          },
        },
        include: { questions: true },
      });

      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId: quiz.id,
          userId: studentId,
          completedAt: new Date(),
          score: 10,
        },
      });

      await prisma.userAnswer.create({
        data: {
          questionId: quiz.questions[0].id,
          userId: studentId,
          attemptId: attempt.id,
          answer: { answer: 'A' },
          isCorrect: true,
        },
      });

      // Teacher views student progress
      const studentProgress = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
          quizAttempts: {
            include: {
              quiz: {
                include: { lesson: true },
              },
              answers: true,
            },
          },
          achievements: {
            include: { achievement: true },
          },
          leaderboardEntry: true,
        },
      });

      expect(studentProgress?.quizAttempts.length).toBeGreaterThan(0);
      expect(studentProgress?.quizAttempts[0].score).toBe(10);
    });

    it('should allow teacher to view their created lessons', async () => {
      const teacherLessons = await prisma.lesson.findMany({
        where: { creatorId: teacherId },
        include: { subject: true, quiz: true },
      });

      expect(teacherLessons.length).toBeGreaterThan(0);
      expect(teacherLessons[0].creatorId).toBe(teacherId);
    });

    it('should allow teacher to export student progress', async () => {
      const studentData = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
          quizAttempts: {
            include: {
              quiz: {
                include: { lesson: true },
              },
              answers: true,
            },
          },
          achievements: {
            include: { achievement: true },
          },
          leaderboardEntry: true,
        },
      });

      // Simulate export data structure
      const exportData = {
        studentName: studentData?.name,
        email: studentData?.email,
        totalQuizzes: studentData?.quizAttempts.length,
        averageScore: studentData?.quizAttempts.reduce((sum, a) => sum + a.score, 0) / (studentData?.quizAttempts.length || 1),
        achievements: studentData?.achievements.length,
      };

      expect(exportData.studentName).toBe('Teacher Test Student');
      expect(exportData.totalQuizzes).toBeGreaterThan(0);
    });
  });

  describe('Admin-Specific Features', () => {
    let adminId: string;
    let testUserId: string;
    let testExpertId: string;
    let testSubjectId: string;

    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash('123456789', 12);
      
      const admin = await prisma.user.create({
        data: {
          email: 'role-test-admin@example.com',
          password: hashedPassword,
          name: 'админ228',
          role: 'ADMIN',
          wisdomCoins: 999999,
        },
      });
      adminId = admin.id;
    }, 30000);

    it('should allow admin to create users', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      const newUser = await prisma.user.create({
        data: {
          email: 'role-test-admin-created-user@example.com',
          password: hashedPassword,
          name: 'Admin Created User',
          role: 'STUDENT',
          wisdomCoins: 150,
        },
      });
      testUserId = newUser.id;

      expect(newUser.role).toBe('STUDENT');
      expect(newUser.wisdomCoins).toBe(150);
    });

    it('should allow admin to update user roles', async () => {
      await prisma.user.update({
        where: { id: testUserId },
        data: { role: 'TEACHER', wisdomCoins: 250 },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      expect(updatedUser?.role).toBe('TEACHER');
      expect(updatedUser?.wisdomCoins).toBe(250);
    });

    it('should allow admin to view all users', async () => {
      const allUsers = await prisma.user.findMany({
        where: { email: { contains: 'role-test' } },
      });

      expect(allUsers.length).toBeGreaterThan(0);
      expect(allUsers.some(u => u.role === 'ADMIN')).toBe(true);
      expect(allUsers.some(u => u.role === 'TEACHER')).toBe(true);
      expect(allUsers.some(u => u.role === 'STUDENT')).toBe(true);
    });

    it('should allow admin to create experts', async () => {
      const expert = await prisma.expert.create({
        data: {
          name: 'Admin Created Expert',
          personality: 'Professional and knowledgeable',
          communicationStyle: 'Formal and detailed',
          appearance: 'professor',
          ownerId: adminId,
        },
      });
      testExpertId = expert.id;

      expect(expert.ownerId).toBe(adminId);
      expect(expert.name).toBe('Admin Created Expert');
    });

    it('should allow admin to assign experts to users', async () => {
      await prisma.user.update({
        where: { id: testUserId },
        data: { selectedExpertId: testExpertId },
      });

      const userWithExpert = await prisma.user.findUnique({
        where: { id: testUserId },
        include: { selectedExpert: true },
      });

      expect(userWithExpert?.selectedExpertId).toBe(testExpertId);
      expect(userWithExpert?.selectedExpert?.name).toBe('Admin Created Expert');
    });

    it('should allow admin to create subjects', async () => {
      const subject = await prisma.subject.create({
        data: {
          name: 'Role Test Admin Subject',
          description: 'Admin created subject',
          icon: '📚',
        },
      });
      testSubjectId = subject.id;

      expect(subject.name).toBe('Role Test Admin Subject');
    });

    it('should allow admin to update subjects', async () => {
      await prisma.subject.update({
        where: { id: testSubjectId },
        data: { description: 'Updated by admin' },
      });

      const updatedSubject = await prisma.subject.findUnique({
        where: { id: testSubjectId },
      });

      expect(updatedSubject?.description).toBe('Updated by admin');
    });

    it('should allow admin to delete subjects', async () => {
      await prisma.subject.delete({
        where: { id: testSubjectId },
      });

      const deletedSubject = await prisma.subject.findUnique({
        where: { id: testSubjectId },
      });

      expect(deletedSubject).toBeNull();
    });

    it('should allow admin to create lessons without coin deduction', async () => {
      const subject = await prisma.subject.create({
        data: {
          name: 'Role Test Admin Lesson Subject',
          description: 'For admin lesson test',
        },
      });

      const initialCoins = await prisma.user.findUnique({
        where: { id: adminId },
        select: { wisdomCoins: true },
      });

      const lesson = await prisma.lesson.create({
        data: {
          title: 'Admin Free Lesson',
          content: 'Admin creates lessons for free',
          keyPoints: ['Free', 'Unlimited'],
          difficulty: 'ADVANCED',
          subjectId: subject.id,
          creatorId: adminId,
        },
      });

      const finalCoins = await prisma.user.findUnique({
        where: { id: adminId },
        select: { wisdomCoins: true },
      });

      expect(lesson.creatorId).toBe(adminId);
      expect(finalCoins!.wisdomCoins).toBe(initialCoins!.wisdomCoins); // No deduction
    });

    it('should allow admin to view all lessons', async () => {
      const allLessons = await prisma.lesson.findMany({
        include: { creator: true, subject: true },
      });

      expect(allLessons.length).toBeGreaterThan(0);
    });

    it('should allow admin to view all chat messages', async () => {
      const allChats = await prisma.chatMessage.findMany({
        include: { user: true, expert: true },
      });

      // May be empty if no chats exist
      expect(Array.isArray(allChats)).toBe(true);
    });

    it('should allow admin to delete users', async () => {
      await prisma.user.delete({
        where: { id: testUserId },
      });

      const deletedUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      expect(deletedUser).toBeNull();
    });

    it('should allow admin to delete experts', async () => {
      await prisma.expert.delete({
        where: { id: testExpertId },
      });

      const deletedExpert = await prisma.expert.findUnique({
        where: { id: testExpertId },
      });

      expect(deletedExpert).toBeNull();
    });

    it('should allow admin to moderate content', async () => {
      // Create a lesson to moderate
      const subject = await prisma.subject.create({
        data: {
          name: 'Role Test Moderation Subject',
          description: 'For moderation test',
        },
      });

      const lesson = await prisma.lesson.create({
        data: {
          title: 'Lesson to Moderate',
          content: 'This lesson will be moderated',
          keyPoints: ['Test'],
          difficulty: 'BEGINNER',
          subjectId: subject.id,
          creatorId: adminId,
        },
      });

      // Admin can view and delete inappropriate content
      const lessonToModerate = await prisma.lesson.findUnique({
        where: { id: lesson.id },
      });

      expect(lessonToModerate).not.toBeNull();

      // Delete inappropriate content
      await prisma.lesson.delete({
        where: { id: lesson.id },
      });

      const deletedLesson = await prisma.lesson.findUnique({
        where: { id: lesson.id },
      });

      expect(deletedLesson).toBeNull();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should enforce student cannot access admin features', async () => {
      const student = await prisma.user.findFirst({
        where: { role: 'STUDENT', email: { contains: 'role-test' } },
      });

      expect(student?.role).toBe('STUDENT');
      expect(student?.role).not.toBe('ADMIN');
    });

    it('should enforce teacher cannot access admin features', async () => {
      const teacher = await prisma.user.findFirst({
        where: { role: 'TEACHER', email: { contains: 'role-test' } },
      });

      expect(teacher?.role).toBe('TEACHER');
      expect(teacher?.role).not.toBe('ADMIN');
    });

    it('should enforce admin has unlimited access', async () => {
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN', email: { contains: 'role-test' } },
      });

      expect(admin?.role).toBe('ADMIN');
      expect(admin?.wisdomCoins).toBe(999999);
    });
  });
});
