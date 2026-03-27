"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onSelect: (address: string, lat: number, lng: number) => void;
};

export default function MapPicker({ onSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [geoError, setGeoError] = useState<string>("");

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    setGeoError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "az,en" } }
      );
      const data = await res.json();
      const parts = (data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        .split(", ")
        .slice(0, 4)
        .join(", ");
      setSelected(parts);
      onSelect(parts, lat, lng);
    } catch {
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setSelected(fallback);
      onSelect(fallback, lat, lng);
    } finally {
      setLoading(false);
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setGeoError("Brauzerin geolokasiya dəstəkləmir");
      return;
    }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
          markerRef.current.setLatLng([lat, lng]);
        }
        reverseGeocode(lat, lng);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setGeoError("Konum icazəsi rədd edildi. Brauzerdən icazə verin.");
        } else {
          setGeoError("Konum tapılmadı. Əl ilə seçin.");
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, {
        center: [40.4093, 49.8671],
        zoom: 13,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const customIcon = L.divIcon({
        className: "",
        html: `
          <div style="width:36px;height:44px;display:flex;flex-direction:column;align-items:center;">
            <div style="
              width:36px;height:36px;
              background:#1B4FD8;
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              border:3px solid white;
              box-shadow:0 4px 12px rgba(27,79,216,0.4);
            "></div>
            <div style="width:6px;height:6px;background:#1B4FD8;border-radius:50%;margin-top:2px;"></div>
          </div>
        `,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
      });

      const marker = L.marker([40.4093, 49.8671], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      markerRef.current = marker;
      mapInstanceRef.current = map;

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        reverseGeocode(pos.lat, pos.lng);
      });

      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--gray-200)] shadow-sm">
      {/* Xəritə */}
      <div className="relative">
        <div ref={mapRef} style={{ height: "220px", width: "100%" }} />

        {/* Cari məkan düyməsi — xəritənin üstündə */}
        <button
          onClick={handleLocate}
          disabled={locating}
          className={`
            absolute top-3 left-3 z-[1000] flex items-center gap-2
            px-3 py-2 rounded-xl text-[12px] font-bold
            shadow-md transition-all duration-200 active:scale-95
            ${locating
              ? "bg-white/90 text-[var(--gray-400)] cursor-wait"
              : "bg-white text-[var(--primary)] hover:bg-[var(--primary-bg)] hover:shadow-lg"
            }
          `}
        >
          {locating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              Axtarılır...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" strokeOpacity="0"/>
              </svg>
              Cari məkan
            </>
          )}
        </button>
      </div>

      {/* Xəta mesajı */}
      {geoError && (
        <div className="bg-red-50 px-4 py-2.5 flex items-center gap-2 border-t border-red-100">
          <span className="text-sm">⚠️</span>
          <p className="text-[11px] text-red-600 font-medium">{geoError}</p>
        </div>
      )}

      {/* Seçilmiş ünvan */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-t border-[var(--gray-200)]">
        <div className="w-8 h-8 bg-[var(--primary-bg)] rounded-full flex items-center justify-center shrink-0">
          <span className="text-sm">📍</span>
        </div>
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <p className="text-[12px] text-[var(--gray-400)]">Ünvan axtarılır...</p>
            </div>
          ) : selected ? (
            <p className="text-[12px] text-[var(--navy)] font-medium truncate">{selected}</p>
          ) : (
            <p className="text-[12px] text-[var(--gray-400)]">
              Xəritəyə klik edin, markeri sürükləyin və ya cari məkanı seçin
            </p>
          )}
        </div>
        {selected && (
          <span className="text-[10px] font-bold text-[var(--green)] bg-[var(--green-bg)] px-2 py-0.5 rounded-full shrink-0">
            ✓ Seçildi
          </span>
        )}
      </div>
    </div>
  );
}