import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { BasketGroup } from '@shared/schema';
import { Loader2 } from 'lucide-react';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-assign-group">
        <DialogHeader>
          <DialogTitle>Assegna Gruppo</DialogTitle>
          <DialogDescription>
            Assegna {selectedBasketIds.length} ceste selezionate a un gruppo
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
