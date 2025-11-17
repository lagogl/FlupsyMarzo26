import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertBasketGroupSchema, type BasketGroup } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, FolderOpen, Palette } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = insertBasketGroupSchema.extend({
  name: z.string().min(1, "Il nome del gruppo è obbligatorio"),
  purpose: z.string().optional(),
  color: z.string().optional(),
  highlightOrder: z.number().optional()
});

type FormData = z.infer<typeof formSchema>;

interface BasketGroupWithCount extends BasketGroup {
  basketCount: number;
}

export default function BasketGroups() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<BasketGroupWithCount | null>(null);
  const { toast } = useToast();

  const { data: groups, isLoading } = useQuery<BasketGroupWithCount[]>({
    queryKey: ['/api/basket-groups']
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      purpose: '',
      color: '#3b82f6',
      highlightOrder: 0
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest('/api/basket-groups', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/basket-groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/baskets'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Gruppo creato",
        description: "Il gruppo ceste è stato creato con successo"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare il gruppo",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormData> }) => {
      return await apiRequest(`/api/basket-groups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/basket-groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/baskets'] });
      setEditingGroup(null);
      form.reset();
      toast({
        title: "Gruppo aggiornato",
        description: "Il gruppo ceste è stato aggiornato con successo"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare il gruppo",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/basket-groups/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/basket-groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/baskets'] });
      toast({
        title: "Gruppo eliminato",
        description: "Il gruppo e le sue associazioni sono stati rimossi"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare il gruppo",
        variant: "destructive"
      });
    }
  });

  const handleCreate = () => {
    setEditingGroup(null);
    form.reset({
      name: '',
      purpose: '',
      color: '#3b82f6',
      highlightOrder: 0
    });
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (group: BasketGroupWithCount) => {
    setEditingGroup(group);
    form.reset({
      name: group.name,
      purpose: group.purpose || '',
      color: group.color || '#3b82f6',
      highlightOrder: group.highlightOrder || 0
    });
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = (data: FormData) => {
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gruppi Ceste</h1>
          <p className="text-muted-foreground mt-1">
            Organizza le ceste in gruppi per esigenze operative specifiche
          </p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-group">
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Gruppo
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(group => (
            <Card key={group.id} data-testid={`card-group-${group.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {group.color && (
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300" 
                          style={{ backgroundColor: group.color }}
                          data-testid={`color-indicator-${group.id}`}
                        />
                      )}
                      <CardTitle className="text-lg" data-testid={`text-group-name-${group.id}`}>
                        {group.name}
                      </CardTitle>
                    </div>
                    {group.purpose && (
                      <CardDescription className="mt-2" data-testid={`text-group-purpose-${group.id}`}>
                        {group.purpose}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(group)}
                      data-testid={`button-edit-${group.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          data-testid={`button-delete-${group.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminare il gruppo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Il gruppo "{group.name}" sarà eliminato e tutte le ceste associate 
                            ({group.basketCount}) saranno rimosse dal gruppo. 
                            Le ceste non saranno eliminate, solo l'associazione.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid={`button-cancel-delete-${group.id}`}>
                            Annulla
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(group.id)}
                            data-testid={`button-confirm-delete-${group.id}`}
                          >
                            Elimina
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground" data-testid={`text-basket-count-${group.id}`}>
                    {group.basketCount} {group.basketCount === 1 ? 'cesta' : 'ceste'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              Nessun gruppo creato ancora
            </p>
            <Button onClick={handleCreate} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Crea il primo gruppo
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-edit-group">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Modifica Gruppo' : 'Nuovo Gruppo Ceste'}
            </DialogTitle>
            <DialogDescription>
              {editingGroup 
                ? 'Modifica le informazioni del gruppo' 
                : 'Crea un nuovo gruppo per organizzare le ceste'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Gruppo *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="es. Pronti per vendita" 
                        {...field}
                        data-testid="input-group-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scopo/Descrizione</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="es. Ceste selezionate per vendita cliente ABC"
                        rows={3}
                        {...field}
                        data-testid="input-group-purpose"
                      />
                    </FormControl>
                    <FormDescription>
                      Descrizione opzionale dello scopo del gruppo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colore Distintivo</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          type="color" 
                          className="w-20 h-10 cursor-pointer"
                          {...field}
                          data-testid="input-group-color"
                        />
                      </FormControl>
                      <Input 
                        type="text"
                        placeholder="#3b82f6"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="flex-1"
                        data-testid="input-group-color-hex"
                      />
                    </div>
                    <FormDescription>
                      Colore per evidenziare visivamente il gruppo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel-form"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-form"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : (editingGroup ? 'Aggiorna' : 'Crea')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
