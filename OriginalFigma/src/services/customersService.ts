import api from './api';
import { Customer } from '../types/api';

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
};
