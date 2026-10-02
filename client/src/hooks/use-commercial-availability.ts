import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CommercialInput, CommercialInputs, CommercialResult, FrozenCommercialSummary, SavedCommercialScenario } from "@shared/commercial-availability";

const root = "/api/commercial-availability";
export function useCommercialInputs() {
  return useQuery<CommercialInputs>({ queryKey: [root, "inputs"], queryFn: () => apiRequest(`${root}/inputs`) });
}
export function useCommercialLibrary() {
  const scenarios = useQuery<SavedCommercialScenario[]>({ queryKey: [root, "scenarios"], queryFn: () => apiRequest(`${root}/scenarios`) });
  const summaries = useQuery<FrozenCommercialSummary[]>({ queryKey: [root, "summaries"], queryFn: () => apiRequest(`${root}/summaries`) });
  return { scenarios, summaries };
}
export function useCommercialActions() {
  const cache = useQueryClient();
  const refreshScenarios = () => cache.invalidateQueries({ queryKey: [root, "scenarios"] });
  const simulate = useMutation({ mutationFn: (input: CommercialInput) => apiRequest<CommercialResult>(`${root}/simulate`, "POST", input) });
  const save = useMutation({ mutationFn: ({ id, input }: { id?: number; input: CommercialInput }) => apiRequest<SavedCommercialScenario>(`${root}/scenarios${id ? `/${id}` : ""}`, id ? "PUT" : "POST", input), onSuccess: refreshScenarios });
  const remove = useMutation({ mutationFn: (id: number) => apiRequest(`${root}/scenarios/${id}`, "DELETE"), onSuccess: refreshScenarios });
  const duplicate = useMutation({ mutationFn: (id: number) => apiRequest<SavedCommercialScenario>(`${root}/scenarios/${id}/duplicate`, "POST"), onSuccess: refreshScenarios });
  const replan = useMutation({ mutationFn: (id: number) => apiRequest<SavedCommercialScenario>(`${root}/scenarios/${id}/replan`, "POST"), onSuccess: refreshScenarios });
  const freeze = useMutation({ mutationFn: (input: CommercialInput) => apiRequest<FrozenCommercialSummary>(`${root}/summaries`, "POST", input), onSuccess: () => cache.invalidateQueries({ queryKey: [root, "summaries"] }) });
  return { simulate, save, remove, duplicate, replan, freeze };
}