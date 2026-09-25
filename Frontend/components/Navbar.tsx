"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { clearToken } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard") ?? false;

  const handleLogout = () => {
    clearToken();
    window.location.href = "/";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between max-w-7xl mx-auto px-6 h-16 backdrop-blur-md bg-neutral-950/50 border-b border-neutral-800">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-neutral-950">W</div>
        <span className="text-xl font-bold tracking-tight text-neutral-100">Flat Finder</span>
      </div>

      {isDashboard ? (
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-semibold text-neutral-100 bg-neutral-800 hover:bg-red-500 rounded-full transition-all active:scale-95"
        >
          Logout
        </button>
      ) : (
        <button
          onClick={() => window.location.href = '/register'}
          className="px-4 py-2 text-sm font-semibold text-neutral-100 bg-emerald-600 hover:bg-emerald-500 rounded-full transition-all active:scale-95"
        >
          Get Started
        </button>
      )}
    </nav>
  );
}
