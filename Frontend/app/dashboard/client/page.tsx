"use client";
import React, { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { MapPin, Euro, Home, Bed, Ruler, LogOut, Bell, Filter, Plus, Trash2, ExternalLink } from "lucide-react";
import { authFetch, clearToken, NotSignedInError } from "../../../lib/api";
import { KIEZ_OPTIONS, kiezLabel } from "../../../lib/kiezOptions";

interface UserFilter {
  id: string;
  maxRent: number;
  minSize: number;
  minRooms: number;
  wbsRequired: boolean;
  kiezes: string[];
}

type FilterForm = Omit<UserFilter, "id">;

interface Match {
  id: string;
  title: string;
  kiez: string;
  rentPrice: number;
  size: number;
  rooms: number;
  hasWbs: boolean;
  externalUrl: string;
  sourceSite: string;
  notifiedAt: string;
}

const NEW_FILTER = "new";

const EMPTY_FILTER: FilterForm = {
  maxRent: 1200,
  minSize: 0,
  minRooms: 0,
  wbsRequired: false,
  kiezes: [],
};

function describeFilter(filter: UserFilter) {
  const where = filter.kiezes.length === 0 ? "All Berlin" : filter.kiezes.map(kiezLabel).join(", ");
  const parts = [where, `up to €${filter.maxRent}`];
  if (filter.minSize > 0) parts.push(`${filter.minSize}+ m²`);
  if (filter.minRooms > 0) parts.push(`${filter.minRooms}+ rooms`);
  return parts.join(" · ");
}

function timeAgo(iso: string) {
  // The backend sends UTC; add the zone when it is missing so the browser does not read it as local time.
  const hasZone = /(Z|[+-]\d\d:\d\d)$/.test(iso);
  const then = new Date(hasZone ? iso : `${iso}Z`).getTime();
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export default function ClientDashboard() {
  const [filters, setFilters] = useState<UserFilter[]>([]);
  const [selectedId, setSelectedId] = useState<string>(NEW_FILTER);
  const [form, setForm] = useState<FilterForm>(EMPTY_FILTER);
  const [matches, setMatches] = useState<Match[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const selectFilter = useCallback((filter: UserFilter | null) => {
    if (!filter) {
      setSelectedId(NEW_FILTER);
      setForm(EMPTY_FILTER);
      return;
    }
    setSelectedId(filter.id);
    setForm({
      maxRent: filter.maxRent,
      minSize: filter.minSize,
      minRooms: filter.minRooms,
      wbsRequired: filter.wbsRequired,
      kiezes: filter.kiezes,
    });
  }, []);

  const loadFilters = useCallback(
    async (selectId?: string) => {
      try {
        const response = await authFetch("/api/filters");
        if (response.ok) {
          const data: UserFilter[] = await response.json();
          setFilters(data);
          selectFilter(data.find((f) => f.id === selectId) ?? data[0] ?? null);
          setFiltersError(false);
        } else if (response.status !== 401) {
          setFiltersError(true);
        }
      } catch (error) {
        if (!(error instanceof NotSignedInError)) {
          console.error("Failed to load filters", error);
          setFiltersError(true);
        }
      } finally {
        setFiltersLoading(false);
      }
    },
    [selectFilter]
  );

  const loadMatches = useCallback(async () => {
    try {
      const response = await authFetch("/api/client/matches");
      if (response.ok) {
        setMatches(await response.json());
        setMatchesError(false);
      } else if (response.status !== 401) {
        setMatchesError(true);
      }
    } catch (error) {
      if (!(error instanceof NotSignedInError)) {
        console.error("Failed to load matches", error);
        setMatchesError(true);
      }
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFilters();
    loadMatches();
  }, [loadFilters, loadMatches]);

  const toggleKiez = (value: string) => {
    setForm((prev) => ({
      ...prev,
      kiezes: prev.kiezes.includes(value) ? prev.kiezes.filter((k) => k !== value) : [...prev.kiezes, value],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    const isNew = selectedId === NEW_FILTER;
    try {
      const response = await authFetch(isNew ? "/api/filters" : `/api/filters/${selectedId}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        const saved: UserFilter = await response.json();
        await loadFilters(saved.id);
        setMessage({ type: "success", text: isNew ? "Filter created!" : "Filter updated!" });
      } else if (response.status === 400) {
        setMessage({ type: "error", text: "Please check your filter values." });
      } else if (response.status !== 401) {
        setMessage({ type: "error", text: "Failed to save the filter." });
      }
    } catch (error) {
      if (!(error instanceof NotSignedInError)) {
        setMessage({ type: "error", text: "Network error occurred." });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedId === NEW_FILTER || !confirm("Delete this filter?")) return;

    setMessage({ type: "", text: "" });
    try {
      const response = await authFetch(`/api/filters/${selectedId}`, { method: "DELETE" });
      if (response.ok) {
        await loadFilters();
        setMessage({ type: "success", text: "Filter deleted." });
      } else if (response.status !== 401) {
        setMessage({ type: "error", text: "Failed to delete the filter." });
      }
    } catch (error) {
      if (!(error instanceof NotSignedInError)) {
        setMessage({ type: "error", text: "Network error occurred." });
      }
    }
  };

  const signOut = () => {
    clearToken();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <Bell className="text-emerald-500" size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">My <span className="text-emerald-500">Hunt</span></h1>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Filter Section */}
          <div className="lg:col-span-1 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-6 rounded-[2rem]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="text-emerald-500" size={20} />
                  <h2 className="text-lg font-bold">My Filters</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    selectFilter(null);
                    setMessage({ type: "", text: "" });
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Plus size={14} />
                  New filter
                </button>
              </div>

              {filtersLoading ? (
                <div className="h-16 bg-neutral-900/50 rounded-2xl animate-pulse border border-neutral-800" />
              ) : filtersError ? (
                <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-red-400">
                  Could not load your filters. Please try again later.
                </div>
              ) : filters.length === 0 ? (
                <p className="text-xs text-neutral-500">No filters yet. Create your first one below.</p>
              ) : (
                <div className="space-y-2">
                  {filters.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        selectFilter(f);
                        setMessage({ type: "", text: "" });
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                        selectedId === f.id
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                          : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      {describeFilter(f)}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-6 rounded-[2rem]"
            >
              <h3 className="text-sm font-bold mb-6">
                {selectedId === NEW_FILTER ? "New filter" : "Edit filter"}
              </h3>

              <form onSubmit={handleSave} className="space-y-6">
                {message.text && (
                  <div className={`p-3 rounded-xl text-xs font-medium ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                    {message.text}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Max Budget</label>
                    <span className="text-xs font-mono text-emerald-500">€{form.maxRent} / mo</span>
                  </div>
                  <div className="relative flex items-center gap-4">
                    <Euro className="text-neutral-600" size={16} />
                    <input
                      type="range"
                      min="400"
                      max="5000"
                      step="50"
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      value={form.maxRent}
                      onChange={(e) => setForm({ ...form, maxRent: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Min Size</label>
                    <div className="relative">
                      <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={14} />
                      <input
                        type="number"
                        min="0"
                        className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                        value={form.minSize}
                        onChange={(e) => setForm({ ...form, minSize: Number(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Min Rooms</label>
                    <div className="relative">
                      <Bed className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={14} />
                      <input
                        type="number"
                        min="0"
                        className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                        value={form.minRooms}
                        onChange={(e) => setForm({ ...form, minRooms: Number(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Areas</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, kiezes: [] })}
                      className={`px-3 py-1 rounded-full text-xs border transition-all ${
                        form.kiezes.length === 0
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
                        className={`px-3 py-1 rounded-full text-xs border transition-all ${
                          form.kiezes.includes(k.value)
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
                    <Home className="text-neutral-600" size={16} />
                    <span className="text-sm text-neutral-400">WBS Required</span>
                  </div>
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-emerald-500 rounded"
                    checked={form.wbsRequired}
                    onChange={(e) => setForm({ ...form, wbsRequired: e.target.checked })}
                  />
                </div>

                <div className="flex gap-3">
                  {selectedId !== NEW_FILTER && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="p-3 text-neutral-500 hover:text-red-400 border border-neutral-800 rounded-xl transition-colors"
                      aria-label="Delete filter"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`flex-1 py-3 font-bold text-neutral-950 rounded-xl transition-all ${isSaving ? "bg-emerald-300 cursor-not-allowed opacity-70" : "bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"}`}
                  >
                    {isSaving ? "Saving..." : selectedId === NEW_FILTER ? "Create Filter" : "Save Filter"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Matches Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight">Matched <span className="text-emerald-500">Flats</span></h2>
              {!matchesLoading && !matchesError && (
                <span className="text-xs text-neutral-500">{matches.length} sent to you</span>
              )}
            </div>

            {matchesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-48 bg-neutral-900/50 rounded-[2rem] animate-pulse border border-neutral-800" />
                ))}
              </div>
            ) : matchesError ? (
              <div className="p-6 rounded-[2rem] border border-red-500/20 bg-red-500/10 text-sm text-red-400">
                Could not load your matches. Please try again later.
              </div>
            ) : matches.length === 0 ? (
              <div className="p-10 rounded-[2rem] border border-neutral-800 bg-neutral-900/50 text-center text-sm text-neutral-500">
                No flats have been sent to you yet. New matches appear here and in Telegram.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matches.map((flat) => (
                  <motion.div
                    key={flat.id}
                    whileHover={{ y: -5 }}
                    className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-[2rem] p-6 shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <h3 className="text-lg font-bold">{flat.title}</h3>
                      <span className="shrink-0 px-3 py-1 bg-neutral-950/80 border border-neutral-700 rounded-full text-emerald-400 text-xs font-bold">
                        {flat.rentPrice > 0 ? `€${flat.rentPrice} / mo` : "Price on request"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-500 text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        {flat.kiez}
                      </div>
                      {flat.size > 0 && (
                        <div className="flex items-center gap-1">
                          <Ruler size={14} />
                          {flat.size} m²
                        </div>
                      )}
                      {flat.rooms > 0 && (
                        <div className="flex items-center gap-1">
                          <Bed size={14} />
                          {flat.rooms} {flat.rooms === 1 ? "room" : "rooms"}
                        </div>
                      )}
                      {flat.hasWbs && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase">
                          WBS
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-6 text-[11px] text-neutral-600">
                      <span>{flat.sourceSite} · {timeAgo(flat.notifiedAt)}</span>
                    </div>

                    <a
                      href={flat.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-neutral-800 hover:bg-emerald-500 hover:text-neutral-950 text-neutral-300 rounded-xl transition-all font-semibold text-sm"
                    >
                      Open ad
                      <ExternalLink size={14} />
                    </a>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
