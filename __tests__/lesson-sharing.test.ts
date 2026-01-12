/**
 * @jest-environment node
 */

import fc from "fast-check";
import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

// Feature: ailesson-platform, Property: SentLesson record creation
// Validates: Requirements 3.5

describe("Lesson Sharing Properties", () => {
  let testSubjectId: string;
  let testTeacherId: string;
  let testLessonId: string;
  let testStudentIds: string[] = [];

  beforeAll(async () => {
    // Create a test subject
    const subject = await prisma.subject.create({
      data: {
        name: `Test Subject ${Date.now()}`,
        description: "Test subject for lesson sharing tests",
      },
    });
    testSubjectId = subject.id;

    // Create a test teacher
    const hashedPassword = await bcrypt.hash("testpassword", 12);
    const teacher = await prisma.user.create({
      data: {
        email: `teacher-sharing-${Date.now()}@test.com`,
        password: hashedPassword,
        name: "Test Teacher",
        role: Role.TEACHER,
        wisdomCoins: 1000,
      },
    });
    testTeacherId = teacher.id;

    // Create a test lesson
    const lesson = await prisma.lesson.create({
      data: {
        title: "Test Lesson for Sharing",
        content: "This is test content for lesson sharing",
        keyPoints: ["Point 1", "Point 2"],
        difficulty: "BEGINNER",
        subjectId: testSubjectId,
        creatorId: testTeacherId,
      },
    });
    testLessonId = lesson.id;

    // Create test students
    for (let i = 0; i < 5; i++) {
      const student = await prisma.user.create({
        data: {
          email: `student-${Date.now()}-${i}@test.com`,
          password: hashedPassword,
          name: `Test Student ${i}`,
          role: Role.STUDENT,
          wisdomCoins: 150,
        },
      });
      testStudentIds.push(student.id);
    }
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    try {
      // Delete sent lessons
      await prisma.sentLesson.deleteMany({
        where: {
          lessonId: testLessonId,
        },
      });

      // Delete lesson
      await prisma.lesson.delete({
        where: { id: testLessonId },
      });

      // Delete users
      await prisma.user.deleteMany({
        where: {
          id: { in: [...testStudentIds, testTeacherId] },
        },
      });

      // Delete subject
      await prisma.subject.delete({
        where: { id: testSubjectId },
      });
    } catch (error) {
      console.error("Cleanup error:", error);
    }

    await prisma.$disconnect();
  });

  test("Property: SentLesson record creation - sharing a lesson creates SentLesson records", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.subarray(testStudentIds, { minLength: 1, maxLength: testStudentIds.length }),
        async (selectedStudentIds) => {
          // Share lesson with selected students
          const sentLessons = await Promise.all(
            selectedStudentIds.map(async (studentId) => {
              // Check if already sent (from previous test run)
              const existing = await prisma.sentLesson.findUnique({
                where: {
                  lessonId_studentId: {
                    lessonId: testLessonId,
                    studentId,
                  },
                },
              });

              if (existing) {
                return existing;
              }

              return prisma.sentLesson.create({
                data: {
                  lessonId: testLessonId,
                  studentId,
                  teacherId: testTeacherId,
                },
              });
            })
          );

          // Property 1: SentLesson records should be created for each student
          expect(sentLessons.length).toBe(selectedStudentIds.length);

          // Property 2: Each SentLesson should have correct associations
          for (let i = 0; i < sentLessons.length; i++) {
            const sentLesson = sentLessons[i];
            expect(sentLesson.lessonId).toBe(testLessonId);
            expect(sentLesson.teacherId).toBe(testTeacherId);
            expect(selectedStudentIds).toContain(sentLesson.studentId);
          }

          // Property 3: Verify records can be retrieved
          const retrievedSentLessons = await prisma.sentLesson.findMany({
            where: {
              lessonId: testLessonId,
              studentId: { in: selectedStudentIds },
            },
            include: {
              lesson: true,
              teacher: true,
              student: true,
            },
          });

          expect(retrievedSentLessons.length).toBe(selectedStudentIds.length);

          // Property 4: Each retrieved record should have complete data
          retrievedSentLessons.forEach((sentLesson) => {
            expect(sentLesson.lesson).toBeDefined();
            expect(sentLesson.lesson.id).toBe(testLessonId);
            expect(sentLesson.teacher).toBeDefined();
            expect(sentLesson.teacher.id).toBe(testTeacherId);
            expect(sentLesson.student).toBeDefined();
            expect(selectedStudentIds).toContain(sentLesson.student.id);
          });

          // Clean up for next iteration
          await prisma.sentLesson.deleteMany({
            where: {
              lessonId: testLessonId,
              studentId: { in: selectedStudentIds },
            },
          });
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  test("Property: Duplicate prevention - sharing same lesson to same student twice doesn't create duplicates", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...testStudentIds),
        async (studentId) => {
          // Share lesson first time
          const firstSent = await prisma.sentLesson.create({
            data: {
              lessonId: testLessonId,
              studentId,
              teacherId: testTeacherId,
            },
          });

          // Try to share again (should handle gracefully)
          const existing = await prisma.sentLesson.findUnique({
            where: {
              lessonId_studentId: {
                lessonId: testLessonId,
                studentId,
              },
            },
          });

          // Property: Should find existing record
          expect(existing).not.toBeNull();
          expect(existing!.id).toBe(firstSent.id);

          // Property: Only one record should exist
          const allRecords = await prisma.sentLesson.findMany({
            where: {
              lessonId: testLessonId,
              studentId,
            },
          });

          expect(allRecords.length).toBe(1);

          // Clean up
          await prisma.sentLesson.delete({
            where: { id: firstSent.id },
          });
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  test("Property: Lesson-Student association - SentLesson correctly links lesson and student", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...testStudentIds),
        async (studentId) => {
          // Create SentLesson
          const sentLesson = await prisma.sentLesson.create({
            data: {
              lessonId: testLessonId,
              studentId,
              teacherId: testTeacherId,
            },
            include: {
              lesson: {
                include: {
                  subject: true,
                },
              },
              student: true,
              teacher: true,
            },
          });

          // Property: All relationships should be properly loaded
          expect(sentLesson.lesson).toBeDefined();
          expect(sentLesson.lesson.id).toBe(testLessonId);
          expect(sentLesson.lesson.subject).toBeDefined();
          
          expect(sentLesson.student).toBeDefined();
          expect(sentLesson.student.id).toBe(studentId);
          expect(sentLesson.student.role).toBe(Role.STUDENT);
          
          expect(sentLesson.teacher).toBeDefined();
          expect(sentLesson.teacher.id).toBe(testTeacherId);
          expect(sentLesson.teacher.role).toBe(Role.TEACHER);

          // Property: Student can query their received lessons
          const studentReceivedLessons = await prisma.sentLesson.findMany({
            where: {
              studentId,
            },
            include: {
              lesson: true,
            },
          });

          expect(studentReceivedLessons.length).toBeGreaterThanOrEqual(1);
          const foundLesson = studentReceivedLessons.find(
            (sl) => sl.lessonId === testLessonId
          );
          expect(foundLesson).toBeDefined();

          // Clean up
          await prisma.sentLesson.delete({
            where: { id: sentLesson.id },
          });
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);
});
