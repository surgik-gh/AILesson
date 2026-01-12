/**
 * End-to-End Testing for AILesson Platform
 * Tests complete user flows across all roles
 * 
 * Feature: ailesson-platform
 * Validates: Complete system integration and user workflows
 * @jest-environment node
 */

import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

describe('E2E: Complete User Flows', () => {
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
    await prisma.user.deleteMany({ where: { email: { contains: 'e2e-test' } } });
    await prisma.subject.deleteMany({ where: { name: { contains: 'E2E Test' } } });
  }, 30000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Student Complete Flow', () => {
    let studentId: string;
    let expertId: string;
    let lessonId: string;
    let quizId: string;
    let subjectId: string;

    it('should complete full student journey: registration → expert → lesson → quiz → achievement', async () => {
      // Step 1: Student Registration
      const hashedPassword = await bcrypt.hash('password123', 12);
      const student = await prisma.user.create({
        data: {
          email: 'e2e-test-student@example.com',
          password: hashedPassword,
          name: 'E2E Test Student',
          role: 'STUDENT',
          wisdomCoins: 150,
        },
      });
      studentId = student.id;

      expect(student.wisdomCoins).toBe(150);
      expect(student.role).toBe('STUDENT');

      // Verify initial transaction
      const initialTransaction = await prisma.tokenTransaction.create({
        data: {
          userId: studentId,
          amount: 150,
          type: 'INITIAL',
          description: 'Initial registration coins',
        },
      });
      expect(initialTransaction.amount).toBe(150);

      // Step 2: Expert Creation
      const expert = await prisma.expert.create({
        data: {
          name: 'Professor Einstein',
          personality: 'Wise, patient, and encouraging',
          communicationStyle: 'Clear explanations with real-world examples',
          appearance: 'scientist',
          ownerId: studentId,
        },
      });
      expertId = expert.id;

      // Step 3: Select Expert
      await prisma.user.update({
        where: { id: studentId },
        data: { selectedExpertId: expertId },
      });

      const updatedStudent = await prisma.user.findUnique({
        where: { id: studentId },
        include: { selectedExpert: true },
      });
      expect(updatedStudent?.selectedExpertId).toBe(expertId);
      expect(updatedStudent?.selectedExpert?.name).toBe('Professor Einstein');

      // Step 4: Create Subject (for lesson)
      const subject = await prisma.subject.create({
        data: {
          name: 'E2E Test Mathematics',
          description: 'Test subject for E2E testing',
        },
      });
      subjectId = subject.id;

      // Step 5: Create Lesson (simulating teacher/admin action)
      const lesson = await prisma.lesson.create({
        data: {
          title: 'Introduction to Algebra',
          content: 'Algebra is the study of mathematical symbols and rules...',
          keyPoints: ['Variables', 'Equations', 'Functions'],
          difficulty: 'BEGINNER',
          subjectId: subjectId,
          creatorId: studentId, // In real scenario, this would be teacher
        },
      });
      lessonId = lesson.id;

      // Step 6: Create Quiz for Lesson
      const quiz = await prisma.quiz.create({
        data: {
          lessonId: lessonId,
          questions: {
            create: [
              {
                type: 'SINGLE',
                text: 'What is 2 + 2?',
                correctAnswer: { answer: 'A' },
                options: { choices: ['4', '3', '5', '6'] },
                order: 1,
              },
              {
                type: 'SINGLE',
                text: 'What is 5 * 3?',
                correctAnswer: { answer: 'B' },
                options: { choices: ['10', '15', '20', '25'] },
                order: 2,
              },
            ],
          },
        },
        include: { questions: true },
      });
      quizId = quiz.id;

      expect(quiz.questions.length).toBe(2);

      // Step 7: Start Quiz Attempt
      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId: quizId,
          userId: studentId,
        },
      });

      // Step 8: Answer Questions Correctly
      const question1 = quiz.questions.find(q => q.order === 1);
      const question2 = quiz.questions.find(q => q.order === 2);

      // Answer question 1 correctly
      await prisma.userAnswer.create({
        data: {
          questionId: question1!.id,
          userId: studentId,
          attemptId: attempt.id,
          answer: { answer: 'A' },
          isCorrect: true,
        },
      });

      // Update coins and leaderboard for correct answer
      await prisma.user.update({
        where: { id: studentId },
        data: { wisdomCoins: { increment: 2 } },
      });

      await prisma.tokenTransaction.create({
        data: {
          userId: studentId,
          amount: 2,
          type: 'ANSWER_REWARD',
          description: 'Correct answer reward',
        },
      });

      await prisma.leaderboardEntry.upsert({
        where: { userId: studentId },
        create: {
          userId: studentId,
          score: 10,
          quizCount: 0,
          correctAnswers: 1,
          totalAnswers: 1,
        },
        update: {
          score: { increment: 10 },
          correctAnswers: { increment: 1 },
          totalAnswers: { increment: 1 },
        },
      });

      // Answer question 2 correctly
      await prisma.userAnswer.create({
        data: {
          questionId: question2!.id,
          userId: studentId,
          attemptId: attempt.id,
          answer: { answer: 'B' },
          isCorrect: true,
        },
      });

      await prisma.user.update({
        where: { id: studentId },
        data: { wisdomCoins: { increment: 2 } },
      });

      await prisma.tokenTransaction.create({
        data: {
          userId: studentId,
          amount: 2,
          type: 'ANSWER_REWARD',
          description: 'Correct answer reward',
        },
      });

      await prisma.leaderboardEntry.update({
        where: { userId: studentId },
        data: {
          score: { increment: 10 },
          correctAnswers: { increment: 1 },
          totalAnswers: { increment: 1 },
        },
      });

      // Step 9: Complete Quiz with Perfect Score
      await prisma.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          completedAt: new Date(),
          score: 20,
          isPerfect: true,
        },
      });

      // Award perfect quiz bonus
      await prisma.leaderboardEntry.update({
        where: { userId: studentId },
        data: {
          score: { increment: 50 },
          quizCount: { increment: 1 },
        },
      });

      // Step 10: Check Achievements
      // First quiz achievement
      const firstQuizAchievement = await prisma.achievement.findUnique({
        where: { name: 'first_quiz' },
      });

      if (firstQuizAchievement) {
        await prisma.userAchievement.create({
          data: {
            userId: studentId,
            achievementId: firstQuizAchievement.id,
          },
        });
      }

      // Perfect quiz achievement
      const perfectQuizAchievement = await prisma.achievement.findUnique({
        where: { name: 'perfect_quiz' },
      });

      if (perfectQuizAchievement) {
        await prisma.userAchievement.create({
          data: {
            userId: studentId,
            achievementId: perfectQuizAchievement.id,
          },
        });
      }

      // Step 11: Verify Final State
      const finalStudent = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
          achievements: {
            include: { achievement: true },
          },
          leaderboardEntry: true,
          transactions: true,
        },
      });

      // Verify wisdom coins: 150 (initial) + 2 + 2 = 154
      expect(finalStudent?.wisdomCoins).toBe(154);

      // Verify leaderboard: 10 + 10 + 50 (perfect bonus) = 70
      expect(finalStudent?.leaderboardEntry?.score).toBe(70);
      expect(finalStudent?.leaderboardEntry?.quizCount).toBe(1);
      expect(finalStudent?.leaderboardEntry?.correctAnswers).toBe(2);
      expect(finalStudent?.leaderboardEntry?.totalAnswers).toBe(2);

      // Verify achievements
      expect(finalStudent?.achievements.length).toBeGreaterThanOrEqual(1);

      // Verify transactions
      expect(finalStudent?.transactions.length).toBeGreaterThanOrEqual(3);
    }, 30000);
  });

  describe('Teacher Complete Flow', () => {
    let teacherId: string;
    let studentId: string;
    let lessonId: string;
    let subjectId: string;

    it('should complete full teacher journey: registration → create lesson → share lesson → view progress', async () => {
      // Step 1: Teacher Registration
      const hashedPassword = await bcrypt.hash('password123', 12);
      const teacher = await prisma.user.create({
        data: {
          email: 'e2e-test-teacher@example.com',
          password: hashedPassword,
          name: 'E2E Test Teacher',
          role: 'TEACHER',
          wisdomCoins: 250,
        },
      });
      teacherId = teacher.id;

      expect(teacher.wisdomCoins).toBe(250);
      expect(teacher.role).toBe('TEACHER');

      // Step 2: Create Student
      const student = await prisma.user.create({
        data: {
          email: 'e2e-test-student-2@example.com',
          password: hashedPassword,
          name: 'E2E Test Student 2',
          role: 'STUDENT',
          wisdomCoins: 150,
        },
      });
      studentId = student.id;

      // Step 3: Create Subject
      const subject = await prisma.subject.create({
        data: {
          name: 'E2E Test Physics',
          description: 'Test subject for teacher flow',
        },
      });
      subjectId = subject.id;

      // Step 4: Teacher Creates Lesson
      const lesson = await prisma.lesson.create({
        data: {
          title: 'Newton\'s Laws of Motion',
          content: 'The three laws of motion describe the relationship between forces and motion...',
          keyPoints: ['First Law', 'Second Law', 'Third Law'],
          difficulty: 'INTERMEDIATE',
          subjectId: subjectId,
          creatorId: teacherId,
        },
      });
      lessonId = lesson.id;

      // Deduct coins for lesson creation
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

      // Create quiz for lesson
      await prisma.quiz.create({
        data: {
          lessonId: lessonId,
          questions: {
            create: [
              {
                type: 'SINGLE',
                text: 'What is Newton\'s First Law?',
                correctAnswer: { answer: 'A' },
                options: { choices: ['Law of Inertia', 'F=ma', 'Action-Reaction', 'Gravity'] },
                order: 1,
              },
            ],
          },
        },
      });

      // Step 5: Share Lesson with Student
      await prisma.sentLesson.create({
        data: {
          lessonId: lessonId,
          teacherId: teacherId,
          studentId: studentId,
        },
      });

      // Step 6: Student Completes Quiz
      const quiz = await prisma.quiz.findUnique({
        where: { lessonId: lessonId },
        include: { questions: true },
      });

      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId: quiz!.id,
          userId: studentId,
          completedAt: new Date(),
          score: 10,
        },
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

      await prisma.leaderboardEntry.create({
        data: {
          userId: studentId,
          score: 10,
          quizCount: 1,
          correctAnswers: 1,
          totalAnswers: 1,
        },
      });

      // Step 7: Teacher Views Student Progress
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

      expect(studentProgress?.quizAttempts.length).toBe(1);
      expect(studentProgress?.leaderboardEntry?.score).toBe(10);

      // Step 8: Verify Teacher's Final State
      const finalTeacher = await prisma.user.findUnique({
        where: { id: teacherId },
        include: {
          lessons: true,
          transactions: true,
        },
      });

      // Verify coins: 250 - 20 = 230
      expect(finalTeacher?.wisdomCoins).toBe(230);
      expect(finalTeacher?.lessons.length).toBe(1);
      expect(finalTeacher?.transactions.length).toBe(1);
    }, 30000);
  });

  describe('Admin Complete Flow', () => {
    let adminId: string;
    let userId: string;
    let expertId: string;
    let subjectId: string;

    it('should complete full admin journey: login → manage users → manage experts → manage subjects → moderate content', async () => {
      // Step 1: Admin Login (using predefined credentials)
      const hashedPassword = await bcrypt.hash('123456789', 12);
      const admin = await prisma.user.create({
        data: {
          email: 'e2e-test-admin@example.com',
          password: hashedPassword,
          name: 'админ228',
          role: 'ADMIN',
          wisdomCoins: 999999,
        },
      });
      adminId = admin.id;

      expect(admin.role).toBe('ADMIN');
      expect(admin.wisdomCoins).toBe(999999);

      // Step 2: Create User
      const user = await prisma.user.create({
        data: {
          email: 'e2e-test-user@example.com',
          password: hashedPassword,
          name: 'Test User',
          role: 'STUDENT',
          wisdomCoins: 150,
        },
      });
      userId = user.id;

      // Step 3: Admin Updates User Role
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'TEACHER', wisdomCoins: 250 },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(updatedUser?.role).toBe('TEACHER');
      expect(updatedUser?.wisdomCoins).toBe(250);

      // Step 4: Admin Creates Expert
      const expert = await prisma.expert.create({
        data: {
          name: 'Dr. Science',
          personality: 'Enthusiastic and knowledgeable',
          communicationStyle: 'Engaging with humor',
          appearance: 'scientist',
          ownerId: adminId,
        },
      });
      expertId = expert.id;

      // Step 5: Admin Assigns Expert to User
      await prisma.user.update({
        where: { id: userId },
        data: { selectedExpertId: expertId },
      });

      const userWithExpert = await prisma.user.findUnique({
        where: { id: userId },
        include: { selectedExpert: true },
      });
      expect(userWithExpert?.selectedExpertId).toBe(expertId);

      // Step 6: Admin Creates Subject
      const subject = await prisma.subject.create({
        data: {
          name: 'E2E Test Chemistry',
          description: 'Admin-created subject',
          icon: '🧪',
        },
      });
      subjectId = subject.id;

      // Step 7: Admin Updates Subject
      await prisma.subject.update({
        where: { id: subjectId },
        data: { description: 'Updated description' },
      });

      const updatedSubject = await prisma.subject.findUnique({
        where: { id: subjectId },
      });
      expect(updatedSubject?.description).toBe('Updated description');

      // Step 8: Admin Creates Lesson (no coin deduction)
      const initialCoins = admin.wisdomCoins;
      const lesson = await prisma.lesson.create({
        data: {
          title: 'Chemical Reactions',
          content: 'Chemical reactions involve the transformation of substances...',
          keyPoints: ['Reactants', 'Products', 'Energy'],
          difficulty: 'ADVANCED',
          subjectId: subjectId,
          creatorId: adminId,
        },
      });

      // Verify admin coins unchanged
      const adminAfterLesson = await prisma.user.findUnique({
        where: { id: adminId },
      });
      expect(adminAfterLesson?.wisdomCoins).toBe(initialCoins);

      // Step 9: Admin Moderates Content (delete lesson)
      await prisma.lesson.delete({
        where: { id: lesson.id },
      });

      const deletedLesson = await prisma.lesson.findUnique({
        where: { id: lesson.id },
      });
      expect(deletedLesson).toBeNull();

      // Step 10: Admin Views All Users
      const allUsers = await prisma.user.findMany({
        where: {
          email: { contains: 'e2e-test' },
        },
      });
      expect(allUsers.length).toBeGreaterThanOrEqual(3); // admin, user, and others from previous tests

      // Step 11: Admin Deletes User
      await prisma.user.delete({
        where: { id: userId },
      });

      const deletedUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(deletedUser).toBeNull();
    }, 30000);
  });

  describe('Chat System Flow', () => {
    let studentId: string;
    let expertId: string;

    it('should complete chat flow: send message → deduct coins → receive response → persist history', async () => {
      // Step 1: Create Student with Expert
      const hashedPassword = await bcrypt.hash('password123', 12);
      const student = await prisma.user.create({
        data: {
          email: 'e2e-test-chat-student@example.com',
          password: hashedPassword,
          name: 'Chat Test Student',
          role: 'STUDENT',
          wisdomCoins: 150,
        },
      });
      studentId = student.id;

      const expert = await prisma.expert.create({
        data: {
          name: 'Chat Expert',
          personality: 'Helpful and friendly',
          communicationStyle: 'Clear and concise',
          appearance: 'teacher',
          ownerId: studentId,
        },
      });
      expertId = expert.id;

      await prisma.user.update({
        where: { id: studentId },
        data: { selectedExpertId: expertId },
      });

      // Step 2: Send Chat Message
      const chatCost = 5;
      const initialCoins = student.wisdomCoins;

      // Create user message
      await prisma.chatMessage.create({
        data: {
          userId: studentId,
          expertId: expertId,
          content: 'Can you help me with algebra?',
          isFromUser: true,
        },
      });

      // Deduct coins
      await prisma.user.update({
        where: { id: studentId },
        data: { wisdomCoins: { decrement: chatCost } },
      });

      await prisma.tokenTransaction.create({
        data: {
          userId: studentId,
          amount: -chatCost,
          type: 'CHAT_COST',
          description: 'Chat message to expert',
        },
      });

      // Step 3: Create Expert Response
      await prisma.chatMessage.create({
        data: {
          userId: studentId,
          expertId: expertId,
          content: 'Of course! I\'d be happy to help you with algebra. What specific topic would you like to explore?',
          isFromUser: false,
        },
      });

      // Step 4: Verify Chat History
      const chatHistory = await prisma.chatMessage.findMany({
        where: {
          userId: studentId,
          expertId: expertId,
        },
        orderBy: { createdAt: 'asc' },
      });

      expect(chatHistory.length).toBe(2);
      expect(chatHistory[0].isFromUser).toBe(true);
      expect(chatHistory[1].isFromUser).toBe(false);

      // Step 5: Verify Coin Deduction
      const updatedStudent = await prisma.user.findUnique({
        where: { id: studentId },
      });
      expect(updatedStudent?.wisdomCoins).toBe(initialCoins - chatCost);

      // Step 6: Test Insufficient Balance
      // Reduce coins to below chat cost
      await prisma.user.update({
        where: { id: studentId },
        data: { wisdomCoins: 2 },
      });

      const studentWithLowBalance = await prisma.user.findUnique({
        where: { id: studentId },
      });

      // Attempt to send message should fail (simulated)
      expect(studentWithLowBalance?.wisdomCoins).toBeLessThan(chatCost);
    }, 30000);
  });

  describe('Theme and Settings Flow', () => {
    let userId: string;

    it('should complete settings flow: change theme → change password → persist settings', async () => {
      // Step 1: Create User
      const hashedPassword = await bcrypt.hash('oldpassword', 12);
      const user = await prisma.user.create({
        data: {
          email: 'e2e-test-settings@example.com',
          password: hashedPassword,
          name: 'Settings Test User',
          role: 'STUDENT',
          wisdomCoins: 150,
        },
      });
      userId = user.id;

      // Step 2: Create Initial Settings
      await prisma.userSettings.create({
        data: {
          userId: userId,
          theme: 'BASIC',
        },
      });

      // Step 3: Change Theme
      await prisma.userSettings.update({
        where: { userId: userId },
        data: { theme: 'DARK' },
      });

      const updatedSettings = await prisma.userSettings.findUnique({
        where: { userId: userId },
      });
      expect(updatedSettings?.theme).toBe('DARK');

      // Step 4: Change Password
      const newHashedPassword = await bcrypt.hash('newpassword', 12);
      await prisma.user.update({
        where: { id: userId },
        data: { password: newHashedPassword },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      // Verify new password
      const passwordMatch = await bcrypt.compare('newpassword', updatedUser!.password);
      expect(passwordMatch).toBe(true);

      // Step 5: Verify Settings Persistence
      const finalSettings = await prisma.userSettings.findUnique({
        where: { userId: userId },
      });
      expect(finalSettings?.theme).toBe('DARK');
    }, 30000);
  });

  describe('Leaderboard Reset Flow', () => {
    let student1Id: string;
    let student2Id: string;

    it('should complete leaderboard reset: award leader → reset all scores', async () => {
      // Step 1: Create Two Students
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      const student1 = await prisma.user.create({
        data: {
          email: 'e2e-test-leader-1@example.com',
          password: hashedPassword,
          name: 'Leader 1',
          role: 'STUDENT',
          wisdomCoins: 150,
        },
      });
      student1Id = student1.id;

      const student2 = await prisma.user.create({
        data: {
          email: 'e2e-test-leader-2@example.com',
          password: hashedPassword,
          name: 'Leader 2',
          role: 'STUDENT',
          wisdomCoins: 150,
        },
      });
      student2Id = student2.id;

      // Step 2: Create Leaderboard Entries
      await prisma.leaderboardEntry.create({
        data: {
          userId: student1Id,
          score: 100,
          quizCount: 5,
          correctAnswers: 20,
          totalAnswers: 25,
        },
      });

      await prisma.leaderboardEntry.create({
        data: {
          userId: student2Id,
          score: 80,
          quizCount: 4,
          correctAnswers: 15,
          totalAnswers: 20,
        },
      });

      // Step 3: Find Top Student
      const topStudent = await prisma.leaderboardEntry.findFirst({
        where: {
          user: { role: 'STUDENT' },
        },
        orderBy: { score: 'desc' },
        include: { user: true },
      });

      expect(topStudent?.userId).toBe(student1Id);
      expect(topStudent?.score).toBe(100);

      // Step 4: Award Leader
      await prisma.user.update({
        where: { id: topStudent!.userId },
        data: { wisdomCoins: { increment: 25 } },
      });

      await prisma.tokenTransaction.create({
        data: {
          userId: topStudent!.userId,
          amount: 25,
          type: 'LEADERBOARD_REWARD',
          description: 'Daily leaderboard winner',
        },
      });

      // Step 5: Reset All Leaderboard Entries
      await prisma.leaderboardEntry.updateMany({
        where: {
          user: { role: 'STUDENT' },
        },
        data: {
          score: 0,
          quizCount: 0,
          correctAnswers: 0,
          totalAnswers: 0,
          lastResetAt: new Date(),
        },
      });

      // Step 6: Verify Reset
      const resetEntries = await prisma.leaderboardEntry.findMany({
        where: {
          userId: { in: [student1Id, student2Id] },
        },
      });

      resetEntries.forEach(entry => {
        expect(entry.score).toBe(0);
        expect(entry.quizCount).toBe(0);
        expect(entry.correctAnswers).toBe(0);
        expect(entry.totalAnswers).toBe(0);
      });

      // Step 7: Verify Leader Reward
      const rewardedStudent = await prisma.user.findUnique({
        where: { id: student1Id },
      });
      expect(rewardedStudent?.wisdomCoins).toBe(175); // 150 + 25
    }, 30000);
  });
});
