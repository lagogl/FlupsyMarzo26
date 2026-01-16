import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, CheckCircle, Package, Waves, Skull, ArrowRight, Calendar, Hash, Scale } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface PendingClosure {
  id: number;
  cycleId: number;
  basketId: number;
  flupsyId: number;
  lotId: number;
  closureDate: string;
  animalCount: number;
  totalWeight: number | null;
  destination: string;
  createdAt: string;
  basketNumber: number;
  flupsyName: string;
  lotSupplier: string;
}

export default function PendingClosures() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDestination, setSelectedDestination] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});

  const { data: pendingClosures = [], isLoading, refetch } = useQuery<PendingClosure[]>({
    queryKey: ['/api/cycles/pending-closures']
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, destination, notes }: { id: number; destination: string; notes?: string }) => {
      return apiRequest(`/api/cycles/pending-closures/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          destination,
          resolvedBy: user?.username || 'Operatore',
          destinationNotes: notes
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Destinazione assegnata",
        description: `Animali assegnati a ${getDestinationLabel(variables.destination)}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cycles/pending-closures'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cycles/pending-closures/count'] });
      setSelectedDestination(prev => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
      setNotes(prev => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message
      });
    }
  });

  const getDestinationLabel = (dest: string) => {
    switch (dest) {
      case 'altra-cesta': return 'Altra Cesta';
      case 'sand-nursery': return 'Sand Nursery';
      case 'mortalita': return 'Mortalità';
      default: return dest;
    }
  };

  const getDestinationIcon = (dest: string) => {
    switch (dest) {
      case 'altra-cesta': return <Package className="h-4 w-4" />;
      case 'sand-nursery': return <Waves className="h-4 w-4" />;
      case 'mortalita': return <Skull className="h-4 w-4" />;
      default: return null;
    }
  };

  const handleResolve = (id: number) => {
    const destination = selectedDestination[id];
    if (!destination) {
      toast({
        variant: "destructive",
        title: "Seleziona destinazione",
        description: "Devi selezionare una destinazione per gli animali"
      });
      return;
    }
    resolveMutation.mutate({ id, destination, notes: notes[id] });
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('it-IT');
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              Chiusure Ciclo Pendenti
            </h1>
            <p className="text-muted-foreground mt-1">
              Animali in attesa di assegnazione destinazione dopo la chiusura del ciclo
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Aggiorna
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : pendingClosures.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold text-center">Nessuna chiusura pendente</h2>
              <p className="text-muted-foreground text-center mt-2">
                Tutti gli animali hanno una destinazione assegnata
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingClosures.map((closure) => (
              <Card key={closure.id} className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        <Hash className="h-3 w-3 mr-1" />
                        Cesta {closure.basketNumber}
                      </Badge>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm font-normal">{closure.flupsyName}</span>
                    </CardTitle>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      In attesa
                    </Badge>
                  </div>
                  <CardDescription>
                    Lotto: {closure.lotSupplier || `#${closure.lotId}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Chiusura: {format(new Date(closure.closureDate), 'dd MMM yyyy', { locale: it })}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground">Animali</div>
                          <div className="text-xl font-bold text-blue-700">
                            {formatNumber(closure.animalCount)}
                          </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Scale className="h-3 w-3" /> Peso
                          </div>
                          <div className="text-xl font-bold text-green-700">
                            {closure.totalWeight ? `${(closure.totalWeight / 1000).toFixed(2)} kg` : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 border-l pl-6">
                      <Label>Destinazione animali</Label>
                      <Select
                        value={selectedDestination[closure.id] || ''}
                        onValueChange={(value) => setSelectedDestination(prev => ({ ...prev, [closure.id]: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona destinazione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="altra-cesta">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-blue-600" />
                              Trasferimento in altra cesta
                            </div>
                          </SelectItem>
                          <SelectItem value="sand-nursery">
                            <div className="flex items-center gap-2">
                              <Waves className="h-4 w-4 text-cyan-600" />
                              Trasferimento a Sand Nursery
                            </div>
                          </SelectItem>
                          <SelectItem value="mortalita">
                            <div className="flex items-center gap-2">
                              <Skull className="h-4 w-4 text-red-600" />
                              Registra come mortalità
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Textarea
                        placeholder="Note opzionali..."
                        value={notes[closure.id] || ''}
                        onChange={(e) => setNotes(prev => ({ ...prev, [closure.id]: e.target.value }))}
                        rows={2}
                      />
                      
                      <Button 
                        onClick={() => handleResolve(closure.id)}
                        disabled={!selectedDestination[closure.id] || resolveMutation.isPending}
                        className="w-full"
                      >
                        {resolveMutation.isPending ? (
                          'Elaborazione...'
                        ) : (
                          <>
                            Conferma destinazione
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                      
                      {selectedDestination[closure.id] === 'mortalita' && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Questa azione aggiornerà le statistiche di mortalità del lotto
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
