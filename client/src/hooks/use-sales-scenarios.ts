import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SavedScenario, ScenarioInput, ScenarioInputs, ScenarioProposal, ScenarioResult } from "@shared/sales-scenarios";
import { apiRequest } from "@/lib/queryClient";

const root = "/api/sales-scenarios";
export function useSalesScenarioInputs() {
  return useQuery<ScenarioInputs>({ queryKey: [root, "inputs"], queryFn: () => apiRequest(`${root}/inputs`) });
}
export function useSalesScenarios() {
  return useQuery<SavedScenario[]>({ queryKey: [root], queryFn: () => apiRequest(root) });
}
export function useSalesScenarioActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: [root] });
  const save = useMutation({ mutationFn: ({ id, input }: { id?: number; input: ScenarioInput }) => id ? apiRequest<SavedScenario>(`${root}/${id}`, "PUT", input) : apiRequest<SavedScenario>(root, "POST", input), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: number) => apiRequest(`${root}/${id}`, "DELETE"), onSuccess: refresh });
  const simulate = useMutation({ mutationFn: (input: ScenarioInput) => apiRequest<ScenarioResult>(`${root}/simulate`, "POST", input) });
  const propose = useMutation({ mutationFn: (input: ScenarioInput) => apiRequest<ScenarioProposal>(`${root}/propose`, "POST", input) });
  return { save, remove, simulate, propose };
}