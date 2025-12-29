import api from './api';
import { Counterparty } from '../types/api';

export const counterpartiesService = {
  // Listar todas as contrapartes
  getAll: async (): Promise<Counterparty[]> => {
    const response = await api.get<Counterparty[]>('/counterparties');
    return response.data;
  },

  // Buscar contraparte por ID
  getById: async (id: number): Promise<Counterparty> => {
    const response = await api.get<Counterparty>(`/counterparties/${id}`);
    return response.data;
  },
};
