import api from './api';
import { MarketPrice, MarketPriceCreate } from '../types/api';

export const marketPricesService = {
  create: async (payload: MarketPriceCreate): Promise<MarketPrice> => {
    const resp = await api.post<MarketPrice>('/market-data', payload);
    return resp.data;
  },
  list: async (params?: { symbol?: string; contract_month?: string; source?: string; fx_only?: boolean; latest?: boolean }): Promise<MarketPrice[]> => {
    const resp = await api.get<MarketPrice[]>('/market-data', { params });
    return resp.data;
  },
};
