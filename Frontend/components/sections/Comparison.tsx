"use client";
import React from "react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";

const COMPARISON = [
  {
    feature: "Filter Management",
    wobistdu: "Interactive Visual Map",
    others: "Complex Text Commands",
  },
  {
    feature: "Market Analytics",
    wobistdu: "Live Velocity Data",
    others: "None",
  },
  {
    feature: "Notification Speed",
    wobistdu: "Instant (< 1s)",
    others: "Delayed (1-5m)",
  },
  {
    feature: "User Onboarding",
    wobistdu: "1-Click Telegram",
    others: "Manual Config",
  },
];

export default function Comparison() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-100 tracking-tight mb-4">
            Why <span className="text-emerald-500">Flat Finder</span>?
          </h2>
          <p className="text-neutral-400">The unfair advantage for the Berlin housing market.</p>
        </div>

        <div className="max-w-3xl mx-auto overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900/50">
                <th className="px-6 py-6 text-neutral-400 font-medium text-sm border-b border-neutral-800">Feature</th>
                <th className="px-6 py-6 text-emerald-400 font-bold text-sm border-b border-neutral-800 text-center">Flat Finder</th>
                <th className="px-6 py-6 text-neutral-500 font-medium text-sm border-b border-neutral-800 text-center">Regular Bots</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {COMPARISON.map((row, i) => (
                <tr key={row.feature} className="group hover:bg-neutral-900/30 transition-colors">
                  <td className="px-6 py-5 text-neutral-300 text-sm font-medium">{row.feature}</td>
                  <td className="px-6 py-5 text-neutral-100 text-sm text-center font-semibold relative">
                    {row.wobistdu}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-emerald-500/20 rounded-lg pointer-events-none" />
                  </td>
                  <td className="px-6 py-5 text-neutral-500 text-sm text-center">{row.others}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
