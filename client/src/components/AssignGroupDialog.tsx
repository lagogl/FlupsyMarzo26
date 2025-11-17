import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { BasketGroup } from '@shared/schema';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Basket {
  id: number;
  physicalNumber: number;
  groupId: number | null;
}

interface AssignGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBasketIds: number[];
  onSuccess?: () => void;
}

export function AssignGroupDialog({ open, onOpenChange, selectedBasketIds, onSuccess }: AssignGroupDialogProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const { toast } = useToast();

  const { data: groups, isLoading: groupsLoading } = useQuery<(BasketGroup & { basketCount: number })[]>({
    queryKey: ['/api/basket-groups'],
    enabled: open
  });

  // Carica i dati dei baskets selezionati per verificare se hanno già gruppi
  const { data: baskets } = useQuery<Basket[]>({
    queryKey: ['/api/baskets?includeAll=true'],
    enabled: open
  });

  // Controlla quali ceste selezionate hanno già un gruppo
  const basketsWithGroups = useMemo(() => {
    if (!baskets) return [];
    return baskets.filter(b => 
      selectedBasketIds.includes(b.id) && b.groupId !== null
    );
  }, [baskets, selectedBasketIds]);

  // Mappa groupId -> nome gruppo per il warning
  const basketsGroupInfo = useMemo(() => {
    if (!basketsWithGroups.length || !groups) return [];
    
    return basketsWithGroups.map(basket => {
      const group = groups.find(g => g.id === basket.groupId);
      return {
        basketNumber: basket.physicalNumber,
        groupName: group?.name || 'Sconosciuto',
        groupColor: group?.color
      };
    });
  }, [basketsWithGroups, groups]);

  const assignMutation = useMutation({
    mutationFn: async (groupId: number | null) => {
      return await apiRequest('/api/basket-groups/assign', {
        method: 'PATCH',
        body: JSON.stringify({
          basketIds: selectedBasketIds,
          groupId
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/baskets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/basket-groups'] });
      onOpenChange(false);
      setSelectedGroupId('');
      toast({
        title: "Assegnazione completata",
        description: `${selectedBasketIds.length} ceste assegnate al gruppo`
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile assegnare le ceste al gruppo",
        variant: "destructive"
      });
    }
  });

  const handleAssign = () => {
    if (!selectedGroupId) {
      toast({
        title: "Seleziona un gruppo",
        description: "Seleziona un gruppo o scegli 'Rimuovi gruppo'",
        variant: "destructive"
      });
      return;
    }

    const groupId = selectedGroupId === 'none' ? null : parseInt(selectedGroupId);
    assignMutation.mutate(groupId);
  };
  
  const handleRemoveFromGroup = () => {
    assignMutation.mutate(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-assign-group">
        <DialogHeader>
          <DialogTitle>Assegna Gruppo</DialogTitle>
          <DialogDescription>
            Assegna {selectedBasketIds.length} ceste selezionate a un gruppo
          </DialogDescription>
        </DialogHeader>

        {/* Warning per ceste già assegnate a gruppi */}
        {basketsGroupInfo.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">
                Attenzione: {basketsGroupInfo.length} {basketsGroupInfo.length === 1 ? 'cesta è già assegnata' : 'ceste sono già assegnate'} ad un gruppo
              </div>
              <div className="text-sm space-y-1">
                {basketsGroupInfo.map((info, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded border"
                      style={{ 
                        backgroundColor: info.groupColor || 'gray',
                        borderColor: info.groupColor || 'gray'
                      }}
                    />
                    <span>Cesta #{info.basketNumber} → {info.groupName}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm font-medium">
                Assegnando ad un nuovo gruppo, verranno automaticamente rimosse dai gruppi attuali.
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          {groupsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger data-testid="select-group">
                <SelectValue placeholder="Seleziona un gruppo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" data-testid="option-remove-group">
                  Rimuovi gruppo
                </SelectItem>
                {groups?.map(group => (
                  <SelectItem 
                    key={group.id} 
                    value={group.id.toString()}
                    data-testid={`option-group-${group.id}`}
                  >
                    <div className="flex items-center gap-2">
                      {group.color && (
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-300" 
                          style={{ backgroundColor: group.color }}
                        />
                      )}
                      <span>{group.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({group.basketCount})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="destructive" 
            onClick={handleRemoveFromGroup}
            disabled={assignMutation.isPending}
            data-testid="button-remove-from-group"
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rimuovendo...
              </>
            ) : (
              'Rimuovi da gruppo'
            )}
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={assignMutation.isPending}
              data-testid="button-cancel"
            >
              Annulla
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedGroupId || assignMutation.isPending}
              data-testid="button-confirm-assign"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assegnando...
                </>
              ) : (
                'Assegna'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
