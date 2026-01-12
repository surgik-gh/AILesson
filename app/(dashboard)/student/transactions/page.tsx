import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export default async function TransactionsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "STUDENT" && session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch user's current balance
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { wisdomCoins: true },
  });

  // Fetch transaction history
  const transactions = await prisma.tokenTransaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50, // Limit to last 50 transactions
  });

  // Format transaction type for display
  const formatTransactionType = (type: string) => {
    const typeMap: Record<string, string> = {
      INITIAL: "Initial Registration",
      DAILY: "Daily Reward",
      LESSON_COST: "Lesson Creation",
      ANSWER_REWARD: "Quiz Answer Reward",
      CHAT_COST: "Chat Message",
      ADMIN_GRANT: "Admin Grant",
      LEADERBOARD_REWARD: "Leaderboard Winner",
    };
    return typeMap[type] || type;
  };

  // Get color class based on transaction amount
  const getAmountColor = (amount: number) => {
    return amount > 0
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Transaction History
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              View your wisdom coins transactions
            </p>
          </div>
          <Link
            href={`/${session.user.role.toLowerCase()}`}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Current Balance Card */}
        <div className="mb-8 rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Current Balance
          </h2>
          <p className="text-5xl font-bold text-indigo-600 dark:text-indigo-400">
            {user?.wisdomCoins || 0} Coins
          </p>
        </div>

        {/* Transactions List */}
        <div className="rounded-2xl bg-white shadow-lg dark:bg-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Transactions
            </h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No transactions yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {new Date(transaction.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {formatTransactionType(transaction.type)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {transaction.description || "-"}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${getAmountColor(transaction.amount)}`}>
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {transactions.length >= 50 && (
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Showing last 50 transactions
          </p>
        )}
      </div>
    </div>
  );
}
