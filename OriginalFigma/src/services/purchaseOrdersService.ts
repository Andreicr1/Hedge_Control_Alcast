import api from './api';
import {
  PurchaseOrder,
  PurchaseOrderCreate,
  OrderStatusUpdate,
} from '../types/api';

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

  // Atualizar status da PO
  updateStatus: async (
    id: number,
    statusUpdate: OrderStatusUpdate
  ): Promise<PurchaseOrder> => {
    const response = await api.post<PurchaseOrder>(
      `/purchase-orders/${id}/status`,
      statusUpdate
    );
    return response.data;
  },
};
