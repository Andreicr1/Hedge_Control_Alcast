import api from './api';
import { Customer, CustomerPayload, CreditCheck, KycDocument } from '../types/api';

export const customersService = {
  // Listar todos os clientes
  getAll: async (): Promise<Customer[]> => {
    const response = await api.get<Customer[]>('/customers');
    return response.data;
  },

  // Buscar cliente por ID
  getById: async (id: number): Promise<Customer> => {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  create: async (data: CustomerPayload): Promise<Customer> => {
    const response = await api.post<Customer>('/customers', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CustomerPayload>): Promise<Customer> => {
    const response = await api.put<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },

  uploadDocument: async (id: number, file: File): Promise<KycDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<KycDocument>(`/customers/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  listDocuments: async (id: number): Promise<KycDocument[]> => {
    const response = await api.get<KycDocument[]>(`/customers/${id}/documents`);
    return response.data;
  },

  runCreditCheck: async (id: number): Promise<CreditCheck> => {
    const response = await api.post<CreditCheck>(`/customers/${id}/credit-check`);
    return response.data;
  },
};
