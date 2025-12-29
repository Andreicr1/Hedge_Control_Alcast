import api from './api';
import { HedgeTask } from '../types/api';

export const hedgeTasksService = {
  getAll: async (): Promise<HedgeTask[]> => {
    const resp = await api.get<HedgeTask[]>('/hedge-tasks');
    return resp.data;
  },
};
