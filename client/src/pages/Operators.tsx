import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, Plus, Pencil, Power, PowerOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import OperatorForm from '@/components/OperatorForm';

export default function Operators() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({
    key: 'lastName',
    direction: 'asc'
  });

  // Sort function
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Query operators
  const { data: operators, isLoading } = useQuery({
    queryKey: ['/api/operators'],
  });

  // Create mutation
  const createOperatorMutation = useMutation({
    mutationFn: (newOperator: any) => apiRequest({
      url: '/api/operators',
      method: 'POST',
      body: newOperator
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operators'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Operatore creato",
        description: "L'operatore è stato creato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare l'operatore",
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updateOperatorMutation = useMutation({
    mutationFn: (operator: any) => apiRequest({
      url: `/api/operators/${operator.id}`,
      method: 'PATCH',
      body: operator
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operators'] });
      setEditingOperator(null);
      toast({
        title: "Operatore aggiornato",
        description: "L'operatore è stato aggiornato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare l'operatore",
        variant: "destructive",
      });
    }
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => 
      apiRequest({
        url: `/api/operators/${id}/${active ? 'reactivate' : 'deactivate'}`,
        method: 'PATCH'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operators'] });
      toast({
        title: "Stato aggiornato",
        description: "Lo stato dell'operatore è stato modificato",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile modificare lo stato",
        variant: "destructive",
      });
    }
  });

  // Filter and sort operators
  const filteredAndSortedOperators = (() => {
    // First filter
    const filtered = (operators as any[])?.filter((op: any) => {
      if (searchTerm === '') return true;
      const search = searchTerm.toLowerCase();
      return (
        op.firstName?.toLowerCase().includes(search) ||
        op.lastName?.toLowerCase().includes(search) ||
        op.email?.toLowerCase().includes(search) ||
        op.role?.toLowerCase().includes(search)
      );
    }) || [];

    // Then sort
    const sorted = [...filtered].sort((a: any, b: any) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      if (sortConfig.direction === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

    return sorted;
  })();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Caricamento operatori...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-condensed font-bold text-gray-800 dark:text-gray-100">
            Gestione Operatori
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gestisci le anagrafiche degli operatori per l'assegnazione delle attività
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            data-testid="button-create-operator"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuovo Operatore
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Input
                type="text"
                placeholder="Cerca per nome, cognome, email o ruolo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-operator"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Search className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operators Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th 
                  scope="col" 
                  className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    sortConfig.key === 'lastName' ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
                  }`}
                  onClick={() => requestSort('lastName')}
                >
                  <div className="flex items-center">
                    <span>Cognome</span>
                    {sortConfig.key === 'lastName' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    sortConfig.key === 'firstName' ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
                  }`}
                  onClick={() => requestSort('firstName')}
                >
                  <div className="flex items-center">
                    <span>Nome</span>
                    {sortConfig.key === 'firstName' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Email
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Telefono
                </th>
                <th 
                  scope="col" 
                  className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    sortConfig.key === 'role' ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
                  }`}
                  onClick={() => requestSort('role')}
                >
                  <div className="flex items-center">
                    <span>Ruolo</span>
                    {sortConfig.key === 'role' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Stato
                </th>
                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedOperators.length > 0 ? (
                filteredAndSortedOperators.map((operator: any) => (
                  <tr 
                    key={operator.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    data-testid={`operator-row-${operator.id}`}
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {operator.lastName}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {operator.firstName}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {operator.email || '—'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {operator.phone || '—'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {operator.role || '—'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      <Badge 
                        variant={operator.active ? "default" : "secondary"}
                        className={operator.active ? "bg-green-500" : "bg-gray-400"}
                      >
                        {operator.active ? 'Attivo' : 'Disattivo'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingOperator(operator)}
                          data-testid={`button-edit-${operator.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActiveMutation.mutate({ 
                            id: operator.id, 
                            active: !operator.active 
                          })}
                          disabled={toggleActiveMutation.isPending}
                          data-testid={`button-toggle-${operator.id}`}
                        >
                          {operator.active ? (
                            <PowerOff className="h-4 w-4 text-red-500" />
                          ) : (
                            <Power className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Nessun operatore trovato con i criteri di ricerca' : 'Nessun operatore registrato. Creane uno nuovo!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Operatore</DialogTitle>
          </DialogHeader>
          <OperatorForm
            onSubmit={(data) => createOperatorMutation.mutate(data)}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={createOperatorMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingOperator} onOpenChange={() => setEditingOperator(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Operatore</DialogTitle>
          </DialogHeader>
          <OperatorForm
            initialData={editingOperator}
            onSubmit={(data) => updateOperatorMutation.mutate({ ...data, id: editingOperator.id })}
            onCancel={() => setEditingOperator(null)}
            isLoading={updateOperatorMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
