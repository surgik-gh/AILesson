'use client';

import { useState, useRef, useEffect } from 'react';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

export type QuestionType = 'TEXT' | 'SINGLE' | 'MULTIPLE';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  order: number;
}

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onSubmitAnswer: (answer: any) => Promise<void>;
  isSubmitting: boolean;
}

export function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  onSubmitAnswer,
  isSubmitting,
}: QuestionDisplayProps) {
  const [answer, setAnswer] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set());
  const [textAnswer, setTextAnswer] = useState('');
  const [focusedOptionIndex, setFocusedOptionIndex] = useState<number>(0);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = async () => {
    let finalAnswer;
    
    if (question.type === 'TEXT') {
      finalAnswer = textAnswer.trim();
    } else if (question.type === 'SINGLE') {
      finalAnswer = answer;
    } else if (question.type === 'MULTIPLE') {
      finalAnswer = Array.from(selectedOptions).sort();
    }

    if (finalAnswer === null || finalAnswer === '' || (Array.isArray(finalAnswer) && finalAnswer.length === 0)) {
      alert('Please provide an answer before submitting');
      return;
    }

    await onSubmitAnswer(finalAnswer);
    
    // Reset for next question
    setAnswer(null);
    setSelectedOptions(new Set());
    setTextAnswer('');
    setFocusedOptionIndex(0);
  };

  const handleSingleChoice = (index: number) => {
    setAnswer(index);
  };

  const handleMultipleChoice = (index: number) => {
    const newSelected = new Set(selectedOptions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedOptions(newSelected);
  };

  // Keyboard navigation for options
  const handleOptionKeyDown = (e: React.KeyboardEvent, index: number) => {
    const optionsCount = question.options?.length || 0;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedOptionIndex((prev) => (prev + 1) % optionsCount);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedOptionIndex((prev) => (prev - 1 + optionsCount) % optionsCount);
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        if (question.type === 'SINGLE') {
          handleSingleChoice(index);
        } else if (question.type === 'MULTIPLE') {
          handleMultipleChoice(index);
        }
        break;
    }
  };

  // Keyboard shortcut to submit with Ctrl+Enter
  useKeyboardNavigation({
    onEnter: () => {
      if (!isSubmitting) {
        submitButtonRef.current?.click();
      }
    },
    enabled: !isSubmitting,
  });

  // Focus management for options
  useEffect(() => {
    if (question.type !== 'TEXT' && question.options) {
      const optionButtons = document.querySelectorAll<HTMLButtonElement>('[data-option-index]');
      optionButtons[focusedOptionIndex]?.focus();
    }
  }, [focusedOptionIndex, question.type, question.options]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8" role="region" aria-labelledby="question-heading">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-indigo-600" aria-label={`Question ${questionNumber} of ${totalQuestions}`}>
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-sm text-gray-500" aria-label={`Question type: ${question.type === 'TEXT' ? 'Text Answer' : question.type === 'SINGLE' ? 'Single Choice' : 'Multiple Choice'}`}>
            {question.type === 'TEXT' && 'Text Answer'}
            {question.type === 'SINGLE' && 'Single Choice'}
            {question.type === 'MULTIPLE' && 'Multiple Choice'}
          </span>
        </div>
        
        <h2 id="question-heading" className="text-2xl font-bold text-gray-900 mb-6">
          {question.text}
        </h2>
      </div>

      <div className="mb-8">
        {question.type === 'TEXT' && (
          <div>
            <label htmlFor={`answer-${question.id}`} className="sr-only">
              Your answer
            </label>
            <textarea
              id={`answer-${question.id}`}
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={4}
              disabled={isSubmitting}
              aria-required="true"
              aria-describedby="text-answer-description"
            />
            <span id="text-answer-description" className="sr-only">
              Enter your text answer in the field above
            </span>
          </div>
        )}

        {question.type === 'SINGLE' && question.options && (
          <fieldset>
            <legend className="sr-only">Select one answer (use arrow keys to navigate, Enter or Space to select)</legend>
            <div className="space-y-3" role="radiogroup" aria-labelledby="question-heading">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  data-option-index={index}
                  onClick={() => handleSingleChoice(index)}
                  onKeyDown={(e) => handleOptionKeyDown(e, index)}
                  disabled={isSubmitting}
                  role="radio"
                  aria-checked={answer === index}
                  aria-label={option}
                  tabIndex={index === focusedOptionIndex ? 0 : -1}
                  className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all ${
                    answer === index
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                        answer === index
                          ? 'border-indigo-600 bg-indigo-600'
                          : 'border-gray-300'
                      }`}
                      aria-hidden="true"
                    >
                      {answer === index && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-900">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {question.type === 'MULTIPLE' && question.options && (
          <fieldset>
            <legend className="sr-only">Select all that apply (use arrow keys to navigate, Enter or Space to toggle)</legend>
            <div className="space-y-3" role="group" aria-labelledby="question-heading">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  data-option-index={index}
                  onClick={() => handleMultipleChoice(index)}
                  onKeyDown={(e) => handleOptionKeyDown(e, index)}
                  disabled={isSubmitting}
                  role="checkbox"
                  aria-checked={selectedOptions.has(index)}
                  aria-label={option}
                  tabIndex={index === focusedOptionIndex ? 0 : -1}
                  className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all ${
                    selectedOptions.has(index)
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                        selectedOptions.has(index)
                          ? 'border-indigo-600 bg-indigo-600'
                          : 'border-gray-300'
                      }`}
                      aria-hidden="true"
                    >
                      {selectedOptions.has(index) && (
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
                      )}
                    </div>
                    <span className="text-gray-900">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      <button
        ref={submitButtonRef}
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Answer'}
      </button>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Press Enter to submit
      </p>
    </div>
  );
}
