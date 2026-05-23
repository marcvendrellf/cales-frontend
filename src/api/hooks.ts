import { useQuery } from "@tanstack/react-query"
import { api } from "@/api/client"
import type { CommodityId } from "@/types"

export function useCommodities() {
  return useQuery({ queryKey: ["commodities"], queryFn: api.listCommodities })
}

export function useCommodity(id: CommodityId) {
  return useQuery({
    queryKey: ["commodity", id],
    queryFn: () => api.getCommodity(id),
  })
}

export function useSignals() {
  return useQuery({ queryKey: ["signals"], queryFn: api.listSignals })
}
