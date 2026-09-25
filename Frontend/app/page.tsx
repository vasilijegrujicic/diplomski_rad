import Hero from "@/components/sections/Hero";
import Analytics from "@/components/sections/Analytics";
import Features from "@/components/sections/Features";
import Comparison from "@/components/sections/Comparison";
import Pricing from "@/components/sections/Pricing";

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] bg-neutral-950 text-neutral-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="relative">
        <Hero />

        {/* Ambient Background Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10 opacity-50" />

        <Analytics />
        <Features />
        <Comparison />
        <Pricing />
      </div>
    </main>
  );
}
