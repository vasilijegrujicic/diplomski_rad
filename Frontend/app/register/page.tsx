"use client";
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Euro, Mail, Send, CheckCircle2, Ruler, Bed, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "../../lib/api";
import { KIEZ_OPTIONS } from "../../lib/kiezOptions";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? "flatfinder11_bot";
const VERIFY_TIMEOUT_MS = 24 * 60 * 60 * 1000;

// Same fields as the dashboard's filter form (create/update), so the first filter created
// at registration looks exactly like one the user could have made by hand afterwards.
interface RegisterForm {
  email: string;
  password: string;
  maxRent: number;
  minSize: number;
  minRooms: number;
  wbsRequired: boolean;
  kiezes: string[];
}

const INITIAL_FORM: RegisterForm = {
  email: "",
  password: "",
  maxRent: 1200,
  minSize: 0,
  minRooms: 0,
  wbsRequired: false,
  kiezes: [],
};

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<RegisterForm>(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [regToken, setRegToken] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // After the Telegram link is shown, wait for the bot to finalize the registration.
  useEffect(() => {
    if (!regToken) return;

    const startedAt = Date.now();
    let done = false;
    const interval = setInterval(async () => {
      if (done) return;
      if (Date.now() - startedAt > VERIFY_TIMEOUT_MS) {
        done = true;
        clearInterval(interval);
        setIsVerifying(false);
        setRegToken(null);
        setMessage({ type: "error", text: "The verification link expired. Please register again." });
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/check-status?token=${encodeURIComponent(regToken)}`);
        if (!response.ok) return;
        const data = await response.json();
        if (done) return;
        if (!data.finalized) return;

        done = true;
        clearInterval(interval);
        setMessage({ type: "success", text: "Registration complete! Welcome to the Hunt! 🚀" });
        if (data.token) {
          try {
            localStorage.setItem("token", data.token);
          } catch {
            // storage unavailable: the user can still log in manually
          }
          router.push("/dashboard/client");
        } else {
          router.push("/login");
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [regToken, router]);

  const toggleKiez = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      kiezes: prev.kiezes.includes(value) ? prev.kiezes.filter((k) => k !== value) : [...prev.kiezes, value],
    }));
  };

  const validateForm = () => {
    if (!formData.email.includes("@")) {
      return "Please enter a valid email address.";
    }
    if (formData.password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(formData.password)) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!/[0-9]/.test(formData.password)) {
      return "Password must contain at least one number.";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      return "Password must contain at least one special character.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          maxRent: formData.maxRent,
          minSize: formData.minSize,
          minRooms: formData.minRooms,
          wbsRequired: formData.wbsRequired,
          kiezes: formData.kiezes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRegToken(data.token);
        setIsVerifying(true);
        setMessage({ type: "success", text: "Almost there! Now verify your account on Telegram." });
      } else {
        const errorText = await response.text();
        const text = errorText.startsWith("{")
          ? "Please check your details and try again."
          : errorText || "Registration failed. Please try again.";
        setMessage({ type: "error", text });
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
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-emerald-400 transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </a>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-neutral-900/50 backdrop-blur-2xl border border-neutral-800 p-8 md:p-12 rounded-[2rem] shadow-2xl"
        >
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-100 mb-3">
              Join the <span className="text-emerald-500">Hunt</span>
            </h1>
            <p className="text-neutral-400">Set up your profile to start receiving instant alerts.</p>
          </div>

          {/* Global Message Notification */}
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-2xl text-sm font-medium ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
            >
              {message.text}
            </motion.div>
          )}

          {isVerifying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6 p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] text-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 animate-pulse rounded-full" />
                <CheckCircle2 className="relative text-emerald-500" size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-neutral-100">Verify your account</h2>
                <p className="text-neutral-400 text-sm">
                  Click the button below, then press Start in Telegram to finalize your registration.
                </p>
              </div>
              <a
                href={`https://t.me/${BOT_USERNAME}?start=${regToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 text-lg font-bold text-neutral-950 bg-emerald-500 hover:bg-emerald-400 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Send size={20} />
                Open Telegram Bot
              </a>
              <p className="text-xs text-neutral-600">
                We&apos;ll automatically redirect you here once you&apos;ve joined.
              </p>
            </motion.div>
          )}

          {!isVerifying && (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-neutral-200 placeholder:text-neutral-700"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-neutral-200 placeholder:text-neutral-700"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <p className="text-[10px] text-neutral-600 ml-1">
                  Min 8 chars, 1 uppercase, 1 number, 1 special symbol
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Max Budget</label>
                  <span className="text-xs font-mono text-emerald-500">€{formData.maxRent} / mo</span>
                </div>
                <div className="relative flex items-center gap-4">
                  <Euro className="text-neutral-600" size={18} />
                  <input
                    type="range"
                    min="400"
                    max="5000"
                    step="50"
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    value={formData.maxRent}
                    onChange={(e) => setFormData({ ...formData, maxRent: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Min Size</label>
                  <div className="relative">
                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                    <input
                      type="number"
                      min="0"
                      className="w-full pl-12 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-neutral-200"
                      value={formData.minSize}
                      onChange={(e) => setFormData({ ...formData, minSize: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Min Rooms</label>
                  <div className="relative">
                    <Bed className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                    <input
                      type="number"
                      min="0"
                      className="w-full pl-12 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-neutral-200"
                      value={formData.minRooms}
                      onChange={(e) => setFormData({ ...formData, minRooms: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">Preferred Berlin Areas</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, kiezes: [] })}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                      formData.kiezes.length === 0
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                        : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                    }`}
                  >
                    All Berlin
                  </button>
                  {KIEZ_OPTIONS.map((k) => (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => toggleKiez(k.value)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        formData.kiezes.includes(k.value)
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                          : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                      }`}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Home className="text-neutral-600" size={18} />
                  <span className="text-sm text-neutral-400">WBS Required</span>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-emerald-500 rounded"
                  checked={formData.wbsRequired}
                  onChange={(e) => setFormData({ ...formData, wbsRequired: e.target.checked })}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                className={`w-full py-4 text-lg font-bold text-neutral-950 rounded-2xl transition-all shadow-lg mt-4 ${isLoading ? "bg-emerald-300 cursor-not-allowed opacity-70" : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20"}`}
              >
                {isLoading ? "Creating Account..." : "Create My Account"}
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
