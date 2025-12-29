import api from './api';

export interface NetExposureRow {
  product: string;
  period: string;
  gross_active: number;
  gross_passive: number;
  hedged: number;
  net: number;
}

export const netExposureService = {
  getAll: async (product?: string, period?: string): Promise<NetExposureRow[]> => {
    const resp = await api.get<NetExposureRow[]>(`/net-exposure`, { params: { product, period } });
    return resp.data;
  },
};
