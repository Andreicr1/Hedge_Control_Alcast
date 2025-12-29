import api from './api';
import { Rfq, RfqCreate } from '../types/api';

export const rfqsService = {
  // Listar todas as RFQs
  getAll: async (): Promise<Rfq[]> => {
    const response = await api.get<Rfq[]>('/rfqs');
    return response.data;
  },

  // Buscar RFQ por ID
  getById: async (id: number): Promise<Rfq> => {
    const response = await api.get<Rfq>(`/rfqs/${id}`);
    return response.data;
  },

  // Criar nova RFQ
  create: async (data: RfqCreate): Promise<Rfq> => {
    const response = await api.post<Rfq>('/rfqs', data);
    return response.data;
  },

  // Enviar RFQ
  send: async (id: number): Promise<void> => {
    await api.post(`/rfq-send/${id}/send`);
  },
};
