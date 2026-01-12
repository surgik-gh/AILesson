/**
 * @jest-environment node
 */

// Set DATABASE_URL before importing anything that uses Prisma
process.env.DATABASE_URL = process.env.DATABASE_URL || "prisma+postgres://localhost:51213/?api_key=eyJkYXRhYmFzZVVybCI6InBvc3RncmVzOi8vcG9zdGdyZXM6cG9zdGdyZXNAbG9jYWxob3N0OjUxMjE0L3RlbXBsYXRlMT9zc2xtb2RlPWRpc2FibGUmY29ubmVjdGlvbl9saW1pdD0xJmNvbm5lY3RfdGltZW91dD0wJm1heF9pZGxlX2Nvbm5lY3Rpb25fbGlmZXRpbWU9MCZwb29sX3RpbWVvdXQ9MCZzaW5nbGVfdXNlX2Nvbm5lY3Rpb25zPXRydWUmc29ja2V0X3RpbWVvdXQ9MCIsIm5hbWUiOiJkZWZhdWx0Iiwic2hhZG93RGF0YWJhc2VVcmwiOiJwb3N0Z3JlczovL3Bvc3RncmVzOnBvc3RncmVzQGxvY2FsaG9zdDo1MTIxNS90ZW1wbGF0ZTE_c3NsbW9kZT1kaXNhYmxlJmNvbm5lY3Rpb25fbGltaXQ9MSZjb25uZWN0X3RpbWVvdXQ9MCZtYXhfaWRsZV9jb25uZWN0aW9uX2xpZmV0aW1lPTAmcG9vbF90aW1lb3V0PTAmc2luZ2xlX3VzZV9jb25uZWN0aW9ucz10cnVlJnNvY2tldF90aW1lb3V0PTAifQ";

import { registerUser } from "@/app/actions/auth";
import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";

describe("Authentication - Edge Cases", () => {
  // Clean up test users after each test
  afterEach(async () => {
    await prisma.tokenTransaction.deleteMany({
      where: {
        user: {
          email: {
            contains: "@edge-test-",
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "@edge-test-",
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Invalid credentials rejection", () => {
    test("should reject registration with missing email", async () => {
      const result = await registerUser({
        email: "",
        password: "password123",
        name: "Test User",
        role: Role.STUDENT,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("All fields are required");
    });

    test("should reject registration with missing password", async () => {
      const result = await registerUser({
        email: "test@edge-test-example.com",
        password: "",
        name: "Test User",
        role: Role.STUDENT,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("All fields are required");
    });

    test("should reject registration with missing name", async () => {
      const result = await registerUser({
        email: "test@edge-test-example.com",
        password: "password123",
        name: "",
        role: Role.STUDENT,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("All fields are required");
    });

    test("should reject duplicate email registration", async () => {
      const userData = {
        email: "duplicate@edge-test-example.com",
        password: "password123",
        name: "Test User",
        role: Role.STUDENT,
      };

      // First registration should succeed
      const firstResult = await registerUser(userData);
      expect(firstResult.success).toBe(true);

      // Second registration with same email should fail
      const secondResult = await registerUser(userData);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toBe("User with this email already exists");
    });
  });

  describe("Password strength requirements", () => {
    test("should reject password shorter than 8 characters", async () => {
      const result = await registerUser({
        email: "short@edge-test-example.com",
        password: "pass123",
        name: "Test User",
        role: Role.STUDENT,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Password must be at least 8 characters long");
    });

    test("should accept password with exactly 8 characters", async () => {
      const result = await registerUser({
        email: "exact8@edge-test-example.com",
        password: "pass1234",
        name: "Test User",
        role: Role.STUDENT,
      });

      expect(result.success).toBe(true);
    });

    test("should accept password longer than 8 characters", async () => {
      const result = await registerUser({
        email: "long@edge-test-example.com",
        password: "password123456",
        name: "Test User",
        role: Role.STUDENT,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Missing fields validation", () => {
    test("should reject when all fields are empty", async () => {
      const result = await registerUser({
        email: "",
        password: "",
        name: "",
        role: Role.STUDENT,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("All fields are required");
    });
  });
});
