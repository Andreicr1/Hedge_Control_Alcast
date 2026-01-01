import api from './api';
import { DealPnl } from '../types/api';

export const dealsService = {
  getPnl: async (dealId: number): Promise<DealPnl> => {
    const resp = await api.get<DealPnl>(`/deals/${dealId}/pnl`);
    return resp.data;
  },
};
