import api from './api';
import { OrderStatusUpdate, PurchaseOrder, PurchaseOrderCreate, PurchaseOrderUpdate } from '../types/api';

export const purchaseOrdersService = {
  // Listar todas as POs
  getAll: async (): Promise<PurchaseOrder[]> => {
    const response = await api.get<PurchaseOrder[]>('/purchase-orders');
    return response.data;
  },

  // Buscar PO por ID
  getById: async (id: number): Promise<PurchaseOrder> => {
    const response = await api.get<PurchaseOrder>(`/purchase-orders/${id}`);
    return response.data;
  },

  // Criar nova PO
  create: async (data: PurchaseOrderCreate): Promise<PurchaseOrder> => {
    const response = await api.post<PurchaseOrder>('/purchase-orders', data);
    return response.data;
  },

  // Atualizar PO
  update: async (id: number, data: PurchaseOrderUpdate): Promise<PurchaseOrder> => {
    const response = await api.put<PurchaseOrder>(`/purchase-orders/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, data: OrderStatusUpdate): Promise<PurchaseOrder> => {
    const response = await api.put<PurchaseOrder>(`/purchase-orders/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/purchase-orders/${id}`);
  },
};
