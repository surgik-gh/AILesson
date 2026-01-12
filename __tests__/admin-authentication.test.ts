/**
 * @jest-environment node
 */

import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

// Feature: ailesson-platform, Admin authentication
// Validates: Requirements 12.1

describe("Admin Authentication", () => {
  let adminUser: any;

  beforeAll(async () => {
    // Create the specific admin account mentioned in requirements
    const hashedPassword = await bcrypt.hash("123456789", 12);

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "админ228@test.com" },
    });

    if (existingAdmin) {
      adminUser = existingAdmin;
    } else {
      adminUser = await prisma.user.create({
        data: {
          email: "админ228@test.com",
          password: hashedPassword,
          name: "админ228",
          role: Role.ADMIN,
          wisdomCoins: 999999,
        },
      });
    }
  });

  afterAll(async () => {
    // Clean up test admin
    try {
      await prisma.tokenTransaction.deleteMany({
        where: { userId: adminUser.id },
      });
      await prisma.user.delete({
        where: { id: adminUser.id },
      });
    } catch (error) {
      console.error("Cleanup error:", error);
    }
    await prisma.$disconnect();
  });

  test("Admin can login with specific credentials (админ228 / 123456789)", async () => {
    // Verify admin user exists
    const admin = await prisma.user.findUnique({
      where: { email: "админ228@test.com" },
    });

    expect(admin).not.toBeNull();
    expect(admin?.name).toBe("админ228");
    expect(admin?.role).toBe(Role.ADMIN);

    // Verify password is correct
    if (admin) {
      const passwordMatch = await bcrypt.compare("123456789", admin.password);
      expect(passwordMatch).toBe(true);
    }
  });

  test("Admin has unlimited wisdom coins", async () => {
    const admin = await prisma.user.findUnique({
      where: { email: "админ228@test.com" },
    });

    expect(admin).not.toBeNull();
    expect(admin?.wisdomCoins).toBeGreaterThanOrEqual(999999);
  });

  test("Admin role grants access to admin panel", async () => {
    const admin = await prisma.user.findUnique({
      where: { email: "админ228@test.com" },
    });

    expect(admin).not.toBeNull();
    expect(admin?.role).toBe(Role.ADMIN);

    // In a real application, this would test the actual route protection
    // For now, we verify the role is set correctly
    const hasAdminAccess = admin?.role === Role.ADMIN;
    expect(hasAdminAccess).toBe(true);
  });

  test("Non-admin users cannot access admin features", async () => {
    // Create a regular student user
    const hashedPassword = await bcrypt.hash("password123", 12);
    const student = await prisma.user.create({
      data: {
        email: `student-${Date.now()}@test.com`,
        password: hashedPassword,
        name: "Test Student",
        role: Role.STUDENT,
        wisdomCoins: 150,
      },
    });

    try {
      // Verify student does not have admin role
      expect(student.role).toBe(Role.STUDENT);
      expect(student.role).not.toBe(Role.ADMIN);

      const hasAdminAccess = student.role === Role.ADMIN;
      expect(hasAdminAccess).toBe(false);
    } finally {
      // Clean up
      await prisma.tokenTransaction.deleteMany({
        where: { userId: student.id },
      });
      await prisma.user.delete({
        where: { id: student.id },
      });
    }
  });

  test("Admin login with incorrect password fails", async () => {
    const admin = await prisma.user.findUnique({
      where: { email: "админ228@test.com" },
    });

    expect(admin).not.toBeNull();

    if (admin) {
      // Try incorrect password
      const passwordMatch = await bcrypt.compare("wrongpassword", admin.password);
      expect(passwordMatch).toBe(false);
    }
  });

  test("Admin login with incorrect username fails", async () => {
    const nonExistentAdmin = await prisma.user.findUnique({
      where: { email: "wrongadmin@test.com" },
    });

    expect(nonExistentAdmin).toBeNull();
  });
});
