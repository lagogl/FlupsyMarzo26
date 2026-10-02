import { useState } from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { exportCommercialExcel, exportCommercialPdf, summaryLines } from "@/lib/commercial-availability-export";
import type { FrozenCommercialSummary } from "@shared/commercial-availability";

export function CommercialSummary({ summary, notice }: { summary: FrozenCommercialSummary; notice?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const exportFile = async (kind: "pdf" | "excel") => {
    setPending(true); setError("");
    try { await (kind === "pdf" ? exportCommercialPdf : exportCommercialExcel)(summary); }
    catch (e) { setError(e instanceof Error ? e.message : "Esportazione non riuscita. Riprova."); }
    finally { setPending(false); }
  };
  return <section className="ca-panel"><div className="ca-row"><div><span className="ca-eyebrow">Riepilogo congelato · #{summary.id}</span><h2>{summary.name}</h2></div><div className="ca-actions"><button className="ca-button" disabled={pending} onClick={() => exportFile("pdf")}><FileDown size={15} />PDF</button><button className="ca-button" disabled={pending} onClick={() => exportFile("excel")}><FileSpreadsheet size={15} />Excel</button></div></div><div className="ca-note">Questa copia è immutabile. Modifiche alla bozza e ricalcoli live non cambiano le quantità o le etichette del catalogo storico salvate qui.</div>{notice && <div className="ca-note warning" role="status">{notice}</div>}{error && <div className="ca-note error" role="alert">{error}</div>}{summaryLines(summary).slice(1).map((line, i) => <p key={i} className={line.startsWith("Avviso") || line.includes("senza vincolo ordini") ? "ca-note warning" : ""}>{line}</p>)}</section>;
}