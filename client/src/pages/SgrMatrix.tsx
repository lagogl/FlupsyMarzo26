import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Download, TrendingUp, TrendingDown, Info, Layers, AlertTriangle, LineChart as LineChartIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface SizeRow {
  id: number;
  code: string;
  name: string;
  minAnimalsPerKg: number | null;
  maxAnimalsPerKg: number | null;
  position: number;
}

interface Cell {
  sgrP: number | null;
  countP: number;
  sgrM: number | null;
  countM: number;
  real: number | null;
  estimated: number | null;
  deviation: number | null;
}

interface MatrixResponse {
  monthsIt: string[];
  monthsEn: string[];
  sizes: SizeRow[];
  matrix: Record<string, Record<number, Cell>>;
  details: Record<string, Array<{
    cycleId: number;
    basketPhysicalNumber: number | null;
    state: string;
    fromDate: string;
    toDate: string;
    days: number;
    sgrP: number | null;
    sgrM: number | null;
  }>>;
  summary: {
    totalSegments: number;
    sizesCount: number;
    bestCell: { sizeName: string; month: string; value: number } | null;
    worstCell: { sizeName: string; month: string; value: number } | null;
  };
  availableYears: number[];
  filters: { state: string; year: number | null; flupsyId: number | null };
}

interface Flupsy {
  id: number;
  name: string;
}

// Soglia di divergenza tra SGR-P e SGR-M (punti percentuali) oltre la quale
// la cella è considerata "incoerente" e viene evidenziata.
const DIVERGENCE_THRESHOLD = 1.5;

// Palette colori per le linee del grafico (una per taglia)
const CHART_COLORS = [
  '#2563eb', '#16a34a', '#db2777', '#ea580c', '#7c3aed',
  '#0891b2', '#ca8a04', '#dc2626', '#059669', '#9333ea',
  '#0284c7', '#65a30d',
];

function isDivergent(cell?: Cell): boolean {
  if (!cell || cell.sgrP == null || cell.sgrM == null) return false;
  return Math.abs(cell.sgrP - cell.sgrM) >= DIVERGENCE_THRESHOLD;
}

// Colore heatmap in base al valore SGR (rosso = lento, verde = veloce)
function heatColor(value: number | null): string {
  if (value == null) return 'transparent';
  // Range tipico SGR: 0% (lento) → ~6% (molto veloce)
  const clamped = Math.max(0, Math.min(6, value));
  const ratio = clamped / 6;
  // Da rosso (0) a giallo (0.5) a verde (1)
  let r: number, g: number;
  if (ratio < 0.5) {
    r = 239;
    g = Math.round(68 + (197 - 68) * (ratio / 0.5));
  } else {
    r = Math.round(239 - (239 - 34) * ((ratio - 0.5) / 0.5));
    g = Math.round(197 - (197 - 197) * ((ratio - 0.5) / 0.5));
  }
  return `rgba(${r}, ${g}, 94, 0.28)`;
}

