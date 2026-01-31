import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { BasketGroup } from '@shared/schema';
import { Loader2, AlertTriangle, Plus } from 'lucide-react';
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
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#3b82f6');
  const [newGroupPurpose, setNewGroupPurpose] = useState('');
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

  const resetState = () => {
    setSelectedGroupId('');
    setIsCreatingNew(false);
    setNewGroupName('');
    setNewGroupColor('#3b82f6');
    setNewGroupPurpose('');
  };

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/basket-groups', {
        method: 'POST',
        body: JSON.stringify({
          name: newGroupName,
          color: newGroupColor,
          purpose: newGroupPurpose || undefined,
          highlightOrder: 0
        })
      });
      return response;
    },
    onSuccess: async (newGroup: any) => {
      await assignMutation.mutateAsync(newGroup.id);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare il gruppo",
        variant: "destructive"
      });
    }
  });

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
      resetState();
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

        <div className="py-4 space-y-4">
          {!isCreatingNew ? (
            <>
              {groupsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger data-testid="select-group">
                      <SelectValue placeholder="Seleziona un gruppo esistente..." />
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
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsCreatingNew(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crea nuovo gruppo
                  </Button>
                </>
              )}
            </>
          ) : (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Nuovo Gruppo</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreatingNew(false)}
                >
                  Annulla
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="groupName">Nome gruppo *</Label>
                  <Input
                    id="groupName"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Es: Ceste da vagliare"
                  />
                </div>
                <div>
                  <Label htmlFor="groupPurpose">Descrizione (opzionale)</Label>
                  <Input
                    id="groupPurpose"
                    value={newGroupPurpose}
                    onChange={(e) => setNewGroupPurpose(e.target.value)}
                    placeholder="Es: Ceste con mortalità alta da controllare"
                  />
                </div>
                <div>
                  <Label htmlFor="groupColor">Colore</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="groupColor"
                      value={newGroupColor}
                      onChange={(e) => setNewGroupColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border"
                    />
                    <span className="text-sm text-muted-foreground">{newGroupColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          {!isCreatingNew && (
            <Button 
              variant="destructive" 
              onClick={handleRemoveFromGroup}
              disabled={assignMutation.isPending || createGroupMutation.isPending}
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
          )}
          {isCreatingNew && <div />}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                onOpenChange(false);
                resetState();
              }}
              disabled={assignMutation.isPending || createGroupMutation.isPending}
              data-testid="button-cancel"
            >
              Annulla
            </Button>
            {isCreatingNew ? (
              <Button 
                onClick={() => createGroupMutation.mutate()}
                disabled={!newGroupName.trim() || createGroupMutation.isPending || assignMutation.isPending}
                data-testid="button-create-and-assign"
              >
                {(createGroupMutation.isPending || assignMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crea e Assegna'
                )}
              </Button>
            ) : (
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
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
