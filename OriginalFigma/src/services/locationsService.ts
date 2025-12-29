import api from './api';
import { WarehouseLocation } from '../types/api';

export const locationsService = {
  // Listar todas as localizações de armazém
  getAll: async (): Promise<WarehouseLocation[]> => {
    const response = await api.get<WarehouseLocation[]>('/locations');
    return response.data;
  },

  // Buscar localização por ID
  getById: async (id: number): Promise<WarehouseLocation> => {
    const response = await api.get<WarehouseLocation>(`/locations/${id}`);
    return response.data;
  },
};
