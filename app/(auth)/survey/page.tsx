"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface SurveyData {
  learningStyle: string;
  preferredTone: string;
  expertiseLevel: string;
  interests: string[];
  communicationPreference: string;
}

export default function SurveyPage() {
  const router = useRouter();
  const { data: session, update, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [surveyData, setSurveyData] = useState<SurveyData>({
    learningStyle: "",
    preferredTone: "",
    expertiseLevel: "",
    interests: [],
    communicationPreference: "",
  });

  // Show loading state while session is being fetched
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleInterestToggle = (interest: string) => {
    setSurveyData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/expert/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(surveyData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate expert");
      }

      // Update session with new expert
      await update();

      // Redirect to role-specific dashboard
      if (session?.user?.role === "STUDENT") {
        router.push("/student");
      } else if (session?.user?.role === "TEACHER") {
        router.push("/teacher");
      } else if (session?.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    surveyData.learningStyle &&
    surveyData.preferredTone &&
    surveyData.expertiseLevel &&
    surveyData.interests.length > 0 &&
    surveyData.communicationPreference;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Создайте своего AI-эксперта
        </h1>
        <p className="text-gray-600 mb-8">
          Ответьте на несколько вопросов, чтобы мы создали персонализированного
          помощника специально для вас
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Learning Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Как вы предпочитаете учиться?
            </label>
            <div className="space-y-2">
              {[
                { value: "visual", label: "Визуально (схемы, диаграммы)" },
                { value: "auditory", label: "На слух (объяснения, дискуссии)" },
                { value: "kinesthetic", label: "Практически (примеры, задачи)" },
                { value: "reading", label: "Через чтение (тексты, статьи)" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="learningStyle"
                    value={option.value}
                    checked={surveyData.learningStyle === option.value}
                    onChange={(e) =>
                      setSurveyData({ ...surveyData, learningStyle: e.target.value })
                    }
                    className="mr-3"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preferred Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Какой стиль общения вам ближе?
            </label>
            <div className="space-y-2">
              {[
                { value: "formal", label: "Формальный и профессиональный" },
                { value: "friendly", label: "Дружелюбный и неформальный" },
                { value: "motivational", label: "Мотивирующий и вдохновляющий" },
                { value: "concise", label: "Краткий и по делу" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="preferredTone"
                    value={option.value}
                    checked={surveyData.preferredTone === option.value}
                    onChange={(e) =>
                      setSurveyData({ ...surveyData, preferredTone: e.target.value })
                    }
                    className="mr-3"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Expertise Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ваш уровень знаний в целом?
            </label>
            <div className="space-y-2">
              {[
                { value: "beginner", label: "Начинающий" },
                { value: "intermediate", label: "Средний" },
                { value: "advanced", label: "Продвинутый" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="expertiseLevel"
                    value={option.value}
                    checked={surveyData.expertiseLevel === option.value}
                    onChange={(e) =>
                      setSurveyData({
                        ...surveyData,
                        expertiseLevel: e.target.value,
                      })
                    }
                    className="mr-3"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Какие предметы вас интересуют? (выберите несколько)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Математика",
                "Физика",
                "Химия",
                "Биология",
                "История",
                "Литература",
                "Программирование",
                "Иностранные языки",
              ].map((interest) => (
                <label
                  key={interest}
                  className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={surveyData.interests.includes(interest)}
                    onChange={() => handleInterestToggle(interest)}
                    className="mr-3"
                  />
                  <span className="text-gray-700">{interest}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Communication Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Как вы хотите, чтобы эксперт помогал вам?
            </label>
            <div className="space-y-2">
              {[
                {
                  value: "explanatory",
                  label: "Подробные объяснения с примерами",
                },
                { value: "socratic", label: "Наводящие вопросы (метод Сократа)" },
                { value: "direct", label: "Прямые ответы на вопросы" },
                { value: "encouraging", label: "Поддержка и поощрение" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="communicationPreference"
                    value={option.value}
                    checked={
                      surveyData.communicationPreference === option.value
                    }
                    onChange={(e) =>
                      setSurveyData({
                        ...surveyData,
                        communicationPreference: e.target.value,
                      })
                    }
                    className="mr-3"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Создаём вашего эксперта..." : "Создать эксперта"}
          </button>
        </form>
      </div>
    </div>
  );
}
