import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar } from 'lucide-react';

interface SuspiciousScreening {
  id: number;
  selection_number: number;
  date: string;
  purpose: string;
  status: string;
  notes: string | null;
  total_origin: string | number;
  total_destination: string | number;
  mortality: string | number;
  discrepancy_pct: string | number;
}

const fmt = (n: number | string) => {
  const v = typeof n === 'string' ? Number(n) : n;
  return Number.isFinite(v) ? new Intl.NumberFormat('it-IT').format(Math.round(v)) : '—';
};
const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('it-IT'); } catch { return d; }
};

export default function VagliatureSospette() {
  const { data, isLoading, error } = useQuery<{ threshold: number; screenings: SuspiciousScreening[] }>({
    queryKey: ['/api/reports/suspicious-screenings'],
  });

  const screenings = data?.screenings ?? [];
  const threshold = data?.threshold ?? 3;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <AlertTriangle className="w-7 h-7 text-amber-600" />
        <div>
          <h1 className="text-2xl font-bold">Vagliature sospette (storico)</h1>
          <p className="text-sm text-muted-foreground">
            Vagliature già completate con scarto tra animali origine e destinazione ≥ {threshold}%.
            Questi numeri sono già acquisiti nel sistema; questo elenco ne facilita la revisione manuale.
          </p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground mt-4">Caricamento...</p>}
      {error && <p className="text-sm text-destructive mt-4">Errore nel caricamento dei dati.</p>}

      {!isLoading && !error && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">
              {screenings.length === 0
                ? 'Nessuna vagliatura storica supera la soglia.'
                : `${screenings.length} vagliatur${screenings.length === 1 ? 'a sospetta' : 'e sospette'} trovate`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {screenings.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2">Vagliatura</th>
                      <th className="text-left px-3 py-2">Data</th>
                      <th className="text-left px-3 py-2">Scopo</th>
                      <th className="text-right px-3 py-2">Animali origine</th>
                      <th className="text-right px-3 py-2">Animali destinazione</th>
                      <th className="text-right px-3 py-2">Differenza</th>
                      <th className="text-right px-3 py-2">% Scarto</th>
                      <th className="text-left px-3 py-2">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {screenings.map(s => {
                      const pct = Number(s.discrepancy_pct);
                      const severity = pct >= 20 ? 'destructive' : pct >= 10 ? 'default' : 'secondary';
                      return (
                        <tr key={s.id} className="border-t hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">#{s.selection_number}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              {fmtDate(s.date)}
                            </span>
                          </td>
                          <td className="px-3 py-2 capitalize">{s.purpose}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmt(s.total_origin)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmt(s.total_destination)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-red-700">−{fmt(s.mortality)}</td>
                          <td className="px-3 py-2 text-right">
                            <Badge variant={severity as any}>{Number(pct).toFixed(2)}%</Badge>
                          </td>
                          <td className="px-3 py-2 text-xs max-w-md truncate" title={s.notes ?? ''}>
                            {s.notes ?? <span className="text-muted-foreground">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
