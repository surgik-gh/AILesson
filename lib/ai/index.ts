import { OpenRouterService } from './openrouter';
import { GroqService } from './groq';

interface SurveyResponse {
  learningStyle: string;
  preferredTone: string;
  expertiseLevel: string;
  interests: string[];
  communicationPreference: string;
}

interface Expert {
  name: string;
  personality: string;
  communicationStyle: string;
  appearance: string;
}

interface LessonData {
  title: string;
  content: string;
  keyPoints: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

interface QuizQuestion {
  type: 'TEXT' | 'SINGLE' | 'MULTIPLE';
  text: string;
  correctAnswer: any;
  options?: string[];
  order: number;
}

interface QuizData {
  questions: QuizQuestion[];
}

/**
 * Unified AI service that uses OpenRouter as primary and Groq as fallback
 */
export class AIService {
  private openRouter: OpenRouterService;
  private groq: GroqService;

  constructor() {
    this.openRouter = new OpenRouterService();
    this.groq = new GroqService();
  }

  async generateExpert(surveyData: SurveyResponse): Promise<Expert> {
    try {
      return await this.openRouter.generateExpert(surveyData);
    } catch (error) {
      console.error('OpenRouter failed for expert generation, trying Groq fallback:', error);
      try {
        return await this.groq.generateExpert(surveyData);
      } catch (groqError) {
        console.error('Groq fallback also failed:', groqError);
        // Return default expert as last resort
        return {
          name: "Профессор Знайка",
          personality: "Дружелюбный и терпеливый наставник, который всегда готов помочь. Обладает глубокими знаниями и умеет объяснять сложные вещи простым языком.",
          communicationStyle: "Использует понятные примеры и аналогии. Поощряет вопросы и создаёт комфортную атмосферу для обучения.",
          appearance: "avatar1",
        };
      }
    }
  }

  async generateLesson(material: string, subjectName: string): Promise<LessonData> {
    try {
      return await this.openRouter.generateLesson(material, subjectName);
    } catch (error) {
      console.error('OpenRouter failed for lesson generation, trying Groq fallback:', error);
      return await this.groq.generateLesson(material, subjectName);
    }
  }

  async generateQuiz(lessonContent: string, lessonTitle: string): Promise<QuizData> {
    try {
      return await this.openRouter.generateQuiz(lessonContent, lessonTitle);
    } catch (error) {
      console.error('OpenRouter failed for quiz generation, trying Groq fallback:', error);
      return await this.groq.generateQuiz(lessonContent, lessonTitle);
    }
  }

  async generateChatResponse(
    userMessage: string,
    expertPersonality: string,
    expertCommunicationStyle: string,
    expertName: string,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    try {
      return await this.openRouter.generateChatResponse(
        userMessage,
        expertPersonality,
        expertCommunicationStyle,
        expertName,
        chatHistory
      );
    } catch (error) {
      console.error('OpenRouter failed for chat response, trying Groq fallback:', error);
      return await this.groq.generateChatResponse(
        userMessage,
        expertPersonality,
        expertCommunicationStyle,
        expertName,
        chatHistory
      );
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export types
export type { QuizQuestion, QuizData };
