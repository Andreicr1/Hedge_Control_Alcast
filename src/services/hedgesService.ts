import api from './api';
import { Hedge, HedgeCreate, HedgeUpdate } from '../types/api';

export const hedgesService = {
  // Listar todos os hedges
  getAll: async (): Promise<Hedge[]> => {
    const response = await api.get<Hedge[]>('/hedges');
    return response.data;
  },

  // Buscar hedge por ID
  getById: async (id: number): Promise<Hedge> => {
    const response = await api.get<Hedge>(`/hedges/${id}`);
    return response.data;
  },

  create: async (data: HedgeCreate): Promise<Hedge> => {
    const response = await api.post<Hedge>('/hedges', data);
    return response.data;
  },

  update: async (id: number, data: HedgeUpdate): Promise<Hedge> => {
    const response = await api.put<Hedge>(`/hedges/${id}`, data);
    return response.data;
  },

  createManual: async (data: any): Promise<Hedge> => {
    const response = await api.post<Hedge>('/hedges/manual', data);
    return response.data;
  },
};
