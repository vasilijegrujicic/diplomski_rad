"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { API_URL } from "../../lib/api";
import { roleFromToken } from "../../lib/auth";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: "success", text: "Login successful! Redirecting..." });

        localStorage.setItem("token", data.token);

        const role = roleFromToken(data.token);

        setTimeout(() => {
          window.location.href = role === "Admin" ? "/dashboard/admin" : "/dashboard/client";
        }, 1500);
      } else {
        const errorText = await response.text();
        setMessage({ type: "error", text: errorText || "Invalid credentials. Please try again." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please check if the backend is running." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-neutral-950 text-neutral-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10 opacity-40" />

      <div className="w-full max-w-xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-emerald-400 transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-neutral-900/50 backdrop-blur-2xl border border-neutral-800 p-8 md:p-12 rounded-[2rem] shadow-2xl"
        >
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-100 mb-3">
              Welcome <span className="text-emerald-500">Back</span>
            </h1>
            <p className="text-neutral-400">Log in to manage your Berlin apartment hunt.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {message.text && (
              <div className={`p-4 rounded-2xl text-sm font-medium ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                {message.text}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-neutral-200 placeholder:text-neutral-700"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-neutral-200 placeholder:text-neutral-700"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className={`w-full py-4 text-lg font-bold text-neutral-950 rounded-2xl transition-all shadow-lg mt-4 ${isLoading ? "bg-emerald-300 cursor-not-allowed opacity-70" : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20"}`}
            >
              {isLoading ? "Logging in..." : "Log In"}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-neutral-500 text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-emerald-500 hover:text-emerald-400 font-semibold transition-colors">
                Register now!
              </Link>
            </p>
            <Link
              href="/register"
              className="mt-4 inline-block w-full py-3 text-sm font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all"
            >
              Register
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
