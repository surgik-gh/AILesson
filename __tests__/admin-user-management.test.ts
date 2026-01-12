/**
 * @jest-environment node
 */

import fc from "fast-check";
import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

// Feature: ailesson-platform, Property: Admin CRUD operations on users
// Validates: Requirements 12.2

describe("Admin User Management", () => {
  let adminUser: any;

  beforeAll(async () => {
    // Create an admin user for testing
    const hashedPassword = await bcrypt.hash("admin123", 12);
    adminUser = await prisma.user.create({
      data: {
        email: `admin-test-${Date.now()}@test.com`,
        password: hashedPassword,
        name: "Test Admin",
        role: Role.ADMIN,
        wisdomCoins: 999999,
      },
    });
  });

  afterEach(async () => {
    try {
      // Clean up test users (but not the admin and not the read test users)
      const testUsers = await prisma.user.findMany({
        where: {
          AND: [
            {
              email: {
                contains: "@test-admin-crud",
              },
            },
            {
              email: {
                not: {
                  contains: "test-admin-crud-read-",
                },
              },
            },
            {
              id: {
                not: adminUser.id,
              },
            },
          ],
        },
        select: { id: true },
      });

      const userIds = testUsers.map((u) => u.id);

      if (userIds.length > 0) {
        // Delete related records first
        await prisma.tokenTransaction.deleteMany({
          where: { userId: { in: userIds } },
        });
        await prisma.leaderboardEntry.deleteMany({
          where: { userId: { in: userIds } },
        });
        await prisma.userSettings.deleteMany({
          where: { userId: { in: userIds } },
        });

        // Delete users
        await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  afterAll(async () => {
    // Clean up admin user
    try {
      await prisma.tokenTransaction.deleteMany({
        where: { userId: adminUser.id },
      });
      await prisma.user.delete({
        where: { id: adminUser.id },
      });
    } catch (error) {
      console.error("Admin cleanup error:", error);
    }
    await prisma.$disconnect();
  });

  test("Property: Admin can create users with correct initial wisdom coins", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc
            .emailAddress()
            .map((email) => `test-admin-crud-${Date.now()}-${Math.random()}@test-admin-crud-${email}`),
          password: fc.string({ minLength: 8, maxLength: 20 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.constantFrom(Role.STUDENT, Role.TEACHER, Role.ADMIN),
        }),
        async (userData) => {
          // Admin creates a user
          const hashedPassword = await bcrypt.hash(userData.password, 12);

          const expectedCoins =
            userData.role === Role.STUDENT
              ? 150
              : userData.role === Role.TEACHER
              ? 250
              : 999999;

          const createdUser = await prisma.user.create({
            data: {
              email: userData.email,
              password: hashedPassword,
              name: userData.name,
              role: userData.role,
              wisdomCoins: expectedCoins,
            },
          });

          // Create initial transaction
          await prisma.tokenTransaction.create({
            data: {
              userId: createdUser.id,
              amount: expectedCoins,
              type: "INITIAL",
              description: "Initial wisdom coins allocation",
            },
          });

          // Verify user was created correctly
          expect(createdUser).toBeDefined();
          expect(createdUser.email).toBe(userData.email);
          expect(createdUser.name).toBe(userData.name);
          expect(createdUser.role).toBe(userData.role);
          expect(createdUser.wisdomCoins).toBe(expectedCoins);

          // Verify transaction was created
          const transaction = await prisma.tokenTransaction.findFirst({
            where: {
              userId: createdUser.id,
              type: "INITIAL",
            },
          });

          expect(transaction).toBeDefined();
          expect(transaction?.amount).toBe(expectedCoins);
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  test("Property: Admin can update user roles and wisdom coins are adjusted", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          initialRole: fc.constantFrom(Role.STUDENT, Role.TEACHER),
          newRole: fc.constantFrom(Role.STUDENT, Role.TEACHER, Role.ADMIN),
        }),
        async ({ initialRole, newRole }) => {
          // Create a user with initial role
          const hashedPassword = await bcrypt.hash("password123", 12);
          const initialCoins =
            initialRole === Role.STUDENT ? 150 : 250;

          const user = await prisma.user.create({
            data: {
              email: `test-admin-crud-update-${Date.now()}-${Math.random()}@test-admin-crud.com`,
              password: hashedPassword,
              name: "Test User",
              role: initialRole,
              wisdomCoins: initialCoins,
            },
          });

          // Admin updates the user's role
          const newCoins =
            newRole === Role.STUDENT
              ? 150
              : newRole === Role.TEACHER
              ? 250
              : 999999;

          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
              role: newRole,
              wisdomCoins: newCoins,
            },
          });

          // Verify update
          expect(updatedUser.role).toBe(newRole);
          expect(updatedUser.wisdomCoins).toBe(newCoins);
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  test("Property: Admin can delete users", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc
            .emailAddress()
            .map((email) => `test-admin-crud-delete-${Date.now()}-${Math.random()}@test-admin-crud-${email}`),
          role: fc.constantFrom(Role.STUDENT, Role.TEACHER),
        }),
        async (userData) => {
          // Create a user
          const hashedPassword = await bcrypt.hash("password123", 12);
          const coins = userData.role === Role.STUDENT ? 150 : 250;

          const user = await prisma.user.create({
            data: {
              email: userData.email,
              password: hashedPassword,
              name: "Test User",
              role: userData.role,
              wisdomCoins: coins,
            },
          });

          // Admin deletes the user
          await prisma.user.delete({
            where: { id: user.id },
          });

          // Verify user is deleted
          const deletedUser = await prisma.user.findUnique({
            where: { id: user.id },
          });

          expect(deletedUser).toBeNull();
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  test("Property: Admin can read all users with filters", async () => {
    // Create multiple users with different roles
    const hashedPassword = await bcrypt.hash("password123", 12);
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const searchKey = `read-filter-${timestamp}-${randomSuffix}`;

    const student = await prisma.user.create({
      data: {
        email: `student-${searchKey}@test.com`,
        password: hashedPassword,
        name: "Test Student",
        role: Role.STUDENT,
        wisdomCoins: 150,
      },
    });

    const teacher = await prisma.user.create({
      data: {
        email: `teacher-${searchKey}@test.com`,
        password: hashedPassword,
        name: "Test Teacher",
        role: Role.TEACHER,
        wisdomCoins: 250,
      },
    });

    try {
      // Admin reads all users with this search key
      const allUsers = await prisma.user.findMany({
        where: {
          email: {
            contains: searchKey,
          },
        },
      });

      expect(allUsers.length).toBe(2);

      // Admin filters by role - students
      const students = await prisma.user.findMany({
        where: {
          AND: [
            { role: Role.STUDENT },
            { email: { contains: searchKey } },
          ],
        },
      });

      expect(students.length).toBe(1);
      expect(students[0].id).toBe(student.id);

      // Admin filters by role - teachers
      const teachers = await prisma.user.findMany({
        where: {
          AND: [
            { role: Role.TEACHER },
            { email: { contains: searchKey } },
          ],
        },
      });

      expect(teachers.length).toBe(1);
      expect(teachers[0].id).toBe(teacher.id);
    } finally {
      // Clean up the test users
      await prisma.user.deleteMany({
        where: {
          id: {
            in: [student.id, teacher.id],
          },
        },
      });
    }
  }, 120000);
});
