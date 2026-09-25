"use client";
import React from "react";
import { motion } from "motion/react";
import { Map, Filter, Bell } from "lucide-react";

const FEATURES = [
  {
    title: "Scan Market Map",
    desc: "Visualise every available flat on a high-res Berlin map. No more endless scrolling through lists.",
    icon: Map,
    size: "col-span-1 lg:col-span-2",
  },
  {
    title: "Set Visual Filters",
    desc: "Draw your perfect zone. Filter by floor, balcony, or light exposure using a visual builder.",
    icon: Filter,
    size: "col-span-1",
  },
  {
    title: "Get Telegram Alerts",
    desc: "Notifications hit your phone in milliseconds. Be the first to message the landlord.",
    icon: Bell,
    size: "col-span-1",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-neutral-900/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-100 tracking-tight">
            The <span className="text-emerald-500">Fastest</span> Way to Find a Flat
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`p-8 rounded-3xl border border-neutral-800 bg-neutral-950 hover:border-emerald-500/30 transition-all group ${f.size}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                <f.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-neutral-100 mb-3">{f.title}</h3>
              <p className="text-neutral-400 leading-relaxed max-w-md">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