export default function SgrMatrix() {
  const [state, setState] = useState<'all' | 'active' | 'closed'>('all');
  const [year, setYear] = useState<string>('all');
  const [flupsyId, setFlupsyId] = useState<string>('all');
  const [selectedCell, setSelectedCell] = useState<{ sizeId: number; month: number; sizeName: string } | null>(null);
  const [chartMetric, setChartMetric] = useState<'real' | 'sgrP' | 'sgrM'>('real');
  const [chartSizeIds, setChartSizeIds] = useState<number[]>([]);

  const { data: flupsys } = useQuery<Flupsy[]>({ queryKey: ['/api/flupsys'] });

  const queryParams = new URLSearchParams();
  queryParams.set('state', state);
  if (year !== 'all') queryParams.set('year', year);
  if (flupsyId !== 'all') queryParams.set('flupsyId', flupsyId);

  const { data, isLoading } = useQuery<MatrixResponse>({
    queryKey: ['/api/sgr-matrix', state, year, flupsyId],
    queryFn: async () => {
      const res = await fetch(`/api/sgr-matrix?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Errore nel caricamento della matrice SGR');
      return res.json();
    },
  });

  const detailRows = useMemo(() => {
    if (!selectedCell || !data) return [];
    return data.details[`${selectedCell.sizeId}_${selectedCell.month}`] || [];
  }, [selectedCell, data]);

  const divergentCount = useMemo(() => {
    if (!data) return 0;
    let count = 0;
    for (const size of data.sizes) {
      for (let m = 0; m < 12; m++) {
        if (isDivergent(data.matrix[String(size.id)]?.[m])) count++;
      }
    }
    return count;
  }, [data]);

  // Seleziona di default le prime 5 taglie con più dati quando arriva la matrice
  useEffect(() => {
    if (!data || data.sizes.length === 0) {
      setChartSizeIds([]);
      return;
    }
    const ranked = [...data.sizes]
      .map((s) => {
        let samples = 0;
        for (let m = 0; m < 12; m++) {
          const c = data.matrix[String(s.id)]?.[m];
          if (c) samples += Math.max(c.countP, c.countM);
        }
        return { id: s.id, samples };
      })
      .sort((a, b) => b.samples - a.samples)
      .slice(0, 5)
      .map((x) => x.id);
    setChartSizeIds(ranked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Dati per il grafico: una serie per ogni taglia selezionata, lungo i 12 mesi
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.monthsIt.map((mName, m) => {
      const row: Record<string, any> = { mese: mName.substring(0, 3) };
      for (const sizeId of chartSizeIds) {
        const size = data.sizes.find((s) => s.id === sizeId);
        if (!size) continue;
        const cell = data.matrix[String(sizeId)]?.[m];
        row[size.code] = cell ? cell[chartMetric] : null;
      }
      return row;
    });
  }, [data, chartSizeIds, chartMetric]);

  const toggleChartSize = (sizeId: number) => {
    setChartSizeIds((prev) =>
      prev.includes(sizeId) ? prev.filter((id) => id !== sizeId) : [...prev, sizeId]
    );
  };

  const handleExport = () => {
    if (!data) return;
    const rows: any[] = [];
    for (const size of data.sizes) {
      const row: any = { Taglia: size.code, 'Animali/kg': `${size.minAnimalsPerKg ?? ''}–${size.maxAnimalsPerKg ?? ''}` };
      for (let m = 0; m < 12; m++) {
        const cell = data.matrix[String(size.id)]?.[m];
        row[`${data.monthsIt[m]} SGR-P`] = cell?.sgrP ?? '';
        row[`${data.monthsIt[m]} SGR-M`] = cell?.sgrM ?? '';
        row[`${data.monthsIt[m]} Stimato`] = cell?.estimated ?? '';
      }
      rows.push(row);
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matrice SGR');
    XLSX.writeFile(wb, 'matrice_sgr_reale.xlsx');
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold">Matrice SGR Reale</h1>
            <Badge variant="outline" className="border-amber-400 text-amber-600 bg-amber-50">BETA</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            SGR reale calcolato dalle operazioni di tutti i cicli (aperti e chiusi), per taglia e mese.
            Ogni cella mostra <strong>SGR-P</strong> (peso) e <strong>SGR-M</strong> (animali/kg) affiancati.
          </p>
        </div>
        <Button onClick={handleExport} disabled={!data} variant="outline" data-testid="button-export">
          <Download className="h-4 w-4 mr-2" /> Esporta Excel
        </Button>
      </div>

      {/* Filtri */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Cicli</label>
              <Select value={state} onValueChange={(v) => setState(v as any)}>
                <SelectTrigger data-testid="select-state"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti (aperti + chiusi)</SelectItem>
                  <SelectItem value="active">Solo aperti</SelectItem>
                  <SelectItem value="closed">Solo chiusi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Anno</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger data-testid="select-year"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli anni</SelectItem>
                  {(data?.availableYears || []).map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">FLUPSY</label>
              <Select value={flupsyId} onValueChange={setFlupsyId}>
                <SelectTrigger data-testid="select-flupsy"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i FLUPSY</SelectItem>
                  {(flupsys || []).map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiche riassuntive */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Segmenti analizzati</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{data.summary.totalSegments}</p><p className="text-xs text-muted-foreground">{data.summary.sizesCount} taglie con dati</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4 text-green-600" /> Crescita migliore</CardTitle></CardHeader>
            <CardContent>
              {data.summary.bestCell ? (
                <><p className="text-2xl font-bold text-green-600">{data.summary.bestCell.value}%</p><p className="text-xs text-muted-foreground">{data.summary.bestCell.sizeName} · {data.summary.bestCell.month}</p></>
              ) : <p className="text-muted-foreground">—</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingDown className="h-4 w-4 text-red-600" /> Crescita peggiore</CardTitle></CardHeader>
            <CardContent>
              {data.summary.worstCell ? (
                <><p className="text-2xl font-bold text-red-600">{data.summary.worstCell.value}%</p><p className="text-xs text-muted-foreground">{data.summary.worstCell.sizeName} · {data.summary.worstCell.month}</p></>
              ) : <p className="text-muted-foreground">—</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Matrice */}
      <Card>
        <CardHeader>
          <CardTitle>Matrice Taglia × Mese</CardTitle>
          <CardDescription>
            P = SGR Peso · M = SGR Misura (animali/kg). Clicca una cella per il dettaglio dei segmenti.
            Δ = scostamento medio reale vs valore stimato (seed biologico).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : !data || data.sizes.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2" />
              Nessun dato SGR disponibile per i filtri selezionati.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-background z-10 border p-2 text-left min-w-[110px]">Taglia</th>
                    {data.monthsIt.map((m) => (
                      <th key={m} className="border p-1 text-center min-w-[72px] font-medium">{m.substring(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.sizes.map((size) => (
                    <tr key={size.id}>
                      <td className="sticky left-0 bg-background z-10 border p-2 font-semibold">
                        <div>{size.code}</div>
                        <div className="text-[10px] text-muted-foreground font-normal">
                          {size.minAnimalsPerKg?.toLocaleString('it-IT')}–{size.maxAnimalsPerKg?.toLocaleString('it-IT')}
                        </div>
                      </td>
                      {data.monthsIt.map((_, m) => {
                        const cell = data.matrix[String(size.id)]?.[m];
                        const hasReal = cell && (cell.sgrP != null || cell.sgrM != null);
                        const divergent = isDivergent(cell);
                        return (
                          <td
                            key={m}
                            className={`border p-1 text-center align-top ${hasReal ? 'cursor-pointer hover:ring-2 hover:ring-purple-400' : ''} ${divergent ? 'ring-2 ring-inset ring-amber-500' : ''}`}
                            style={{ backgroundColor: heatColor(cell?.real ?? null) }}
                            onClick={() => hasReal && setSelectedCell({ sizeId: size.id, month: m, sizeName: size.code })}
                            data-testid={`cell-${size.id}-${m}`}
                            title={divergent ? `Incoerenza: P e M differiscono di ${Math.abs((cell!.sgrP! - cell!.sgrM!)).toFixed(1)} punti` : undefined}
                          >
                            {cell ? (
                              <div className="space-y-0.5">
                                <div className="flex justify-center items-center gap-1">
                                  <span className="font-semibold text-blue-700" title="SGR Peso">
                                    P {cell.sgrP != null ? cell.sgrP.toFixed(1) : '–'}
                                  </span>
                                  <span className="text-muted-foreground">/</span>
                                  <span className="font-semibold text-emerald-700" title="SGR Misura">
                                    M {cell.sgrM != null ? cell.sgrM.toFixed(1) : '–'}
                                  </span>
                                  {divergent && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />}
                                </div>
                                {(cell.countP > 0 || cell.countM > 0) && (
                                  <div className="text-[9px] text-muted-foreground">
                                    n={Math.max(cell.countP, cell.countM)}
                                  </div>
                                )}
                                {cell.deviation != null && (
                                  <div className={`text-[9px] font-medium ${cell.deviation >= 0 ? 'text-green-600' : 'text-red-600'}`} title="Scostamento vs stimato">
                                    Δ {cell.deviation >= 0 ? '+' : ''}{cell.deviation.toFixed(1)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40">·</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="font-semibold text-blue-700">P</span> = SGR Peso (peso medio)</span>
                <span className="flex items-center gap-1"><span className="font-semibold text-emerald-700">M</span> = SGR Misura (animali/kg)</span>
                <span className="flex items-center gap-1"><span className="font-medium">Δ</span> = reale − stimato</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: heatColor(0.5) }} /> lento</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: heatColor(5.5) }} /> veloce</span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  P e M divergono ≥ {DIVERGENCE_THRESHOLD} punti (dato da verificare)
                  {divergentCount > 0 && <span className="font-medium text-amber-600">— {divergentCount} {divergentCount === 1 ? 'cella' : 'celle'}</span>}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grafico lineare */}
      {data && data.sizes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5 text-purple-600" /> Andamento per mese
                </CardTitle>
                <CardDescription>
                  Una linea per taglia lungo i 12 mesi. Seleziona la metrica e le taglie da confrontare.
                </CardDescription>
              </div>
              <div className="w-full md:w-48">
                <Select value={chartMetric} onValueChange={(v) => setChartMetric(v as any)}>
                  <SelectTrigger data-testid="select-chart-metric"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real">SGR Reale (media P/M)</SelectItem>
                    <SelectItem value="sgrP">SGR-P (peso)</SelectItem>
                    <SelectItem value="sgrM">SGR-M (animali/kg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Selettore taglie */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {data.sizes.map((size, idx) => {
                const active = chartSizeIds.includes(size.id);
                const color = CHART_COLORS[chartSizeIds.indexOf(size.id) % CHART_COLORS.length];
                return (
                  <button
                    key={size.id}
                    onClick={() => toggleChartSize(size.id)}
                    data-testid={`chart-size-${size.id}`}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${active ? 'text-white border-transparent' : 'text-muted-foreground bg-muted/40 hover:bg-muted'}`}
                    style={active ? { backgroundColor: color } : undefined}
                  >
                    {size.code}
                  </button>
                );
              })}
            </div>

            {chartSizeIds.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Seleziona almeno una taglia per visualizzare il grafico.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <RechartsLineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mese" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} label={{ value: 'SGR %/giorno', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                  <Tooltip formatter={(value: any) => [value != null ? `${value}%` : '—', '']} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {chartSizeIds.map((sizeId, idx) => {
                    const size = data.sizes.find((s) => s.id === sizeId);
                    if (!size) return null;
                    return (
                      <Line
                        key={sizeId}
                        type="monotone"
                        dataKey={size.code}
                        stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    );
                  })}
                </RechartsLineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Drill-down */}
      <Dialog open={!!selectedCell} onOpenChange={(o) => !o && setSelectedCell(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Dettaglio segmenti — {selectedCell?.sizeName} · {selectedCell != null ? data?.monthsIt[selectedCell.month] : ''}
            </DialogTitle>
            <DialogDescription>
              Coppie di operazioni consecutive che contribuiscono a questa cella.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Ciclo</th>
                  <th className="p-2 text-left">Cesta</th>
                  <th className="p-2 text-left">Stato</th>
                  <th className="p-2 text-left">Da</th>
                  <th className="p-2 text-left">A</th>
                  <th className="p-2 text-right">Giorni</th>
                  <th className="p-2 text-right">SGR-P</th>
                  <th className="p-2 text-right">SGR-M</th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((d, i) => (
                  <tr key={i} className="border-b hover:bg-muted/40">
                    <td className="p-2">#{d.cycleId}</td>
                    <td className="p-2">{d.basketPhysicalNumber ?? '—'}</td>
                    <td className="p-2">
                      <Badge variant={d.state === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                        {d.state === 'active' ? 'Aperto' : 'Chiuso'}
                      </Badge>
                    </td>
                    <td className="p-2">{d.fromDate}</td>
                    <td className="p-2">{d.toDate}</td>
                    <td className="p-2 text-right">{d.days}</td>
                    <td className="p-2 text-right text-blue-700 font-medium">{d.sgrP != null ? `${d.sgrP.toFixed(2)}%` : '—'}</td>
                    <td className="p-2 text-right text-emerald-700 font-medium">{d.sgrM != null ? `${d.sgrM.toFixed(2)}%` : '—'}</td>
                  </tr>
                ))}
                {detailRows.length === 0 && (
                  <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">Nessun segmento.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
