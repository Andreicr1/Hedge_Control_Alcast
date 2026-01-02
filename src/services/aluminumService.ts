import api from "./api";
import type { AluminumHistoryPoint, AluminumQuote, MarketPrice } from "../types/api";

export type AluminumRange = "7d" | "30d" | "1y";

/**
 * Backend esperado (recomendado):
 * - GET /market/aluminum/quote  -> { bid, ask, currency:'USD', unit:'ton', as_of }
 * - GET /market/aluminum/history?range=7d|30d|1y -> { ts, mid, bid?, ask? }[]
 *
 * Fallback (compat com backend atual de market-data):
 * - GET /market-data?symbol=ALUMINUM&latest=true
 * - GET /market-data?symbol=ALUMINUM  (timeseries via as_of)
 */
export const aluminumService = {
  getQuote: async (): Promise<AluminumQuote> => {
    try {
      const resp = await api.get<AluminumQuote>("/market/aluminum/quote");
      return resp.data;
    } catch {
      const resp = await api.get<MarketPrice[]>("/market-data", {
        params: { symbol: "ALUMINUM", latest: true },
      });
      const latest = resp.data?.[0];
      if (!latest) throw new Error("Sem dados de mercado para ALUMINUM");
      return {
        bid: latest.price,
        ask: latest.price,
        currency: "USD",
        unit: "ton",
        as_of: latest.as_of,
        source: latest.source,
      };
    }
  },

  getHistory: async (range: AluminumRange): Promise<AluminumHistoryPoint[]> => {
    try {
      const resp = await api.get<AluminumHistoryPoint[]>("/market/aluminum/history", {
        params: { range },
      });
      return resp.data;
    } catch {
      // Fallback: usa market-data como timeseries (best-effort)
      const resp = await api.get<MarketPrice[]>("/market-data", {
        params: { symbol: "ALUMINUM" },
      });
      const points = (resp.data || [])
        .map((p) => ({ ts: p.as_of, mid: p.price } satisfies AluminumHistoryPoint))
        .sort((a, b) => a.ts.localeCompare(b.ts));
      return points;
    }
  },
};
