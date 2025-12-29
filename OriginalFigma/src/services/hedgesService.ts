import api from './api';
import { HedgeTrade } from '../types/api';

export const hedgesService = {
  // Listar todos os hedges
  getAll: async (): Promise<HedgeTrade[]> => {
    const response = await api.get<HedgeTrade[]>('/hedges');
    return response.data;
  },

  // Buscar hedge por ID
  getById: async (id: number): Promise<HedgeTrade> => {
    const response = await api.get<HedgeTrade>(`/hedges/${id}`);
    return response.data;
  },

  // Buscar hedges por PO
  getByPurchaseOrder: async (poId: number): Promise<HedgeTrade[]> => {
    const response = await api.get<HedgeTrade[]>(`/hedges/by-purchase-order/${poId}`);
    return response.data;
  },

  // Buscar hedges por SO
  getBySalesOrder: async (soId: number): Promise<HedgeTrade[]> => {
    const response = await api.get<HedgeTrade[]>(`/hedges/by-sales-order/${soId}`);
    return response.data;
  },
};
