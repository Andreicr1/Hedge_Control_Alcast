import api from './api';
import {
  Rfq,
  RfqCreate,
  RfqUpdate,
  RfqQuoteCreate,
  RfqQuote,
  RfqPreviewRequest,
  RfqPreviewResponse,
} from '../types/api';

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

  update: async (id: number, data: RfqUpdate): Promise<Rfq> => {
    const response = await api.put<Rfq>(`/rfqs/${id}`, data);
    return response.data;
  },

  // Enviar RFQ
  send: async (id: number): Promise<void> => {
    await api.post(`/rfqs/${id}/send`);
  },

  addQuote: async (id: number, quote: RfqQuoteCreate): Promise<RfqQuote> => {
    const response = await api.post<RfqQuote>(`/rfqs/${id}/quotes`, quote);
    return response.data;
  },

  preview: async (payload: RfqPreviewRequest): Promise<RfqPreviewResponse> => {
    const response = await api.post<RfqPreviewResponse>('/rfqs/preview', payload);
    return response.data;
  },
};
