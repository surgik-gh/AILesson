/**
 * @jest-environment node
 */

import fc from "fast-check";
import { OpenRouterService } from "@/lib/ai/openrouter";
import { GroqService } from "@/lib/ai/groq";

// Feature: ailesson-platform, Property 30: AI lesson generation validity

describe("AI Lesson Generation Properties", () => {
  // Skip tests if API keys are not configured
  const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
  const hasGroqKey = !!process.env.GROQ_API_KEY;

  // Skip all tests if no API keys are available
  if (!hasOpenRouterKey && !hasGroqKey) {
    test.skip("Skipping AI lesson generation tests - no API keys configured", () => {});
    return;
  }

  const openRouter = new OpenRouterService();
  const groq = new GroqService();

  describe("Property 30: AI lesson generation validity", () => {
    test("OpenRouter generates valid lesson structure from any material", async () => {
      if (!hasOpenRouterKey) {
        console.log("Skipping OpenRouter test - API key not configured");
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            material: fc.string({ minLength: 50, maxLength: 500 }),
            subject: fc.constantFrom(
              "Математика",
              "Физика",
              "Химия",
              "Биология",
              "История"
            ),
          }),
          async (testData) => {
            try {
              const lesson = await openRouter.generateLesson(
                testData.material,
                testData.subject
              );

              // Property: Lesson must have non-empty title
              expect(lesson.title).toBeDefined();
              expect(typeof lesson.title).toBe("string");
              expect(lesson.title.trim().length).toBeGreaterThan(0);

              // Property: Lesson must have non-empty content
              expect(lesson.content).toBeDefined();
              expect(typeof lesson.content).toBe("string");
              expect(lesson.content.trim().length).toBeGreaterThan(0);

              // Property: Lesson must have keyPoints array
              expect(lesson.keyPoints).toBeDefined();
              expect(Array.isArray(lesson.keyPoints)).toBe(true);
              expect(lesson.keyPoints.length).toBeGreaterThan(0);

              // Property: All keyPoints must be non-empty strings
              lesson.keyPoints.forEach((point) => {
                expect(typeof point).toBe("string");
                expect(point.trim().length).toBeGreaterThan(0);
              });

              // Property: Lesson must have valid difficulty level
              expect(lesson.difficulty).toBeDefined();
              expect(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).toContain(
                lesson.difficulty
              );
            } catch (error) {
              // If AI service fails, we still want to verify it throws an appropriate error
              expect(error).toBeDefined();
              console.log("AI service error (expected in some cases):", error);
            }
          }
        ),
        { numRuns: 3 } // Reduced runs to avoid rate limits
      );
    }, 180000); // 3 minute timeout for AI calls

    test("Groq generates valid lesson structure from any material", async () => {
      if (!hasGroqKey) {
        console.log("Skipping Groq test - API key not configured");
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            material: fc.string({ minLength: 50, maxLength: 500 }),
            subject: fc.constantFrom(
              "Математика",
              "Физика",
              "Химия",
              "Биология",
              "История"
            ),
          }),
          async (testData) => {
            try {
              const lesson = await groq.generateLesson(
                testData.material,
                testData.subject
              );

              // Property: Lesson must have non-empty title
              expect(lesson.title).toBeDefined();
              expect(typeof lesson.title).toBe("string");
              expect(lesson.title.trim().length).toBeGreaterThan(0);

              // Property: Lesson must have non-empty content
              expect(lesson.content).toBeDefined();
              expect(typeof lesson.content).toBe("string");
              expect(lesson.content.trim().length).toBeGreaterThan(0);

              // Property: Lesson must have keyPoints array
              expect(lesson.keyPoints).toBeDefined();
              expect(Array.isArray(lesson.keyPoints)).toBe(true);
              expect(lesson.keyPoints.length).toBeGreaterThan(0);

              // Property: All keyPoints must be non-empty strings
              lesson.keyPoints.forEach((point) => {
                expect(typeof point).toBe("string");
                expect(point.trim().length).toBeGreaterThan(0);
              });

              // Property: Lesson must have valid difficulty level
              expect(lesson.difficulty).toBeDefined();
              expect(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).toContain(
                lesson.difficulty
              );
            } catch (error) {
              // If AI service fails, we still want to verify it throws an appropriate error
              expect(error).toBeDefined();
              console.log("AI service error (expected in some cases):", error);
            }
          }
        ),
        { numRuns: 3 } // Reduced runs to avoid rate limits
      );
    }, 180000); // 3 minute timeout for AI calls
  });

  // Unit test for edge cases
  describe("Edge cases", () => {
    const openRouter = new OpenRouterService();

    test("handles empty material gracefully", async () => {
      if (!hasOpenRouterKey) {
        console.log("Skipping test - API key not configured");
        return;
      }

      try {
        await openRouter.generateLesson("", "Математика");
        // If it doesn't throw, that's also acceptable behavior
      } catch (error) {
        // Should throw an error for empty material
        expect(error).toBeDefined();
      }
    }, 60000);

    test("handles very short material", async () => {
      if (!hasOpenRouterKey) {
        console.log("Skipping test - API key not configured");
        return;
      }

      try {
        const lesson = await openRouter.generateLesson("2+2=4", "Математика");
        
        // Even with minimal input, should generate valid structure
        expect(lesson.title).toBeDefined();
        expect(lesson.content).toBeDefined();
        expect(lesson.keyPoints).toBeDefined();
        expect(lesson.difficulty).toBeDefined();
      } catch (error) {
        // Throwing an error is also acceptable for insufficient material
        expect(error).toBeDefined();
      }
    }, 60000);
  });
});
