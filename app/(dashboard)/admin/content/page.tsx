"use client";

import { useState, useEffect } from "react";

interface Lesson {
  id: string;
  title: string;
  content: string;
  difficulty: string;
  createdAt: string;
  creator: {
    name: string;
    email: string;
  };
  subject: {
    name: string;
  };
  quiz: {
    id: string;
    questions: { id: string }[];
  } | null;
}

interface ChatConversation {
  userId: string;
  userName: string;
  userEmail: string;
  expertName: string;
  messageCount: number;
  lastMessageAt: string;
}

export default function ContentModerationPage() {
  const [activeTab, setActiveTab] = useState<"lessons" | "chats">("lessons");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === "lessons") {
      fetchLessons();
    } else {
      fetchConversations();
    }
  }, [activeTab]);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content/lessons");
      if (response.ok) {
        const data = await response.json();
        setLessons(data.lessons);
      }
    } catch (error) {
      console.error("Failed to fetch lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content/chats");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/content/chats/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data.messages);
      }
    } catch (error) {
      console.error("Failed to fetch chat messages:", error);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson? This will also delete the associated quiz.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/content/lessons/${lessonId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setLessons(lessons.filter((l) => l.id !== lessonId));
        setSelectedLesson(null);
        alert("Lesson deleted successfully");
      } else {
        alert("Failed to delete lesson");
      }
    } catch (error) {
      console.error("Failed to delete lesson:", error);
      alert("Failed to delete lesson");
    }
  };

  const handleFlagLesson = async (lessonId: string) => {
    const reason = prompt("Enter reason for flagging this lesson:");
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/content/lessons/${lessonId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        alert("Lesson flagged successfully");
      } else {
        alert("Failed to flag lesson");
      }
    } catch (error) {
      console.error("Failed to flag lesson:", error);
      alert("Failed to flag lesson");
    }
  };

  const handleDeleteChatMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/content/chats/messages/${messageId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setChatMessages(chatMessages.filter((m) => m.id !== messageId));
        alert("Message deleted successfully");
      } else {
        alert("Failed to delete message");
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("Failed to delete message");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Content Moderation
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Review and moderate platform content
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("lessons")}
            className={`rounded-lg px-6 py-3 font-medium transition-colors ${
              activeTab === "lessons"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            Lessons & Quizzes
          </button>
          <button
            onClick={() => setActiveTab("chats")}
            className={`rounded-lg px-6 py-3 font-medium transition-colors ${
              activeTab === "chats"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            Chat Conversations
          </button>
        </div>

        {loading ? (
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        ) : (
          <>
            {activeTab === "lessons" && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Lessons List */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    All Lessons ({lessons.length})
                  </h2>
                  <div className="space-y-3">
                    {lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className={`cursor-pointer rounded-lg bg-white p-4 shadow hover:shadow-md transition-shadow dark:bg-gray-800 ${
                          selectedLesson?.id === lesson.id ? "ring-2 ring-indigo-500" : ""
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {lesson.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {lesson.subject.name} • {lesson.difficulty}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          By {lesson.creator.name} • {new Date(lesson.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lesson Details */}
                <div>
                  {selectedLesson ? (
                    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
                      <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedLesson.title}
                      </h2>
                      <div className="mb-4 space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-semibold">Subject:</span> {selectedLesson.subject.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-semibold">Difficulty:</span> {selectedLesson.difficulty}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-semibold">Creator:</span> {selectedLesson.creator.name} (
                          {selectedLesson.creator.email})
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-semibold">Quiz Questions:</span>{" "}
                          {selectedLesson.quiz?.questions.length || 0}
                        </p>
                      </div>
                      <div className="mb-4">
                        <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Content:</h3>
                        <div className="max-h-64 overflow-y-auto rounded bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          {selectedLesson.content}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleFlagLesson(selectedLesson.id)}
                          className="flex-1 rounded-lg bg-yellow-100 px-4 py-2 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800"
                        >
                          Flag
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(selectedLesson.id)}
                          className="flex-1 rounded-lg bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-white p-6 text-center text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      Select a lesson to view details
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "chats" && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Conversations List */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Chat Conversations ({conversations.length})
                  </h2>
                  <div className="space-y-3">
                    {conversations.map((conv) => (
                      <div
                        key={conv.userId}
                        onClick={() => {
                          setSelectedConversation(conv);
                          fetchChatMessages(conv.userId);
                        }}
                        className={`cursor-pointer rounded-lg bg-white p-4 shadow hover:shadow-md transition-shadow dark:bg-gray-800 ${
                          selectedConversation?.userId === conv.userId ? "ring-2 ring-indigo-500" : ""
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {conv.userName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Expert: {conv.expertName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {conv.messageCount} messages • Last: {new Date(conv.lastMessageAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Messages */}
                <div>
                  {selectedConversation ? (
                    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
                      <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedConversation.userName}'s Chat
                      </h2>
                      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                        With expert: {selectedConversation.expertName}
                      </p>
                      <div className="max-h-96 space-y-3 overflow-y-auto">
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`rounded-lg p-3 ${
                              message.isFromUser
                                ? "bg-indigo-50 dark:bg-indigo-900"
                                : "bg-gray-50 dark:bg-gray-700"
                            }`}
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                {message.isFromUser ? "User" : "Expert"}
                              </span>
                              <button
                                onClick={() => handleDeleteChatMessage(message.id)}
                                className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {message.content}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-white p-6 text-center text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      Select a conversation to view messages
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
