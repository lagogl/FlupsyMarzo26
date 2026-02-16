import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, MapPin, Thermometer, Droplets, Wind, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface BuoyReading {
  temperatura?: number;
  ph?: number;
  salinita?: number;
  ossigenoMgL?: number;
  ossigenoSat?: number;
  torbidita?: number;
  clorofilla?: number;
  livelloMare?: number;
  conducibilita?: number;
}

interface BuoyStation {
  id: string;
  nome: string;
  lat: number;
  lon: number;
  comune?: string;
  provincia?: string;
  fonte: "ARPAE" | "ARPAV";
  attiva: boolean;
  ultimaLettura?: BuoyReading;
  timestamp?: string;
}

interface BuoyResponse {
  success: boolean;
  arpaeCount: number;
  arpavCount: number;
  stations: BuoyStation[];
}

function getMarkerColor(station: BuoyStation): string {
  if (station.fonte === "ARPAE") return "#22c55e";
  if (station.fonte === "ARPAV") return "#22d3ee";
  return "#6b7280";
}

function getMarkerRadius(_station: BuoyStation): number {
  return 6;
}

function formatTimestamp(ts?: string): string {
  if (!ts) return "N/D";
  try {
    const d = new Date(ts);
    return d.toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

function FlyToStation({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 11, { duration: 1 });
  }, [lat, lon, map]);
  return null;
}

function StationDetail({ station }: { station: BuoyStation }) {
  const r = station.ultimaLettura;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getMarkerColor(station) }}
          />
          <span className="font-bold text-white text-sm">{station.nome}</span>
        </div>
        <Badge
          variant="outline"
          className={
            station.fonte === "ARPAE"
              ? "text-orange-400 border-orange-400 text-[10px]"
              : "text-cyan-400 border-cyan-400 text-[10px]"
          }
        >
          {station.fonte}
        </Badge>
      </div>

      {r ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {r.temperatura != null && (
            <>
              <span className="text-gray-400">Temperatura</span>
              <span className="text-orange-300 font-semibold text-right">
                {r.temperatura.toFixed(1)}°C
              </span>
            </>
          )}
          {r.ph != null && (
            <>
              <span className="text-gray-400">pH</span>
              <span className="text-blue-300 font-semibold text-right">
                {r.ph.toFixed(1)}
              </span>
            </>
          )}
          {r.salinita != null && (
            <>
              <span className="text-gray-400">Salinità</span>
              <span className="text-emerald-300 font-semibold text-right">
                {r.salinita.toFixed(1)}‰
              </span>
            </>
          )}
          {r.ossigenoMgL != null && (
            <>
              <span className="text-gray-400">O₂ disciolto</span>
              <span className="text-sky-300 font-semibold text-right">
                {r.ossigenoMgL.toFixed(2)} mg/l
              </span>
            </>
          )}
          {r.ossigenoSat != null && (
            <>
              <span className="text-gray-400">O₂ saturaz.</span>
              <span className="text-sky-300 font-semibold text-right">
                {r.ossigenoSat.toFixed(1)}%
              </span>
            </>
          )}
          {r.torbidita != null && (
            <>
              <span className="text-gray-400">Torbidità</span>
              <span className="text-yellow-300 font-semibold text-right">
                {r.torbidita.toFixed(1)} NTU
              </span>
            </>
          )}
          {r.clorofilla != null && (
            <>
              <span className="text-gray-400">Clorofilla a</span>
              <span className="text-green-300 font-semibold text-right">
                {r.clorofilla.toFixed(1)} µg/L
              </span>
            </>
          )}
          {r.conducibilita != null && (
            <>
              <span className="text-gray-400">Conducibilità</span>
              <span className="text-purple-300 font-semibold text-right">
                {r.conducibilita.toFixed(1)} mS/cm
              </span>
            </>
          )}
          {r.livelloMare != null && (
            <>
              <span className="text-gray-400">Livello mare</span>
              <span className="text-blue-300 font-semibold text-right">
                {r.livelloMare.toFixed(2)} m
              </span>
            </>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-xs">Nessun dato disponibile</p>
      )}

      {station.timestamp && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-500">
          <Clock className="h-3 w-3" />
          {formatTimestamp(station.timestamp)}
        </div>
      )}
    </div>
  );
}

