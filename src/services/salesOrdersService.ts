import api from './api';
import { OrderStatusUpdate, SalesOrder, SalesOrderCreate, SalesOrderUpdate } from '../types/api';

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

  // Atualizar SO
  update: async (id: number, data: SalesOrderUpdate): Promise<SalesOrder> => {
    const response = await api.put<SalesOrder>(`/sales-orders/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, data: OrderStatusUpdate): Promise<SalesOrder> => {
    const response = await api.put<SalesOrder>(`/sales-orders/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/sales-orders/${id}`);
  },
};
