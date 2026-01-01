import api from './api';
import { Contract } from '../types/api';

export const contractsService = {
  listByRfq: async (rfqId: number): Promise<Contract[]> => {
    const resp = await api.get<Contract[]>('/contracts', { params: { rfq_id: rfqId } });
    return resp.data;
  },
  listByDeal: async (dealId: number): Promise<Contract[]> => {
    const resp = await api.get<Contract[]>('/contracts', { params: { deal_id: dealId } });
    return resp.data;
  },
  get: async (contractId: string): Promise<Contract> => {
    const resp = await api.get<Contract>(`/contracts/${contractId}`);
    return resp.data;
  },
};
