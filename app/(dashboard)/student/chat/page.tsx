"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ChatMessage {
  id: string;
  content: string;
  isFromUser: boolean;
  createdAt: string;
}

interface Expert {
  id: string;
  name: string;
  personality: string;
  communicationStyle: string;
  appearance: string;
}

const CHAT_COST = 5; // Cost per message in wisdom coins

export default function ChatPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [wisdomCoins, setWisdomCoins] = useState(0);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load expert and chat history
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      loadExpertAndMessages();
      setWisdomCoins(session.user.wisdomCoins || 0);
    }
  }, [status, session]);

  const loadExpertAndMessages = async () => {
    try {
      // Load selected expert
      const expertRes = await fetch("/api/expert/selected");
      if (expertRes.ok) {
        const expertData = await expertRes.json();
        setExpert(expertData.expert);

        // Load chat history
        if (expertData.expert) {
          const messagesRes = await fetch(`/api/chat/history?expertId=${expertData.expert.id}`);
          if (messagesRes.ok) {
            const messagesData = await messagesRes.json();
            setMessages(messagesData.messages || []);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load expert and messages:", error);
      setError("Failed to load chat data");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    if (!expert) {
      setError("Please select an expert in settings first");
      return;
    }

    if (wisdomCoins < CHAT_COST) {
      setError(`Insufficient wisdom coins. You need ${CHAT_COST} coins to send a message.`);
      return;
    }

    setError("");
    setIsLoading(true);

    const userMessage = inputMessage.trim();
    setInputMessage("");

    // Optimistically add user message
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: userMessage,
      isFromUser: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          expertId: expert.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();

      // Replace temp message with real one and add expert response
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMessage.id),
        data.userMessage,
        data.expertMessage,
      ]);

      // Update wisdom coins balance
      setWisdomCoins(data.newBalance);
      
      // Update session
      await update();
    } catch (error) {
      console.error("Failed to send message:", error);
      setError(error instanceof Error ? error.message : "Failed to send message");
      
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session || session.user.role !== "STUDENT") {
    router.push("/");
    return null;
  }

  if (!expert) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Chat with Your Expert</h1>
          <p className="text-gray-600 mb-6">
            You haven't selected an expert yet. Please go to settings to select or create an expert.
          </p>
          <button
            onClick={() => router.push("/settings")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-t-lg shadow-md p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {expert.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold">{expert.name}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {expert.personality.substring(0, 60)}...
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Wisdom Coins</div>
              <div className="text-2xl font-bold text-yellow-600">{wisdomCoins}</div>
              <div className="text-xs text-gray-500">{CHAT_COST} coins per message</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-lg mb-2">Start a conversation with {expert.name}!</p>
              <p className="text-sm">Ask questions about your lessons or get help with homework.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isFromUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.isFromUser
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md"
                  }`}
                >
                  {!message.isFromUser && (
                    <div className="font-semibold text-sm mb-1 text-blue-600 dark:text-blue-400">
                      {expert.name}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={`text-xs mt-2 ${
                      message.isFromUser ? "text-blue-200" : "text-gray-500"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-md p-4">
          {error && (
            <div className="mb-3 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask ${expert.name} a question...`}
              disabled={isLoading || wisdomCoins < CHAT_COST}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim() || wisdomCoins < CHAT_COST}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>
          {wisdomCoins < CHAT_COST && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              You need at least {CHAT_COST} wisdom coins to send a message. Complete quizzes to earn more!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
