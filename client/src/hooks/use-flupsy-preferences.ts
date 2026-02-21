import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export function useFlupsyPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: menuPrefs } = useQuery({
    queryKey: ['/api/menu-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: { preferredFlupsyIds: [] } };
      const res = await fetch(`/api/menu-preferences/${user.id}`);
      return res.json();
    },
    enabled: !!user?.id,
    staleTime: 60000
  });

  const preferredFlupsyIds: number[] = menuPrefs?.data?.preferredFlupsyIds ?? [];

  const saveMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return apiRequest(`/api/menu-preferences/${user?.id}/preferred-flupsys`, {
        method: 'POST',
        body: JSON.stringify({ preferredFlupsyIds: ids })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-preferences', user?.id] });
    }
  });

  const savePreferredFlupsyIds = (ids: number[]) => {
    saveMutation.mutate(ids);
  };

  const filterFlupsys = <T extends { id: number }>(flupsys: T[]): T[] => {
    if (!preferredFlupsyIds || preferredFlupsyIds.length === 0) return flupsys;
    return flupsys.filter(f => preferredFlupsyIds.includes(f.id));
  };

  return {
    preferredFlupsyIds,
    savePreferredFlupsyIds,
    filterFlupsys,
    hasPreferences: preferredFlupsyIds.length > 0,
    isSaving: saveMutation.isPending
  };
}
