"use client";
import React from "react";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";

// Dynamically import the Leaflet Map component to disable SSR
const Map = dynamic(() => import("../Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-neutral-900 animate-pulse flex items-center justify-center">
      <span className="text-neutral-500 text-sm font-medium">Loading Live Map...</span>
    </div>
  )
});

export default function Hero() {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-6"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.1] text-neutral-100">
            Flat Finder | Your <span className="text-emerald-500">next flat</span> in Berlin
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 max-w-[60ch] leading-relaxed">
            Stop refreshing portals. Use visual filters to map your dream neighborhood and get instant Telegram alerts the second a flat hits the market.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/login"
              className="px-8 py-4 text-lg font-bold text-neutral-950 bg-emerald-500 hover:bg-emerald-400 rounded-full transition-all active:scale-95 shadow-lg shadow-emerald-500/20 text-center"
            >
              Log In
            </Link>
            <button className="px-8 py-4 text-lg font-semibold text-neutral-300 hover:text-white rounded-full border border-neutral-800 hover:border-neutral-700 transition-all">
              See Live Map
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="relative aspect-[4/3] rounded-3xl border border-neutral-700 bg-neutral-900 shadow-2xl overflow-hidden group">
            <Map />

            {/* Floating Badge */}
            <div className="absolute bottom-6 left-6 z-10 px-3 py-1 bg-neutral-950/90 backdrop-blur-md border border-neutral-700 rounded-full flex items-center gap-2 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Live Tracking Active
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
