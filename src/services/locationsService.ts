import api from './api';
import { WarehouseLocation, WarehouseLocationPayload } from '../types/api';

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

  create: async (data: WarehouseLocationPayload): Promise<WarehouseLocation> => {
    const response = await api.post<WarehouseLocation>('/locations', data);
    return response.data;
  },

  update: async (id: number, data: Partial<WarehouseLocationPayload>): Promise<WarehouseLocation> => {
    const response = await api.put<WarehouseLocation>(`/locations/${id}`, data);
    return response.data;
  },
};
