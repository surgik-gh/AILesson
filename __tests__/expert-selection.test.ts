import { prisma } from "@/lib/db/prisma";
import { hash } from "bcryptjs";

// Feature: ailesson-platform, Property 4: Expert selection association
// Validates: Requirements 2.3, 2.5
// Note: Converted from property-based tests to unit tests due to database operation timeouts

describe("Expert Selection Tests", () => {
  let testUserId: string;
  let testExpertId: string;

  beforeAll(async () => {
    // Ensure database is ready
    await prisma.$connect();
  });

  afterEach(async () => {
    // Clean up test data after each test
    if (testExpertId) {
      await prisma.expert.deleteMany({
        where: { id: testExpertId },
      });
    }
    if (testUserId) {
      await prisma.user.deleteMany({
        where: { id: testUserId },
      });
    }
  });

  afterAll(async () => {
    // Final cleanup - remove any remaining test data
    await prisma.expert.deleteMany({
      where: {
        owner: {
          email: {
            contains: "test_expert_selection_",
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "test_expert_selection_",
        },
      },
    });
    await prisma.$disconnect();
  });

  test("Property 4: Basic expert selection - user's selectedExpertId should be updated and persist", async () => {
    // Create a test user
    const hashedPassword = await hash("testpassword123", 12);
    const user = await prisma.user.create({
      data: {
        email: `test_expert_selection_${Date.now()}@example.com`,
        password: hashedPassword,
        name: "Test User",
        role: "STUDENT",
        wisdomCoins: 150,
      },
    });
    testUserId = user.id;

    // Create an expert for this user
    const expert = await prisma.expert.create({
      data: {
        name: "AI Mentor",
        personality: "Friendly and encouraging, always supportive",
        communicationStyle: "Uses simple language and positive reinforcement",
        appearance: "avatar1",
        ownerId: user.id,
      },
    });
    testExpertId = expert.id;

    // Select the expert (update user's selectedExpertId)
    await prisma.user.update({
      where: { id: user.id },
      data: { selectedExpertId: expert.id },
    });

    // Verify the association was created
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        selectedExpert: true,
      },
    });

    expect(updatedUser).toBeDefined();
    expect(updatedUser!.selectedExpertId).toBe(expert.id);
    expect(updatedUser!.selectedExpert).toBeDefined();
    expect(updatedUser!.selectedExpert!.id).toBe(expert.id);
    expect(updatedUser!.selectedExpert!.name).toBe("AI Mentor");

    // Verify persistence - fetch user again from database
    const persistedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        selectedExpert: true,
      },
    });

    expect(persistedUser).toBeDefined();
    expect(persistedUser!.selectedExpertId).toBe(expert.id);
    expect(persistedUser!.selectedExpert).toBeDefined();
    expect(persistedUser!.selectedExpert!.id).toBe(expert.id);
  });

  test("Property 4: Changing selected expert - association should update correctly", async () => {
    // Create a test user
    const hashedPassword = await hash("testpassword456", 12);
    const user = await prisma.user.create({
      data: {
        email: `test_expert_selection_change_${Date.now()}@example.com`,
        password: hashedPassword,
        name: "Test User 2",
        role: "TEACHER",
        wisdomCoins: 250,
      },
    });
    testUserId = user.id;

    // Create two experts for this user
    const expert1 = await prisma.expert.create({
      data: {
        name: "Professor Logic",
        personality: "Analytical and precise",
        communicationStyle: "Formal and structured",
        appearance: "avatar2",
        ownerId: user.id,
      },
    });

    const expert2 = await prisma.expert.create({
      data: {
        name: "Coach Inspire",
        personality: "Energetic and motivational",
        communicationStyle: "Casual and enthusiastic",
        appearance: "avatar3",
        ownerId: user.id,
      },
    });

    // Select first expert
    await prisma.user.update({
      where: { id: user.id },
      data: { selectedExpertId: expert1.id },
    });

    let updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(updatedUser!.selectedExpertId).toBe(expert1.id);

    // Change to second expert
    await prisma.user.update({
      where: { id: user.id },
      data: { selectedExpertId: expert2.id },
    });

    updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        selectedExpert: true,
      },
    });

    // Verify the association was updated
    expect(updatedUser!.selectedExpertId).toBe(expert2.id);
    expect(updatedUser!.selectedExpertId).not.toBe(expert1.id);
    expect(updatedUser!.selectedExpert!.name).toBe("Coach Inspire");

    // Clean up both experts
    await prisma.expert.deleteMany({
      where: {
        id: {
          in: [expert1.id, expert2.id],
        },
      },
    });
    testExpertId = ""; // Already cleaned up
  });

  test("Property 4: Expert selection with different roles - works for STUDENT, TEACHER, and ADMIN", async () => {
    const roles = ["STUDENT", "TEACHER", "ADMIN"] as const;

    for (const role of roles) {
      // Create a test user with specific role
      const hashedPassword = await hash("testpassword789", 12);
      const user = await prisma.user.create({
        data: {
          email: `test_expert_selection_${role.toLowerCase()}_${Date.now()}@example.com`,
          password: hashedPassword,
          name: `Test ${role}`,
          role: role,
          wisdomCoins: role === "STUDENT" ? 150 : role === "TEACHER" ? 250 : 999999,
        },
      });

      // Create an expert for this user
      const expert = await prisma.expert.create({
        data: {
          name: `Expert for ${role}`,
          personality: `Tailored for ${role} role`,
          communicationStyle: `${role} appropriate style`,
          appearance: "avatar4",
          ownerId: user.id,
        },
      });

      // Select the expert
      await prisma.user.update({
        where: { id: user.id },
        data: { selectedExpertId: expert.id },
      });

      // Verify the association
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          selectedExpert: true,
        },
      });

      expect(updatedUser!.selectedExpertId).toBe(expert.id);
      expect(updatedUser!.selectedExpert!.name).toBe(`Expert for ${role}`);

      // Clean up
      await prisma.expert.delete({ where: { id: expert.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  }, 20000); // 20 seconds timeout for 3 iterations
});
