"use client";
import React, { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { motion, AnimatePresence } from "motion/react";

// Mock data from C# API
const API_DATA = [
  { kiez: "Mitte", avgRent: "28 €/m²", timeOnMarket: "12 mins" },
  { kiez: "Kreuzberg", avgRent: "24 €/m²", timeOnMarket: "18 mins" },
  { kiez: "Wedding", avgRent: "15 €/m²", timeOnMarket: "45 mins" },
  { kiez: "Neukölln", avgRent: "18 €/m²", timeOnMarket: "22 mins" },
  { kiez: "Charlottenburg", avgRent: "22 €/m²", timeOnMarket: "30 mins" },
  { kiez: "Pankow", avgRent: "17 €/m²", timeOnMarket: "40 mins" },
  { kiez: "Tempelhof", avgRent: "16 €/m²", timeOnMarket: "50 mins" },
  { kiez: "Spandau", avgRent: "14 €/m²", timeOnMarket: "60 mins" },
];

// Using local GeoJSON to prevent 404s and external dependency issues
const BERLIN_GEOJSON_URL = "/berlin-districts.json";

export default function BerlinInteractiveMap() {
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-center bg-transparent"
      onMouseMove={handleMouseMove}
    >
      <div className="w-full h-full min-h-[300px] relative">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 60000,
            center: [13.405, 52.52, 0],
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies
            geography={BERLIN_GEOJSON_URL}
            onLoad={() => setLoaded(true)}
          >
            {({ geographies }) =>
              geographies.map((geo) => {
                const districtName = geo.properties.name || geo.properties.NAME;
                const data = API_DATA.find(d =>
                  districtName?.toLowerCase().includes(d.kiez.toLowerCase()) ||
                  d.kiez.toLowerCase().includes(districtName?.toLowerCase())
                );

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => setHoveredDistrict(data ? { ...data, name: districtName } : null)}
                    onMouseLeave={() => setHoveredDistrict(null)}
                    style={{
                      default: {
                        fill: "#1e293b",
                        stroke: "#334155",
                        strokeWidth: 0.5,
                        outline: "none",
                      },
                      highlight: {
                        fill: "#10B981",
                        stroke: "#10B981",
                        strokeWidth: 1,
                        outline: "none",
                      },
                      hovered: {
                        fill: "#10B981",
                        stroke: "#10B981",
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-tighter">Syncing Local Geo-Data...</span>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {hoveredDistrict && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: mousePos.x + 15,
              top: mousePos.y + 15
            }}
          >
            <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-800 p-3 rounded-xl shadow-2xl min-w-[180px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-100">{hoveredDistrict.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold uppercase">Live</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-500">Avg Rent:</span>
                  <span className="text-neutral-100 font-mono">{hoveredDistrict.avgRent}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-500">On Market:</span>
                  <span className="text-neutral-100 font-mono">{hoveredDistrict.timeOnMarket}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
