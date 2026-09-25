"use client";
import React from "react";

export default function Footer() {
  return (
    <footer className="py-12 border-t border-neutral-800 bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center font-bold text-neutral-950 text-xs">W</div>
          <span className="text-sm font-bold text-neutral-300">Flat Finder</span>
        </div>

        <div className="flex gap-8 text-xs font-medium text-neutral-500">
          <a href="#" className="hover:text-neutral-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-neutral-300 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-neutral-300 transition-colors">Contact</a>
        </div>

        <p className="text-xs text-neutral-600">
          © {new Date().getFullYear()} Flat Finder Berlin. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
