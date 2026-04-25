import { LayoutGrid } from "lucide-react";

export default function FlupsyHeatmap() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100 mb-6">
        <LayoutGrid className="h-14 w-14 text-blue-400 mx-auto" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Vista Mappa FLUPSY</h1>
      <p className="text-gray-500 max-w-md">
        Visualizzazione avanzata in sviluppo — mappa termica delle ceste con taglie e densità animali per ogni FLUPSY.
      </p>
    </div>
  );
}
