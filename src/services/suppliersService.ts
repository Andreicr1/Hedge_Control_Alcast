import api from './api';
import { Supplier, SupplierPayload, KycDocument, CreditCheck } from '../types/api';

export const suppliersService = {
  // Listar todos os fornecedores
  getAll: async (): Promise<Supplier[]> => {
    const response = await api.get<Supplier[]>('/suppliers');
    return response.data;
  },

  // Buscar fornecedor por ID
  getById: async (id: number): Promise<Supplier> => {
    const response = await api.get<Supplier>(`/suppliers/${id}`);
    return response.data;
  },

  create: async (data: SupplierPayload): Promise<Supplier> => {
    const response = await api.post<Supplier>('/suppliers', data);
    return response.data;
  },

  update: async (id: number, data: Partial<SupplierPayload>): Promise<Supplier> => {
    const response = await api.put<Supplier>(`/suppliers/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },

  uploadDocument: async (id: number, file: File): Promise<KycDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<KycDocument>(`/suppliers/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  listDocuments: async (id: number): Promise<KycDocument[]> => {
    const response = await api.get<KycDocument[]>(`/suppliers/${id}/documents`);
    return response.data;
  },

  runKypCheck: async (id: number): Promise<CreditCheck> => {
    const response = await api.post<CreditCheck>(`/suppliers/${id}/kyp-check`);
    return response.data;
  },
};
