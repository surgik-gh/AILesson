"use client";

import { useState } from "react";
import { updateTheme } from "@/app/actions/settings";

type Theme = "LIGHT" | "DARK" | "BASIC";

interface ThemeToggleProps {
  initialTheme: Theme;
  onThemeChange?: (theme: Theme) => void;
}

export function ThemeToggle({ initialTheme, onThemeChange }: ThemeToggleProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(initialTheme);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const themes: { value: Theme; label: string; description: string }[] = [
    {
      value: "LIGHT",
      label: "Светлая",
      description: "Светлая тема для дневного использования",
    },
    {
      value: "DARK",
      label: "Темная",
      description: "Темная тема для комфортной работы в темноте",
    },
    {
      value: "BASIC",
      label: "Базовая",
      description: "Стандартная тема с балансом цветов",
    },
  ];

  const handleThemeChange = async (theme: Theme) => {
    setIsUpdating(true);
    setError(null);

    try {
      const result = await updateTheme(theme);

      if (result.success) {
        setCurrentTheme(theme);
        
        // Apply theme to document
        document.documentElement.setAttribute("data-theme", theme.toLowerCase());
        
        // Call callback if provided
        if (onThemeChange) {
          onThemeChange(theme);
        }
      } else {
        setError(result.error || "Failed to update theme");
      }
    } catch (err) {
      setError("An error occurred while updating theme");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <section aria-labelledby="theme-heading" className="space-y-4">
      <div>
        <h3 id="theme-heading" className="text-lg font-semibold text-gray-900 mb-2">Тема оформления</h3>
        <p className="text-sm text-gray-600 mb-4">
          Выберите тему, которая вам больше нравится
        </p>
      </div>

      {error && (
        <div 
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <fieldset>
        <legend className="sr-only">Select theme</legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="radiogroup" aria-labelledby="theme-heading">
          {themes.map((theme) => (
            <button
              key={theme.value}
              onClick={() => handleThemeChange(theme.value)}
              disabled={isUpdating}
              role="radio"
              aria-checked={currentTheme === theme.value}
              aria-label={`${theme.label}: ${theme.description}`}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                currentTheme === theme.value
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 hover:border-indigo-300"
              } ${isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{theme.label}</span>
                {currentTheme === theme.value && (
                  <span className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center" aria-hidden="true">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{theme.description}</p>
              
              {/* Theme preview */}
              <div className="mt-3 flex gap-2" aria-hidden="true">
                {theme.value === "LIGHT" && (
                  <>
                    <div className="w-8 h-8 rounded bg-white border border-gray-300"></div>
                    <div className="w-8 h-8 rounded bg-gray-100 border border-gray-300"></div>
                    <div className="w-8 h-8 rounded bg-indigo-500"></div>
                  </>
                )}
                {theme.value === "DARK" && (
                  <>
                    <div className="w-8 h-8 rounded bg-gray-900"></div>
                    <div className="w-8 h-8 rounded bg-gray-800"></div>
                    <div className="w-8 h-8 rounded bg-indigo-600"></div>
                  </>
                )}
                {theme.value === "BASIC" && (
                  <>
                    <div className="w-8 h-8 rounded bg-gray-50 border border-gray-300"></div>
                    <div className="w-8 h-8 rounded bg-gray-200"></div>
                    <div className="w-8 h-8 rounded bg-purple-500"></div>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
