/**
 * Unit Tests for Quiz Generation Edge Cases
 * Feature: ailesson-platform
 * 
 * Tests edge cases for quiz generation:
 * - Empty lesson content
 * - Malformed AI responses
 * - Question validation
 * 
 * Validates: Requirements 4.1, 4.2, 4.3
 */

import { OpenRouterService } from '@/lib/ai/openrouter';
import { GroqService } from '@/lib/ai/groq';

// Mock fetch globally
global.fetch = jest.fn();

describe('Quiz Generation Edge Cases - Unit Tests', () => {
  let openRouterService: OpenRouterService;
  let groqService: GroqService;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.GROQ_API_KEY = 'test-key';
    
    openRouterService = new OpenRouterService();
    groqService = new GroqService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Empty lesson content handling', () => {
    test('should handle empty lesson content gracefully', async () => {
      // Mock AI response with minimal valid quiz
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: [
                    {
                      type: 'TEXT',
                      text: 'Что вы узнали из урока?',
                      correctAnswer: 'Общие знания',
                      order: 1,
                    },
                    {
                      type: 'SINGLE',
                      text: 'Выберите правильный ответ',
                      correctAnswer: 'Вариант 1',
                      options: ['Вариант 1', 'Вариант 2', 'Вариант 3', 'Вариант 4'],
                      order: 2,
                    },
                    {
                      type: 'MULTIPLE',
                      text: 'Выберите все правильные ответы',
                      correctAnswer: ['Вариант 1', 'Вариант 2'],
                      options: ['Вариант 1', 'Вариант 2', 'Вариант 3', 'Вариант 4'],
                      order: 3,
                    },
                    {
                      type: 'TEXT',
                      text: 'Дополнительный вопрос',
                      correctAnswer: 'Ответ',
                      order: 4,
                    },
                    {
                      type: 'SINGLE',
                      text: 'Еще один вопрос',
                      correctAnswer: 'Ответ А',
                      options: ['Ответ А', 'Ответ Б', 'Ответ В'],
                      order: 5,
                    },
                  ],
                }),
              },
            },
          ],
        }),
      });

      const result = await openRouterService.generateQuiz('', 'Empty Lesson');

      expect(result).toBeDefined();
      expect(result.questions).toHaveLength(5);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('should handle very short lesson content', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: Array.from({ length: 5 }, (_, i) => ({
                    type: 'TEXT',
                    text: `Вопрос ${i + 1}`,
                    correctAnswer: `Ответ ${i + 1}`,
                    order: i + 1,
                  })),
                }),
              },
            },
          ],
        }),
      });

      const result = await openRouterService.generateQuiz('abc', 'Short Lesson');

      expect(result).toBeDefined();
      expect(result.questions.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Malformed AI response handling', () => {
    test('should handle response with markdown code blocks', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '```json\n' + JSON.stringify({
                  questions: Array.from({ length: 5 }, (_, i) => ({
                    type: 'TEXT',
                    text: `Вопрос ${i + 1}`,
                    correctAnswer: `Ответ ${i + 1}`,
                    order: i + 1,
                  })),
                }) + '\n```',
              },
            },
          ],
        }),
      });

      const result = await openRouterService.generateQuiz('Test content', 'Test Lesson');

      expect(result).toBeDefined();
      expect(result.questions).toHaveLength(5);
    });

    test('should handle response with extra text around JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Here is the quiz:\n' + JSON.stringify({
                  questions: Array.from({ length: 5 }, (_, i) => ({
                    type: 'TEXT',
                    text: `Вопрос ${i + 1}`,
                    correctAnswer: `Ответ ${i + 1}`,
                    order: i + 1,
                  })),
                }) + '\nHope this helps!',
              },
            },
          ],
        }),
      });

      const result = await openRouterService.generateQuiz('Test content', 'Test Lesson');

      expect(result).toBeDefined();
      expect(result.questions).toHaveLength(5);
    });

    test('should reject quiz with too few questions', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: [
                    {
                      type: 'TEXT',
                      text: 'Only one question',
                      correctAnswer: 'Answer',
                      order: 1,
                    },
                  ],
                }),
              },
            },
          ],
        }),
      });

      await expect(
        openRouterService.generateQuiz('Test content', 'Test Lesson')
      ).rejects.toThrow('Quiz must have between 5 and 10 questions');
    });

    test('should reject quiz with too many questions', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: Array.from({ length: 15 }, (_, i) => ({
                    type: 'TEXT',
                    text: `Question ${i + 1}`,
                    correctAnswer: `Answer ${i + 1}`,
                    order: i + 1,
                  })),
                }),
              },
            },
          ],
        }),
      });

      await expect(
        openRouterService.generateQuiz('Test content', 'Test Lesson')
      ).rejects.toThrow('Quiz must have between 5 and 10 questions');
    });

    test('should reject response without questions array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  quiz: 'invalid structure',
                }),
              },
            },
          ],
        }),
      });

      await expect(
        openRouterService.generateQuiz('Test content', 'Test Lesson')
      ).rejects.toThrow();
    });
  });

  describe('Question validation', () => {
    test('should reject question with invalid type', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: [
                    {
                      type: 'INVALID_TYPE',
                      text: 'Question',
                      correctAnswer: 'Answer',
                      order: 1,
                    },
                    ...Array.from({ length: 4 }, (_, i) => ({
                      type: 'TEXT',
                      text: `Question ${i + 2}`,
                      correctAnswer: `Answer ${i + 2}`,
                      order: i + 2,
                    })),
                  ],
                }),
              },
            },
          ],
        }),
      });

      await expect(
        openRouterService.generateQuiz('Test content', 'Test Lesson')
      ).rejects.toThrow('invalid type');
    });

    test('should reject question without text', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: [
                    {
                      type: 'TEXT',
                      text: '',
                      correctAnswer: 'Answer',
                      order: 1,
                    },
                    ...Array.from({ length: 4 }, (_, i) => ({
                      type: 'TEXT',
                      text: `Question ${i + 2}`,
                      correctAnswer: `Answer ${i + 2}`,
                      order: i + 2,
                    })),
                  ],
                }),
              },
            },
          ],
        }),
      });

      await expect(
        openRouterService.generateQuiz('Test content', 'Test Lesson')
      ).rejects.toThrow('missing text');
    });

    test('should reject question without correctAnswer', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: [
                    {
                      type: 'TEXT',
                      text: 'Question',
                      order: 1,
                    },
                    ...Array.from({ length: 4 }, (_, i) => ({
                      type: 'TEXT',
                      text: `Question ${i + 2}`,
                      correctAnswer: `Answer ${i + 2}`,
                      order: i + 2,
                    })),
                  ],
                }),
              },
            },
          ],
        }),
      });

      await expect(
        openRouterService.generateQuiz('Test content', 'Test Lesson')
      ).rejects.toThrow('missing correctAnswer');
    });

    test('should reject SINGLE question without options', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: [
                    {
                      type: 'SINGLE',
                      text: 'Question',
                      correctAnswer: 'Answer',
                      order: 1,
                    },
                    ...Array.from({ length: 4 }, (_, i) => ({
                      type: 'TEXT',
                      text: `Question ${i + 2}`,
                      correctAnswer: `Answer ${i + 2}`,
                      order: i + 2,
                    })),
                  ],
                }),
              },
            },
          ],
        }),
      });

      await expect(
        openRouterService.generateQuiz('Test content', 'Test Lesson')
      ).rejects.toThrow('must have at least 2 options');
    });

    test('should reject SINGLE question where correctAnswer is not in options', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: [
                    {
                      type: 'SINGLE',
                      text: 'Question',
                      correctAnswer: 'Wrong Answer',
                      options: ['Option 1', 'Option 2', 'Option 3'],
                      order: 1,
                    },
                    ...Array.from({ length: 4 }, (_, i) => ({
                      type: 'TEXT',
                      text: `Question ${i + 2}`,
                      correctAnswer: `Answer ${i + 2}`,
                      order: i + 2,
                    })),
                  ],
                }),
              },
            },
          ],
        }),
      });

      await expect(
        openRouterService.generateQuiz('Test content', 'Test Lesson')
      ).rejects.toThrow('correctAnswer must be one of the options');
    });

    test('should reject MULTIPLE question with non-array correctAnswer', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: [
                    {
                      type: 'MULTIPLE',
                      text: 'Question',
                      correctAnswer: 'Single Answer',
                      options: ['Option 1', 'Option 2', 'Option 3'],
                      order: 1,
                    },
                    ...Array.from({ length: 4 }, (_, i) => ({
                      type: 'TEXT',
                      text: `Question ${i + 2}`,
                      correctAnswer: `Answer ${i + 2}`,
                      order: i + 2,
                    })),
                  ],
                }),
              },
            },
          ],
        }),
      });

      await expect(
        openRouterService.generateQuiz('Test content', 'Test Lesson')
      ).rejects.toThrow('MULTIPLE type must have array correctAnswer');
    });

    test('should reject MULTIPLE question where correctAnswers are not in options', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: [
                    {
                      type: 'MULTIPLE',
                      text: 'Question',
                      correctAnswer: ['Wrong 1', 'Wrong 2'],
                      options: ['Option 1', 'Option 2', 'Option 3'],
                      order: 1,
                    },
                    ...Array.from({ length: 4 }, (_, i) => ({
                      type: 'TEXT',
                      text: `Question ${i + 2}`,
                      correctAnswer: `Answer ${i + 2}`,
                      order: i + 2,
                    })),
                  ],
                }),
              },
            },
          ],
        }),
      });

      await expect(
        openRouterService.generateQuiz('Test content', 'Test Lesson')
      ).rejects.toThrow('all correctAnswers must be in options');
    });

    test('should auto-assign order if missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: Array.from({ length: 5 }, (_, i) => ({
                    type: 'TEXT',
                    text: `Question ${i + 1}`,
                    correctAnswer: `Answer ${i + 1}`,
                    // order is missing
                  })),
                }),
              },
            },
          ],
        }),
      });

      const result = await openRouterService.generateQuiz('Test content', 'Test Lesson');

      expect(result).toBeDefined();
      expect(result.questions).toHaveLength(5);
      result.questions.forEach((q, i) => {
        expect(q.order).toBe(i + 1);
      });
    });
  });

  describe('API error handling', () => {
    test('should handle API error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(
        openRouterService.generateQuiz('Test content', 'Test Lesson')
      ).rejects.toThrow();
    }, 15000); // Increase timeout for retry logic

    test('should handle network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        openRouterService.generateQuiz('Test content', 'Test Lesson')
      ).rejects.toThrow();
    }, 15000); // Increase timeout for retry logic
  });
});
