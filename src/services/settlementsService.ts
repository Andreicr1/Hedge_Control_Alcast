import api from "./api";
import type { SettlementItem } from "../types/api";

/**
 * Backend esperado (recomendado):
 * - GET /contracts/settlements/today -> SettlementItem[]
 * - GET /contracts/settlements/upcoming?limit=5 -> SettlementItem[]
 */
export const settlementsService = {
  getToday: async (): Promise<SettlementItem[]> => {
    const resp = await api.get<SettlementItem[]>("/contracts/settlements/today");
    return resp.data;
  },
  getUpcoming: async (limit = 5): Promise<SettlementItem[]> => {
    const resp = await api.get<SettlementItem[]>("/contracts/settlements/upcoming", {
      params: { limit },
    });
    return resp.data;
  },
};
