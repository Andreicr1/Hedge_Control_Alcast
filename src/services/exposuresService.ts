import api from './api';
import { Exposure } from '../types/api';

export const exposuresService = {
  getAll: async (): Promise<Exposure[]> => {
    const resp = await api.get<Exposure[]>('/exposures');
    return resp.data;
  },
};