export default function MappaGISLaguna() {
  const [selectedStation, setSelectedStation] = useState<BuoyStation | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lon: number } | null>(null);

  const { data, isLoading, isFetching } = useQuery<BuoyResponse>({
    queryKey: ["/api/buoy-data"],
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  const stations = data?.stations || [];
  const arpaeStations = useMemo(() => stations.filter((s) => s.fonte === "ARPAE"), [stations]);
  const arpavStations = useMemo(() => stations.filter((s) => s.fonte === "ARPAV"), [stations]);

  const handleRefresh = async () => {
    try {
      await apiRequest("/api/buoy-data/refresh", { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["/api/buoy-data"] });
    } catch (e) {
      console.error("Refresh error:", e);
    }
  };

  const handleStationClick = (station: BuoyStation) => {
    setSelectedStation(station);
    setFlyTo({ lat: station.lat, lon: station.lon });
    setSidebarCollapsed(false);
  };

  const sacGoro = useMemo(
    () =>
      arpaeStations.filter((s) =>
        ["Gorino 2", "Punta Volano", "Manufatto", "Bocca Scanno", "Po di Goro", "Logonovo", "Bellocchio"].some(
          (n) => s.nome.toLowerCase().includes(n.toLowerCase())
        )
      ),
    [arpaeStations]
  );

  const costiera = useMemo(
    () =>
      arpaeStations.filter(
        (s) => !sacGoro.some((sg) => sg.id === s.id)
      ),
    [arpaeStations, sacGoro]
  );

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col bg-gray-950">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-cyan-400" />
          <h1 className="text-white font-bold text-lg">Mappa GIS Laguna</h1>
          <Badge variant="outline" className="text-orange-400 border-orange-500 text-xs">
            ARPAE: {arpaeStations.length}
          </Badge>
          <Badge variant="outline" className="text-cyan-400 border-cyan-500 text-xs">
            ARPAV: {arpavStations.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs hidden md:inline">
            {new Date().toLocaleString("it-IT")}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800 h-7 text-xs"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Aggiorna
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-full bg-gray-950">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <span className="ml-3 text-gray-400">Caricamento stazioni...</span>
            </div>
          ) : (
            <MapContainer
              center={[44.85, 12.35]}
              zoom={9}
              className="h-full w-full"
              style={{ background: "#1a1a2e" }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {flyTo && <FlyToStation lat={flyTo.lat} lon={flyTo.lon} />}
              {stations.map((station) => (
                <CircleMarker
                  key={station.id}
                  center={[station.lat, station.lon]}
                  radius={getMarkerRadius(station)}
                  pathOptions={{
                    fillColor: getMarkerColor(station),
                    fillOpacity: 0.9,
                    color: selectedStation?.id === station.id ? "#ffffff" : getMarkerColor(station),
                    weight: selectedStation?.id === station.id ? 3 : 1.5,
                    opacity: 1,
                  }}
                  eventHandlers={{
                    click: () => handleStationClick(station),
                  }}
                >
                  <Popup>
                    <div className="text-xs min-w-[160px]">
                      <strong>{station.nome}</strong>
                      <span className="ml-1 text-gray-500">({station.fonte})</span>
                      {station.ultimaLettura?.temperatura != null && (
                        <div className="mt-1">
                          Temp: {station.ultimaLettura.temperatura.toFixed(1)}°C
                        </div>
                      )}
                      {station.ultimaLettura?.ph != null && (
                        <div>pH: {station.ultimaLettura.ph.toFixed(1)}</div>
                      )}
                      {station.ultimaLettura?.salinita != null && (
                        <div>Salinità: {station.ultimaLettura.salinita.toFixed(1)}‰</div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>

        <div
          className={`bg-gray-900 border-l border-gray-800 overflow-y-auto transition-all duration-300 ${
            sidebarCollapsed ? "w-0 md:w-10" : "w-full md:w-[340px]"
          } ${sidebarCollapsed ? "hidden md:block" : ""}`}
        >
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex items-center justify-center w-full h-8 bg-gray-800 hover:bg-gray-700 text-gray-400 border-b border-gray-700"
          >
            {sidebarCollapsed ? <ChevronDown className="h-4 w-4 rotate-90" /> : <ChevronUp className="h-4 w-4 -rotate-90" />}
          </button>

          {!sidebarCollapsed && (
            <div className="p-3">
              {selectedStation && (
                <div className="mb-4">
                  <h3 className="text-gray-400 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Thermometer className="h-3 w-3" /> Stazione selezionata
                  </h3>
                  <StationDetail station={selectedStation} />
                </div>
              )}

              {sacGoro.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-gray-400 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Droplets className="h-3 w-3 text-orange-400" /> Sacca di Goro
                    <Badge variant="outline" className="text-orange-400 border-orange-500 text-[9px] ml-auto">
                      ARPAE
                    </Badge>
                  </h3>
                  {sacGoro.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleStationClick(s)}
                      className={`w-full text-left px-3 py-2 rounded-md mb-1 flex items-center justify-between transition-colors ${
                        selectedStation?.id === s.id
                          ? "bg-gray-700 border border-gray-600"
                          : "hover:bg-gray-800"
                      }`}
                    >
                      <span className="text-gray-200 text-xs font-medium">{s.nome}</span>
                      <div className="flex items-center gap-2 text-[10px]">
                        {s.ultimaLettura?.temperatura != null && (
                          <span className="text-orange-300">{s.ultimaLettura.temperatura.toFixed(1)}°C</span>
                        )}
                        {s.ultimaLettura?.ph != null && (
                          <span className="text-blue-300">pH {s.ultimaLettura.ph.toFixed(1)}</span>
                        )}
                        {s.ultimaLettura?.salinita != null && (
                          <span className="text-emerald-300">{s.ultimaLettura.salinita.toFixed(0)}‰</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {costiera.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-gray-400 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Wind className="h-3 w-3 text-orange-400" /> Costa Emilia-Romagna
                    <Badge variant="outline" className="text-orange-400 border-orange-500 text-[9px] ml-auto">
                      ARPAE
                    </Badge>
                  </h3>
                  {costiera.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleStationClick(s)}
                      className={`w-full text-left px-3 py-2 rounded-md mb-1 flex items-center justify-between transition-colors ${
                        selectedStation?.id === s.id
                          ? "bg-gray-700 border border-gray-600"
                          : "hover:bg-gray-800"
                      }`}
                    >
                      <span className="text-gray-200 text-xs font-medium">{s.nome}</span>
                      <div className="flex items-center gap-2 text-[10px]">
                        {s.ultimaLettura?.temperatura != null && (
                          <span className="text-orange-300">{s.ultimaLettura.temperatura.toFixed(1)}°C</span>
                        )}
                        {s.ultimaLettura?.ph != null && (
                          <span className="text-blue-300">pH {s.ultimaLettura.ph.toFixed(1)}</span>
                        )}
                        {s.ultimaLettura?.salinita != null && (
                          <span className="text-emerald-300">{s.ultimaLettura.salinita.toFixed(0)}‰</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {arpavStations.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-gray-400 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Droplets className="h-3 w-3 text-cyan-400" /> Delta del Po
                    <Badge variant="outline" className="text-cyan-400 border-cyan-500 text-[9px] ml-auto">
                      ARPAV
                    </Badge>
                  </h3>
                  {arpavStations.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleStationClick(s)}
                      className={`w-full text-left px-3 py-2 rounded-md mb-1 flex items-center justify-between transition-colors ${
                        selectedStation?.id === s.id
                          ? "bg-gray-700 border border-gray-600"
                          : "hover:bg-gray-800"
                      }`}
                    >
                      <span className="text-gray-200 text-xs font-medium">{s.nome}</span>
                      <div className="flex items-center gap-2 text-[10px]">
                        {s.ultimaLettura?.temperatura != null && (
                          <span className="text-orange-300">{s.ultimaLettura.temperatura.toFixed(1)}°C</span>
                        )}
                        {s.ultimaLettura?.ph != null && (
                          <span className="text-blue-300">pH {s.ultimaLettura.ph.toFixed(1)}</span>
                        )}
                        {s.ultimaLettura?.salinita != null && (
                          <span className="text-emerald-300">{s.ultimaLettura.salinita.toFixed(0)}‰</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="text-[10px] text-gray-600 mt-4 border-t border-gray-800 pt-2">
                Aggiornamento automatico ogni 5 min
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="md:hidden absolute bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-[1000]"
        >
          {sidebarCollapsed ? <ChevronDown className="h-5 w-5 rotate-90" /> : <ChevronUp className="h-5 w-5 -rotate-90" />}
        </button>
      </div>
    </div>
  );
}
