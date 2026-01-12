"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PasswordChange } from "@/components/ui/PasswordChange";
import { getUserSettings } from "@/app/actions/settings";

interface Expert {
  id: string;
  name: string;
  personality: string;
  communicationStyle: string;
  appearance: string;
}

type Theme = "LIGHT" | "DARK" | "BASIC";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<Theme>("BASIC");

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }

    // Set initial selected expert
    if (session.user.selectedExpertId) {
      setSelectedExpertId(session.user.selectedExpertId);
    }

    // Fetch user's experts and settings
    fetchExperts();
    fetchSettings();
  }, [session, router]);

  const fetchSettings = async () => {
    try {
      const result = await getUserSettings();
      if (result.success && result.settings) {
        setCurrentTheme(result.settings.theme as Theme);
        // Apply theme to document
        document.documentElement.setAttribute("data-theme", result.settings.theme.toLowerCase());
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  const fetchExperts = async () => {
    try {
      const response = await fetch("/api/expert/list");
      if (!response.ok) {
        throw new Error("Failed to fetch experts");
      }
      const data = await response.json();
      setExperts(data.experts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load experts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExpert = async (expertId: string) => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/expert/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expertId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to select expert");
      }

      setSelectedExpertId(expertId);
      setSuccessMessage("Эксперт успешно выбран!");

      // Update session
      await update();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewExpert = () => {
    router.push("/survey");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Настройки</h1>

        {/* Theme Settings Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <ThemeToggle 
            initialTheme={currentTheme} 
            onThemeChange={(theme) => setCurrentTheme(theme)}
          />
        </div>

        {/* Expert Selection Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Выбор AI-эксперта
          </h2>
          <p className="text-gray-600 mb-6">
            Выберите эксперта, который будет помогать вам в обучении
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {successMessage}
            </div>
          )}

          {experts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                У вас пока нет созданных экспертов
              </p>
              <button
                onClick={handleCreateNewExpert}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Создать первого эксперта
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {experts.map((expert) => (
                  <div
                    key={expert.id}
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedExpertId === expert.id
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                    onClick={() => handleSelectExpert(expert.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {expert.name}
                      </h3>
                      {selectedExpertId === expert.id && (
                        <span className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-full">
                          Выбран
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm mb-3">
                      {expert.personality}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Стиль общения:</span>{" "}
                      {expert.communicationStyle}
                    </p>
                    <div className="mt-4 flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                        {expert.name.charAt(0)}
                      </div>
                      <span className="ml-3 text-sm text-gray-500">
                        {expert.appearance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCreateNewExpert}
                className="w-full py-3 px-4 border-2 border-dashed border-gray-300 text-gray-600 font-medium rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                + Создать нового эксперта
              </button>
            </>
          )}
        </div>

        {/* Password Change Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <PasswordChange />
        </div>

        {/* User Info Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Информация о профиле
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">Имя:</span>{" "}
              <span className="font-medium text-gray-900">
                {session?.user?.name}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>{" "}
              <span className="font-medium text-gray-900">
                {session?.user?.email}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Роль:</span>{" "}
              <span className="font-medium text-gray-900">
                {session?.user?.role === "STUDENT"
                  ? "Ученик"
                  : session?.user?.role === "TEACHER"
                  ? "Учитель"
                  : "Администратор"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Монеты мудрости:</span>{" "}
              <span className="font-medium text-indigo-600">
                {session?.user?.wisdomCoins || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
