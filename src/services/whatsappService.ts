import api from './api';
import { WhatsAppMessage } from '../types/api';

export const whatsappService = {
  listByRfq: async (rfqId: number): Promise<WhatsAppMessage[]> => {
    const resp = await api.get<WhatsAppMessage[]>('/whatsapp/messages', { params: { rfq_id: rfqId } });
    return resp.data;
  },
  associate: async (messageId: number, rfqId: number): Promise<WhatsAppMessage> => {
    const resp = await api.post<WhatsAppMessage>(`/whatsapp/messages/${messageId}/associate`, { rfq_id: rfqId });
    return resp.data;
  },
  export: async (rfqId: number): Promise<Blob> => {
    const resp = await api.get(`/whatsapp/messages/${rfqId}/export`, { responseType: 'blob' });
    return resp.data;
  },
  sendRfq: async (payload: { rfq_id: number; counterparty_ids: number[]; template_name: string }) => {
    const resp = await api.post('/whatsapp/send-rfq', payload);
    return resp.data;
  },
};
