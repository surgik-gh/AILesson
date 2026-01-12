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

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class GroqService {
  private apiKey: string;
  private baseURL = "https://api.groq.com/openai/v1";
  private model = "llama-3.3-70b-versatile"; // Fast and free tier available

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || "";
    if (!this.apiKey) {
      console.warn("GROQ_API_KEY not set, Groq fallback will not work");
    }
  }

  private async makeRequest(prompt: string, retryCount: number = 0): Promise<string> {
    const maxRetries = 3;

    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY not configured");
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data: GroqResponse = await response.json();
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      console.error(`Groq request failed:`, error);

      // Retry
      if (retryCount < maxRetries - 1) {
        console.log(`Retrying Groq request (attempt ${retryCount + 2}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.makeRequest(prompt, retryCount + 1);
      }

      throw new Error(`Groq service failed after ${maxRetries} retries`);
    }
  }

  async generateExpert(surveyData: SurveyResponse): Promise<Expert> {
    const prompt = `You are an AI expert generator for an educational platform. Based on the following survey responses, create a personalized AI expert avatar.

Survey Data:
- Learning Style: ${surveyData.learningStyle}
- Preferred Tone: ${surveyData.preferredTone}
- Expertise Level: ${surveyData.expertiseLevel}
- Interests: ${surveyData.interests.join(", ")}
- Communication Preference: ${surveyData.communicationPreference}

Generate a JSON response with the following structure (respond ONLY with valid JSON, no additional text):
{
  "name": "A creative, memorable name for the expert (in Russian)",
  "personality": "Detailed personality traits that match the survey responses (2-3 sentences in Russian)",
  "communicationStyle": "How this expert interacts with students, matching their preferences (2-3 sentences in Russian)",
  "appearance": "One of: avatar1, avatar2, avatar3, avatar4, avatar5 (choose based on personality)"
}

Make the expert feel unique and tailored to the student's preferences. Use Russian language for all text fields.`;

    try {
      const response = await this.makeRequest(prompt);
      
      // Try to extract JSON from response
      let jsonStr = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      }
      
      // Find JSON object in response
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const expert = JSON.parse(jsonStr) as Expert;

      // Validate required fields
      if (!expert.name || !expert.personality || !expert.communicationStyle || !expert.appearance) {
        throw new Error("Generated expert is missing required fields");
      }

      // Validate appearance value
      const validAppearances = ["avatar1", "avatar2", "avatar3", "avatar4", "avatar5"];
      if (!validAppearances.includes(expert.appearance)) {
        expert.appearance = "avatar1"; // Default fallback
      }

      return expert;
    } catch (error) {
      console.error("Failed to generate expert with Groq:", error);
      throw error;
    }
  }

  async generateLesson(material: string, subjectName: string): Promise<LessonData> {
    const prompt = `You are an educational content generator for the AILesson platform. Based on the provided learning material, create a structured lesson.

Material: ${material}

Subject: ${subjectName}

Generate a JSON response with the following structure (respond ONLY with valid JSON, no additional text):
{
  "title": "A clear, descriptive title for the lesson (in Russian)",
  "content": "Detailed lesson content in markdown format, well-structured with headings, bullet points, and examples (in Russian). Should be comprehensive and educational.",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "..."] (3-7 key takeaways in Russian),
  "difficulty": "BEGINNER" or "INTERMEDIATE" or "ADVANCED" (assess based on content complexity)
}

Make the lesson engaging, clear, and educational. Use Russian language for all text fields.`;

    try {
      const response = await this.makeRequest(prompt);
      
      // Try to extract JSON from response
      let jsonStr = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      }
      
      // Find JSON object in response
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const lesson = JSON.parse(jsonStr) as LessonData;

      // Validate required fields
      if (!lesson.title || !lesson.content || !lesson.keyPoints || !lesson.difficulty) {
        throw new Error("Generated lesson is missing required fields");
      }

      // Validate difficulty value
      const validDifficulties = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
      if (!validDifficulties.includes(lesson.difficulty)) {
        lesson.difficulty = "INTERMEDIATE"; // Default fallback
      }

      // Ensure keyPoints is an array
      if (!Array.isArray(lesson.keyPoints)) {
        lesson.keyPoints = [];
      }

      return lesson;
    } catch (error) {
      console.error("Failed to generate lesson with Groq:", error);
      throw error;
    }
  }

  async generateQuiz(lessonContent: string, lessonTitle: string): Promise<QuizData> {
    const prompt = `You are a quiz generator for an educational platform. Based on the provided lesson content, create a comprehensive quiz with 5-10 questions.

Lesson Title: ${lessonTitle}

Lesson Content: ${lessonContent}

Generate a JSON response with the following structure (respond ONLY with valid JSON, no additional text):
{
  "questions": [
    {
      "type": "TEXT" or "SINGLE" or "MULTIPLE",
      "text": "The question text (in Russian)",
      "correctAnswer": "For TEXT: the correct answer string. For SINGLE: the correct option string. For MULTIPLE: array of correct option strings",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"] (only for SINGLE and MULTIPLE types, 4-6 options in Russian),
      "order": 1
    },
    ...
  ]
}

Requirements:
- Create 5-10 questions total
- Mix question types: include TEXT (open-ended), SINGLE (one correct answer), and MULTIPLE (multiple correct answers)
- For SINGLE type: correctAnswer should be one of the options
- For MULTIPLE type: correctAnswer should be an array of option strings
- For TEXT type: correctAnswer should be a string with the expected answer
- All text should be in Russian
- Questions should test understanding of key concepts from the lesson
- Order questions from 1 to N sequentially`;

    try {
      const response = await this.makeRequest(prompt);
      
      // Try to extract JSON from response
      let jsonStr = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      }
      
      // Find JSON object in response
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const quizData = JSON.parse(jsonStr) as QuizData;

      // Validate quiz structure
      if (!quizData.questions || !Array.isArray(quizData.questions)) {
        throw new Error("Generated quiz is missing questions array");
      }

      if (quizData.questions.length < 5 || quizData.questions.length > 10) {
        throw new Error("Quiz must have between 5 and 10 questions");
      }

      // Validate each question
      const validTypes = ['TEXT', 'SINGLE', 'MULTIPLE'];
      quizData.questions.forEach((question, index) => {
        if (!validTypes.includes(question.type)) {
          throw new Error(`Question ${index + 1} has invalid type: ${question.type}`);
        }

        if (!question.text || typeof question.text !== 'string') {
          throw new Error(`Question ${index + 1} is missing text`);
        }

        if (question.correctAnswer === undefined || question.correctAnswer === null) {
          throw new Error(`Question ${index + 1} is missing correctAnswer`);
        }

        // Validate SINGLE and MULTIPLE types have options
        if ((question.type === 'SINGLE' || question.type === 'MULTIPLE') && 
            (!question.options || !Array.isArray(question.options) || question.options.length < 2)) {
          throw new Error(`Question ${index + 1} of type ${question.type} must have at least 2 options`);
        }

        // Validate SINGLE type correctAnswer is in options
        if (question.type === 'SINGLE' && question.options && 
            !question.options.includes(question.correctAnswer as string)) {
          throw new Error(`Question ${index + 1}: correctAnswer must be one of the options`);
        }

        // Validate MULTIPLE type correctAnswer is array and all are in options
        if (question.type === 'MULTIPLE') {
          if (!Array.isArray(question.correctAnswer)) {
            throw new Error(`Question ${index + 1}: MULTIPLE type must have array correctAnswer`);
          }
          const correctAnswers = question.correctAnswer as string[];
          if (question.options && !correctAnswers.every(ans => question.options!.includes(ans))) {
            throw new Error(`Question ${index + 1}: all correctAnswers must be in options`);
          }
        }

        // Ensure order is set
        if (typeof question.order !== 'number') {
          question.order = index + 1;
        }
      });

      return quizData;
    } catch (error) {
      console.error("Failed to generate quiz with Groq:", error);
      throw error;
    }
  }

  async generateChatResponse(
    userMessage: string,
    expertPersonality: string,
    expertCommunicationStyle: string,
    expertName: string,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    const systemPrompt = `You are ${expertName}, an AI expert tutor with the following characteristics:

Personality: ${expertPersonality}

Communication Style: ${expertCommunicationStyle}

Your role is to help students with their learning questions. Be helpful, encouraging, and educational. Always respond in Russian. Keep responses concise but informative (2-4 sentences typically). Stay in character based on your personality and communication style.`;

    try {
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...chatHistory.slice(-10), // Keep last 10 messages for context
        { role: 'user' as const, content: userMessage },
      ];

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.8,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data: GroqResponse = await response.json();
      const reply = data.choices[0]?.message?.content || "";

      if (!reply) {
        throw new Error("Empty response from AI");
      }

      return reply;
    } catch (error) {
      console.error("Failed to generate chat response with Groq:", error);
      throw error;
    }
  }
}
