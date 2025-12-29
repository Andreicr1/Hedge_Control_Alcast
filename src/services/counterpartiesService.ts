import api from './api';
import { Counterparty, CounterpartyPayload } from '../types/api';

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

  create: async (data: CounterpartyPayload): Promise<Counterparty> => {
    const response = await api.post<Counterparty>('/counterparties', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CounterpartyPayload>): Promise<Counterparty> => {
    const response = await api.put<Counterparty>(`/counterparties/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/counterparties/${id}`);
  },
};
