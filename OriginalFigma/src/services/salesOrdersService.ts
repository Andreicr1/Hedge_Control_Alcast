import api from './api';
import {
  SalesOrder,
  SalesOrderCreate,
  OrderStatusUpdate,
} from '../types/api';

export const salesOrdersService = {
  // Listar todas as SOs
  getAll: async (): Promise<SalesOrder[]> => {
    const response = await api.get<SalesOrder[]>('/sales-orders');
    return response.data;
  },

  // Buscar SO por ID
  getById: async (id: number): Promise<SalesOrder> => {
    const response = await api.get<SalesOrder>(`/sales-orders/${id}`);
    return response.data;
  },

  // Criar nova SO
  create: async (data: SalesOrderCreate): Promise<SalesOrder> => {
    const response = await api.post<SalesOrder>('/sales-orders', data);
    return response.data;
  },

  // Atualizar status da SO
  updateStatus: async (
    id: number,
    statusUpdate: OrderStatusUpdate
  ): Promise<SalesOrder> => {
    const response = await api.post<SalesOrder>(
      `/sales-orders/${id}/status`,
      statusUpdate
    );
    return response.data;
  },
};
