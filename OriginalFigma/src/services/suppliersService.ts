import api from './api';
import { Supplier } from '../types/api';

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
};
