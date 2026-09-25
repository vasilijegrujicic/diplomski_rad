"use client";
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, Mail, MessageSquare, Trash2, Edit3, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { authFetch } from "../../../lib/api";

interface UserData {
  id: string;
  email: string;
  telegramChatId: string;
  role: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await authFetch("/api/admin/users");
      if (response.status === 403) {
        window.location.href = "/dashboard/client";
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await authFetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "User updated successfully!" });
        setEditingUser(null);
        fetchUsers();
      } else {
        setMessage({ type: "error", text: "Failed to update user." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error occurred." });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await authFetch(`/api/admin/users/${id}`, { method: "DELETE" });

      if (response.ok) {
        setMessage({ type: "success", text: "User deleted successfully!" });
        fetchUsers();
      } else {
        setMessage({ type: "error", text: "Failed to delete user." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error occurred." });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      {/* Top Navigation */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl">
            <ShieldCheck className="text-emerald-500" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin <span className="text-emerald-500">Panel</span></h1>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-red-400 transition-colors"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/";
          }}
        >
          <LogOut size={16} />
          Sign Out
        </Link>
      </div>

      <div className="max-w-7xl mx-auto">
        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl text-sm font-medium ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
            {message.text}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-800/50 text-neutral-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">User</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Telegram ID</th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-neutral-800 rounded-lg text-neutral-400 group-hover:text-emerald-400 transition-colors">
                            <User size={16} />
                          </div>
                          <span className="font-medium">{user.email.split('@')[0]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-400 text-sm">{user.email}</td>
                      <td className="px-6 py-4 font-mono text-xs text-neutral-500">{user.telegramChatId || "N/A"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.role === 'Admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-2 text-neutral-500 hover:text-emerald-400 transition-colors"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2rem] w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-6">Edit User Profile</h2>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                    <input
                      type="email"
                      className="w-full pl-12 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all text-neutral-200"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Telegram Chat ID</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all text-neutral-200"
                      value={editingUser.telegramChatId}
                      onChange={(e) => setEditingUser({...editingUser, telegramChatId: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-3 font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 font-bold text-neutral-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
