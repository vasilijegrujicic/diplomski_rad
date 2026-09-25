"use client";
import React from "react";
import { motion } from "motion/react";

const DATA = [
  { kiez: "Mitte", price: "€24.50", time: "12 mins", chance: "High" },
  { kiez: "Kreuzberg", price: "€19.20", time: "3 hours", chance: "Medium" },
  { kiez: "Wedding", price: "€14.80", time: "45 mins", chance: "High" },
  { kiez: "Neukölln", price: "€17.50", time: "1 hour", chance: "Low" },
  { kiez: "Prenzlauer Berg", price: "€22.10", time: "8 mins", chance: "High" },
];

const ChanceBadge = ({ status }: { status: string }) => {
  const styles = {
    High: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    Low: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${styles[status as keyof typeof styles]}`}>
      {status}
    </span>
  );
};

export default function Analytics() {
  return (
    <section id="analytics" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-100 tracking-tight mb-4">
            Berlin Market <span className="text-emerald-500">Live Intel</span>
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto">
            Real-time velocity metrics for the city's most competitive Kiezes. We track every listing the moment it appears.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-x-auto p-1 rounded-3xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-xl shadow-2xl"
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500 text-xs uppercase tracking-widest font-semibold">
                <th className="px-6 py-4">Kiez</th>
                <th className="px-6 py-4">Avg Price / m²</th>
                <th className="px-6 py-4">Time on Market</th>
                <th className="px-6 py-4 text-right">Success Chance</th>
              </tr>
            </thead>
            <tbody className="text-neutral-300">
              {DATA.map((row, i) => (
                <tr
                  key={row.kiez}
                  className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors group"
                >
                  <td className="px-6 py-4 font-medium text-neutral-100">{row.kiez}</td>
                  <td className="px-6 py-4 font-mono">{row.price}</td>
                  <td className="px-6 py-4 text-neutral-400">{row.time}</td>
                  <td className="px-6 py-4 text-right">
                    <ChanceBadge status={row.chance} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
