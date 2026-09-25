"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom Emerald Marker Icon
const emeraldIcon = new L.DivIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-6 h-6 bg-emerald-500/30 rounded-full animate-ping"></div>
      <div class="relative w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-lg"></div>
    </div>
  `,
  className: "custom-marker",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const BERLIN_POINTS = [
  { id: 1, pos: [52.5200, 13.4050], title: "Mitte Hub", price: "€24.50/m²", status: "Hot" },
  { id: 2, pos: [52.4986, 13.3918], title: "Kreuzberg Core", price: "€19.20/m²", status: "Active" },
  { id: 3, pos: [52.5394, 13.3545], title: "Wedding North", price: "€14.80/m²", status: "Underpriced" },
  { id: 4, pos: [52.4850, 13.4450], title: "Neukölln East", price: "€17.50/m²", status: "High Demand" },
  { id: 5, pos: [52.5450, 13.4100], title: "Prenzlauer Berg", price: "€22.10/m²", status: "Exclusive" },
];

export default function Map() {
  return (
    <MapContainer
      center={[52.5200, 13.4050]}
      zoom={12}
      scrollWheelZoom={false}
      className="w-full h-full z-0"
      style={{ background: "#0a0a0a" }}
    >
      {/* Standard OSM Tiles - 100% Free, No API Key, No Watermarks */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {BERLIN_POINTS.map((point) => (
        <Marker key={point.id} position={point.pos} icon={emeraldIcon}>
          <Popup className="custom-popup">
            <div className="p-2 text-neutral-900">
              <h3 className="font-bold text-sm">{point.title}</h3>
              <p className="text-xs text-neutral-600">{point.price}</p>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">{point.status}</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
