/**
 * AI ENHANCED - TESTING PAGE
 * 
 * Pagina di test per il modulo AI potenziato con conoscenza completa del database.
 * Isolata dal sistema produzione, solo per sperimentazione.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Send, 
  Database, 
  Lightbulb, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Code,
  Table as TableIcon,
  Download,
  FileJson,
  FileSpreadsheet
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";

interface AIResponse {
  success: boolean;
  analysis: string;
  tablesNeeded: string[];
  sqlQuery?: string;
  queryParams?: any[];
  explanation: string;
  insights: string[];
  recommendations: string[];
  metrics?: Record<string, string>;
  error?: string;
  warning?: string;
}

interface HealthCheck {
  status: 'ready' | 'not_configured';
  model: string;
  metadata: {
    tablesDocumented: number;
    queryPatterns: number;
    metricsAvailable: number;
  };
}

type OutputFormat = 'json' | 'table' | 'csv';

export default function AIEnhanced() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('ask');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('table');

  // Health check
  const { data: healthData, isLoading: healthLoading } = useQuery<{ success: boolean } & HealthCheck>({
    queryKey: ['/api/ai-enhanced/health']
  });

  // Database metadata
  const { data: metadataData } = useQuery<{ 
    success: boolean; 
    metadata: {
      tables: string[];
      relationships: Record<string, string[]>;
      keyMetrics: string[];
    } 
  }>({
    queryKey: ['/api/ai-enhanced/metadata'],
    enabled: activeTab === 'metadata'
  });

  // Tables list
  const { data: tablesData } = useQuery<{
    success: boolean;
    count: number;
    tables: Array<{
      name: string;
      description: string;
      category: string;
      fieldsCount: number;
      relationshipsCount: number;
      keyMetrics: string[];
    }>;
  }>({
    queryKey: ['/api/ai-enhanced/tables'],
    enabled: activeTab === 'metadata'
  });

  // Ask question mutation
  const askMutation = useMutation({
    mutationFn: async (q: string) => {
      const res = await apiRequest('/api/ai-enhanced/ask', {
        method: 'POST',
        body: JSON.stringify({
          question: q,
          mode: 'analysis'
        })
      });
      return res;
    },
    onSuccess: (data: AIResponse) => {
      setResponse(data);
      setQueryResult(null);
    }
  });

  // Execute query mutation
  const executeQueryMutation = useMutation({
    mutationFn: async ({ sqlQuery, queryParams }: { sqlQuery: string; queryParams: any[] }) => {
      const res = await apiRequest('/api/ai-enhanced/execute-query', {
        method: 'POST',
        body: JSON.stringify({
          sqlQuery,
          queryParams,
          limit: 100
        })
      });
      return res;
    },
    onSuccess: (data) => {
      setQueryResult(data);
      setOutputFormat('table'); // Reset to default format
    }
  });

  // Ask & Execute mutation (one-shot)
  const askAndExecuteMutation = useMutation({
    mutationFn: async (q: string) => {
      const res = await apiRequest('/api/ai-enhanced/ask-and-execute', {
        method: 'POST',
        body: JSON.stringify({
          question: q,
          executeQuery: true,
          limit: 100
        })
      });
      return res;
    },
    onSuccess: (data: any) => {
      if (data.aiAnalysis) {
        setResponse(data.aiAnalysis);
      }
      if (data.queryResult) {
        setQueryResult(data.queryResult);
        setOutputFormat('table'); // Reset to default format
      }
      setActiveTab('results');
    }
  });

  const handleAsk = () => {
    if (!question.trim()) return;
    askMutation.mutate(question);
  };

  const handleAskAndExecute = () => {
    if (!question.trim()) return;
    askAndExecuteMutation.mutate(question);
  };

  const handleExecuteQuery = () => {
    if (!response?.sqlQuery) return;
    executeQueryMutation.mutate({
      sqlQuery: response.sqlQuery,
      queryParams: response.queryParams || []
    });
  };

  // Export functions
  const downloadAsJSON = () => {
    if (!queryResult?.data) return;
    const blob = new Blob([JSON.stringify(queryResult.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-query-result-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsCSV = () => {
    if (!queryResult?.data || queryResult.data.length === 0) return;
    
    const headers = Object.keys(queryResult.data[0]);
    const csvRows = [
      headers.join(','),
      ...queryResult.data.map((row: any) => 
        headers.map(h => {
          const value = row[h];
          // Escape commas and quotes
          if (value === null || value === undefined) return '';
          const strValue = String(value);
          if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        }).join(',')
      )
    ];
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-query-result-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exampleQuestions = [
    "Quali cestelli crescono più lentamente del previsto?",
    "Quanto posso vendere di taglia TP-2800 il mese prossimo?",
    "Quali FLUPSY hanno la mortalità più alta?",
    "Mostrami i lotti con maggiore utilizzo",
    "Quale operatore è più efficiente?",
    "Trend vendite ultimi 3 mesi per taglia",
    "Cestelli pronti per vagliatura questa settimana",
    "Previsione crescita cestello con più animali"
  ];

  if (healthLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isReady = healthData?.status === 'ready';

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🤖 AI Enhanced - Database Intelligence</h1>
        <p className="text-muted-foreground">
          Sistema AI potenziato con conoscenza completa del database FLUPSY Management System
        </p>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Stato Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              {isReady ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Sistema Pronto</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">API Key Non Configurata</span>
                </>
              )}
            </div>
            {healthData && (
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Modello: <strong>{healthData.model}</strong></span>
                <span>Tabelle: <strong>{healthData.metadata.tablesDocumented}</strong></span>
                <span>Query Patterns: <strong>{healthData.metadata.queryPatterns}</strong></span>
                <span>Metriche: <strong>{healthData.metadata.metricsAvailable}</strong></span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!isReady && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sistema Non Configurato</AlertTitle>
          <AlertDescription>
            Configura la variabile d'ambiente OPENAI_API_KEY con la tua API key DeepSeek per abilitare il sistema.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ask">💬 Fai Domande</TabsTrigger>
          <TabsTrigger value="results">📊 Risultati</TabsTrigger>
          <TabsTrigger value="metadata">🗂️ Database Info</TabsTrigger>
        </TabsList>

        {/* Tab: Ask Questions */}
        <TabsContent value="ask" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fai una domanda sul database</CardTitle>
              <CardDescription>
                L'AI analizzerà la domanda, identificherà le tabelle necessarie e proporrà una query SQL ottimizzata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">La tua domanda</label>
                <Textarea
                  data-testid="input-ai-question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Es: Quali cestelli crescono più lentamente del previsto?"
                  rows={3}
                  disabled={!isReady}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  data-testid="button-ask-ai"
                  onClick={handleAsk}
                  disabled={!question.trim() || !isReady || askMutation.isPending}
                >
                  {askMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizzando...</>
                  ) : (
                    <><Send className="mr-2 h-4 w-4" /> Analizza Domanda</>
                  )}
                </Button>
                <Button
                  data-testid="button-ask-execute"
                  onClick={handleAskAndExecute}
                  disabled={!question.trim() || !isReady || askAndExecuteMutation.isPending}
                  variant="secondary"
                >
                  {askAndExecuteMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eseguendo...</>
                  ) : (
                    <><Database className="mr-2 h-4 w-4" /> Analizza + Esegui Query</>
                  )}
                </Button>
              </div>

              {/* Example Questions */}
              <div>
                <label className="text-sm font-medium mb-2 block">Domande di esempio (clicca per usare)</label>
                <div className="grid grid-cols-2 gap-2">
                  {exampleQuestions.map((eq, idx) => (
                    <Button
                      key={idx}
                      data-testid={`button-example-${idx}`}
                      variant="outline"
                      size="sm"
                      className="justify-start text-left h-auto py-2"
                      onClick={() => setQuestion(eq)}
                      disabled={!isReady}
                    >
                      <span className="text-xs">{eq}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Results */}
        <TabsContent value="results" className="space-y-4">
          {response ? (
            <>
              {/* Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Analisi AI
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Analisi</p>
                    <p className="text-sm text-muted-foreground">{response.analysis}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Tabelle Coinvolte ({response.tablesNeeded.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {response.tablesNeeded.map((table) => (
                        <Badge key={table} variant="secondary">{table}</Badge>
                      ))}
                    </div>
                  </div>
                  {response.sqlQuery && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Query SQL Proposta</p>
                        <Button
                          data-testid="button-execute-query"
                          onClick={handleExecuteQuery}
                          size="sm"
                          disabled={executeQueryMutation.isPending}
                        >
                          {executeQueryMutation.isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eseguendo...</>
                          ) : (
                            <><Code className="mr-2 h-4 w-4" /> Esegui Query</>
                          )}
                        </Button>
                      </div>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                        <code>{response.sqlQuery}</code>
                      </pre>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium mb-1">Spiegazione</p>
                    <p className="text-sm text-muted-foreground">{response.explanation}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Insights */}
              {response.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Insights ({response.insights.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {response.insights.map((insight, idx) => (
                        <li key={idx} className="flex gap-2 text-sm">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {response.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Raccomandazioni ({response.recommendations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {response.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-2 text-sm">
                          <span className="text-green-600 font-bold">✓</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Query Results */}
              {queryResult && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TableIcon className="h-5 w-5" />
                        Risultati Query ({queryResult.rowCount || 0} righe)
                      </CardTitle>
                      {queryResult.success && queryResult.data && queryResult.data.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as OutputFormat)}>
                            <SelectTrigger className="w-[140px]" data-testid="select-output-format">
                              <SelectValue placeholder="Formato" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="table">
                                <div className="flex items-center gap-2">
                                  <TableIcon className="h-4 w-4" />
                                  Tabella
                                </div>
                              </SelectItem>
                              <SelectItem value="json">
                                <div className="flex items-center gap-2">
                                  <FileJson className="h-4 w-4" />
                                  JSON
                                </div>
                              </SelectItem>
                              <SelectItem value="csv">
                                <div className="flex items-center gap-2">
                                  <FileSpreadsheet className="h-4 w-4" />
                                  CSV
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            data-testid="button-download-json"
                            variant="outline"
                            size="sm"
                            onClick={downloadAsJSON}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            JSON
                          </Button>
                          <Button
                            data-testid="button-download-csv"
                            variant="outline"
                            size="sm"
                            onClick={downloadAsCSV}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            CSV
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {queryResult.success ? (
                      queryResult.data && queryResult.data.length > 0 ? (
                        <>
                          {/* Table Format */}
                          {outputFormat === 'table' && (
                            <ScrollArea className="h-[500px] w-full">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    {Object.keys(queryResult.data[0]).map((key) => (
                                      <TableHead key={key} className="font-bold whitespace-nowrap">
                                        {key}
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {queryResult.data.map((row: any, idx: number) => (
                                    <TableRow key={idx} data-testid={`row-result-${idx}`}>
                                      {Object.values(row).map((value: any, cellIdx: number) => (
                                        <TableCell key={cellIdx} className="whitespace-nowrap">
                                          {value === null || value === undefined ? (
                                            <span className="text-muted-foreground italic">null</span>
                                          ) : typeof value === 'object' ? (
                                            <code className="text-xs">{JSON.stringify(value)}</code>
                                          ) : (
                                            String(value)
                                          )}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                          )}

                          {/* JSON Format */}
                          {outputFormat === 'json' && (
                            <ScrollArea className="h-[500px]">
                              <pre className="text-xs bg-muted p-4 rounded">
                                {JSON.stringify(queryResult.data, null, 2)}
                              </pre>
                            </ScrollArea>
                          )}

                          {/* CSV Format */}
                          {outputFormat === 'csv' && (
                            <ScrollArea className="h-[500px]">
                              <pre className="text-xs font-mono bg-muted p-4 rounded">
                                {(() => {
                                  const headers = Object.keys(queryResult.data[0]);
                                  const csvRows = [
                                    headers.join(','),
                                    ...queryResult.data.map((row: any) => 
                                      headers.map(h => {
                                        const value = row[h];
                                        if (value === null || value === undefined) return '';
                                        const strValue = String(value);
                                        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
                                          return `"${strValue.replace(/"/g, '""')}"`;
                                        }
                                        return strValue;
                                      }).join(',')
                                    )
                                  ];
                                  return csvRows.join('\n');
                                })()}
                              </pre>
                            </ScrollArea>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Nessun risultato trovato</p>
                        </div>
                      )
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Errore Esecuzione Query</AlertTitle>
                        <AlertDescription>{queryResult.error}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessun risultato ancora. Fai una domanda nella tab "Fai Domande".</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Metadata */}
        <TabsContent value="metadata" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Schema - FLUPSY Management System</CardTitle>
              <CardDescription>
                Informazioni complete sulle {tablesData?.count || 0} tabelle documentate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tablesData && (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {['Core', 'Operations', 'Screening', 'Sales', 'Analytics', 'Sync', 'Config'].map((category) => {
                      const categoryTables = tablesData.tables.filter(t => t.category === category);
                      if (categoryTables.length === 0) return null;

                      return (
                        <div key={category}>
                          <h3 className="font-bold text-lg mb-3">{category} ({categoryTables.length})</h3>
                          <div className="space-y-3">
                            {categoryTables.map((table) => (
                              <div key={table.name} className="border rounded p-3 bg-muted/30">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-sm">{table.name}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">{table.description}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {table.fieldsCount} campi
                                  </Badge>
                                </div>
                                {table.keyMetrics.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium mb-1">Metriche chiave:</p>
                                    <ul className="text-xs text-muted-foreground space-y-1">
                                      {table.keyMetrics.slice(0, 3).map((metric, idx) => (
                                        <li key={idx}>• {metric}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <Separator className="my-4" />
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {metadataData && (
            <Card>
              <CardHeader>
                <CardTitle>Relazioni Database</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metadataData.metadata.relationships).map(([key, path]) => (
                    <div key={key} className="border-l-4 border-blue-500 pl-3">
                      <h4 className="font-semibold text-sm capitalize">{key.replace(/_/g, ' ')}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {path.join(' → ')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
