"use client";

import { useState, useEffect } from "react";

interface Expert {
  id: string;
  name: string;
  personality: string;
  communicationStyle: string;
  appearance: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    usersUsingThis: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function ExpertManagementPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningExpert, setAssigningExpert] = useState<Expert | null>(null);

  useEffect(() => {
    fetchExperts();
    fetchUsers();
  }, []);

  const fetchExperts = async () => {
    try {
      const response = await fetch("/api/admin/experts");
      if (response.ok) {
        const data = await response.json();
        setExperts(data.experts);
      }
    } catch (error) {
      console.error("Failed to fetch experts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleDeleteExpert = async (expertId: string) => {
    if (!confirm("Are you sure you want to delete this expert?")) return;

    try {
      const response = await fetch(`/api/admin/experts/${expertId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setExperts(experts.filter((e) => e.id !== expertId));
      } else {
        alert("Failed to delete expert");
      }
    } catch (error) {
      console.error("Failed to delete expert:", error);
      alert("Failed to delete expert");
    }
  };

  const handleAssignExpert = async (userId: string, expertId: string) => {
    try {
      const response = await fetch(`/api/admin/experts/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, expertId }),
      });

      if (response.ok) {
        alert("Expert assigned successfully");
        setShowAssignModal(false);
        fetchExperts();
      } else {
        alert("Failed to assign expert");
      }
    } catch (error) {
      console.error("Failed to assign expert:", error);
      alert("Failed to assign expert");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="mx-auto max-w-7xl">
          <p className="text-gray-600 dark:text-gray-400">Loading experts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Expert Avatar Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage AI expert avatars
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 transition-colors"
          >
            Create Expert
          </button>
        </div>

        {/* Experts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {experts.map((expert) => (
            <div
              key={expert.id}
              className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {expert.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Created by {expert.owner.name}
                  </p>
                </div>
                <span className="text-3xl">{expert.appearance || "🤖"}</span>
              </div>

              <div className="mb-4 space-y-2">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Personality
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {expert.personality}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Communication Style
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {expert.communicationStyle}
                  </p>
                </div>
              </div>

              <div className="mb-4 rounded-lg bg-indigo-50 p-3 dark:bg-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">{expert._count.usersUsingThis}</span>{" "}
                  users using this expert
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingExpert(expert)}
                  className="flex-1 rounded-lg bg-indigo-100 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setAssigningExpert(expert);
                    setShowAssignModal(true);
                  }}
                  className="flex-1 rounded-lg bg-green-100 px-3 py-2 text-sm text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
                >
                  Assign
                </button>
                <button
                  onClick={() => handleDeleteExpert(expert.id)}
                  className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {experts.length === 0 && (
          <p className="mt-4 text-center text-gray-500 dark:text-gray-400">
            No experts found
          </p>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || editingExpert) && (
          <ExpertModal
            expert={editingExpert}
            users={users}
            onClose={() => {
              setShowCreateModal(false);
              setEditingExpert(null);
            }}
            onSuccess={() => {
              fetchExperts();
              setShowCreateModal(false);
              setEditingExpert(null);
            }}
          />
        )}

        {/* Assign Modal */}
        {showAssignModal && assigningExpert && (
          <AssignModal
            expert={assigningExpert}
            users={users}
            onClose={() => {
              setShowAssignModal(false);
              setAssigningExpert(null);
            }}
            onAssign={handleAssignExpert}
          />
        )}
      </div>
    </div>
  );
}

function ExpertModal({
  expert,
  users,
  onClose,
  onSuccess,
}: {
  expert: Expert | null;
  users: User[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: expert?.name || "",
    personality: expert?.personality || "",
    communicationStyle: expert?.communicationStyle || "",
    appearance: expert?.appearance || "🤖",
    ownerId: expert?.owner.id || users[0]?.id || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = expert ? `/api/admin/experts/${expert.id}` : "/api/admin/experts";
      const method = expert ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to save expert");
      }
    } catch (error) {
      console.error("Failed to save expert:", error);
      alert("Failed to save expert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800 my-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          {expert ? "Edit Expert" : "Create Expert"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Personality
            </label>
            <textarea
              required
              rows={3}
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Communication Style
            </label>
            <textarea
              required
              rows={3}
              value={formData.communicationStyle}
              onChange={(e) =>
                setFormData({ ...formData, communicationStyle: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Appearance (emoji or model reference)
            </label>
            <input
              type="text"
              required
              value={formData.appearance}
              onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Owner
            </label>
            <select
              value={formData.ownerId}
              onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : expert ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignModal({
  expert,
  users,
  onClose,
  onAssign,
}: {
  expert: Expert;
  users: User[];
  onClose: () => void;
  onAssign: (userId: string, expertId: string) => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Assign Expert: {expert.name}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onAssign(selectedUserId, expert.id)}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Assign
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
