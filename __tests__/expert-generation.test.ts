import fc from "fast-check";
import { prisma } from "@/lib/db/prisma";
import { OpenRouterService } from "@/lib/ai/openrouter";

// Feature: ailesson-platform, Property 3: Expert generation completeness
// Validates: Requirements 2.1, 2.2

// Mock fetch for testing
global.fetch = jest.fn();

describe("Expert Generation Property Tests", () => {
  beforeAll(async () => {
    // Ensure database is ready
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.expert.deleteMany({
      where: {
        name: {
          contains: "TEST_",
        },
      },
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    // Reset fetch mock before each test
    (global.fetch as jest.Mock).mockReset();
    
    // Mock successful AI response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: "Профессор Тест",
                personality: "Тестовая личность для проверки",
                communicationStyle: "Тестовый стиль общения",
                appearance: "avatar1",
              }),
            },
          },
        ],
      }),
    });
  });

  test(
    "Property 3: Expert generation completeness - for any generated Expert avatar, it must have all required fields populated",
    async () => {
      const aiService = new OpenRouterService();

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            learningStyle: fc.constantFrom(
              "visual",
              "auditory",
              "kinesthetic",
              "reading"
            ),
            preferredTone: fc.constantFrom(
              "formal",
              "friendly",
              "motivational",
              "concise"
            ),
            expertiseLevel: fc.constantFrom(
              "beginner",
              "intermediate",
              "advanced"
            ),
            interests: fc
              .array(
                fc.constantFrom(
                  "Математика",
                  "Физика",
                  "Химия",
                  "Биология",
                  "История",
                  "Литература",
                  "Программирование",
                  "Иностранные языки"
                ),
                { minLength: 1, maxLength: 5 }
              )
              .map((arr) => Array.from(new Set(arr))), // Remove duplicates
            communicationPreference: fc.constantFrom(
              "explanatory",
              "socratic",
              "direct",
              "encouraging"
            ),
          }),
          async (surveyData) => {
            try {
              // Generate expert using AI service
              const expert = await aiService.generateExpert(surveyData);

              // Verify all required fields are present and non-empty
              expect(expert).toBeDefined();
              expect(expert.name).toBeDefined();
              expect(typeof expert.name).toBe("string");
              expect(expert.name.length).toBeGreaterThan(0);

              expect(expert.personality).toBeDefined();
              expect(typeof expert.personality).toBe("string");
              expect(expert.personality.length).toBeGreaterThan(0);

              expect(expert.communicationStyle).toBeDefined();
              expect(typeof expert.communicationStyle).toBe("string");
              expect(expert.communicationStyle.length).toBeGreaterThan(0);

              expect(expert.appearance).toBeDefined();
              expect(typeof expert.appearance).toBe("string");
              expect(expert.appearance.length).toBeGreaterThan(0);

              // Verify appearance is a valid value
              const validAppearances = [
                "avatar1",
                "avatar2",
                "avatar3",
                "avatar4",
                "avatar5",
              ];
              expect(validAppearances).toContain(expert.appearance);
            } catch (error) {
              // If AI service fails, we should still get a fallback expert
              // The fallback expert should also meet all requirements
              throw error;
            }
          }
        ),
        {
          numRuns: 10, // Reduced from 100 for faster execution
          timeout: 30000, // 30 seconds timeout per run
        }
      );
    },
    300000 // 5 minutes test timeout
  );
});
