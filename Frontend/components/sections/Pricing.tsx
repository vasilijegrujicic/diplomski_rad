"use client";
import React from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    features: ["10 Free Alerts", "Basic Map Filters", "Telegram Integration"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "7-Day Sprint",
    price: "€19",
    features: ["Unlimited Alerts", "Advanced Visual Filters", "Priority Processing", "Kiez Analytics"],
    cta: "Go Fast",
    highlighted: false,
  },
  {
    name: "30-Day Marathon",
    price: "€49",
    features: ["Unlimited Alerts", "Advanced Visual Filters", "Priority Processing", "Kiez Analytics", "Direct Landlord Tips"],
    cta: "Secure Your Home",
    highlighted: true,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-neutral-900/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-100 tracking-tight mb-4">
            Simple, <span className="text-emerald-500">Fair</span> Pricing
          </h2>
          <p className="text-neutral-400">Choose the sprint that matches your urgency.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative p-8 rounded-3xl border transition-all ${
                plan.highlighted
                  ? "bg-neutral-900 border-emerald-500 shadow-2xl shadow-emerald-500/10 scale-105 z-10"
                  : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-neutral-950 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-neutral-100 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-neutral-100">{plan.price}</span>
                  {plan.price !== "Free" && <span className="text-neutral-500 text-sm">/ period</span>}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-neutral-400">
                    <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 px-4 rounded-xl font-bold transition-all active:scale-95 ${
                  plan.highlighted
                    ? "bg-emerald-500 text-neutral-950 hover:bg-emerald-400"
                    : "bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
