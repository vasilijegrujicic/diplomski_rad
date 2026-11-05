"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import { KIEZ_OPTIONS, kiezLabel } from "../lib/kiezOptions";

interface KiezSelectorProps {
  value: string[];
  onChange: (next: string[]) => void;
}

export default function KiezSelector({ value, onChange }: KiezSelectorProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const suggestions = KIEZ_OPTIONS.filter(
    (k) => !value.includes(k.value) && k.label.toLowerCase().includes(query.toLowerCase())
  );

  const addKiez = (kiezValue: string) => {
    onChange([...value, kiezValue]);
    setQuery("");
    setIsOpen(false);
  };

  const removeKiez = (kiezValue: string) => {
    onChange(value.filter((v) => v !== kiezValue));
  };

  return (
    <div className="space-y-2">
      {value.length === 0 ? (
        <p className="text-xs text-neutral-500">All Berlin — search below to narrow it down.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {value.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
            >
              {kiezLabel(v)}
              <button
                type="button"
                onClick={() => removeKiez(v)}
                aria-label={`Remove ${kiezLabel(v)}`}
                className="hover:text-emerald-100"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          placeholder="Search an area (e.g. Kreuzberg)..."
          className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm text-neutral-200 placeholder:text-neutral-700"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        />
        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl">
            {suggestions.map((k) => (
              <button
                key={k.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addKiez(k.value)}
                className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                {k.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
