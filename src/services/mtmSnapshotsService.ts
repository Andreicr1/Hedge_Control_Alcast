import api from './api';
import { MarketObjectType, MTMSnapshot, MTMSnapshotCreate } from '../types/api';

export const mtmSnapshotsService = {
  create: async (payload: MTMSnapshotCreate): Promise<MTMSnapshot> => {
    const resp = await api.post<MTMSnapshot>('/mtm/snapshots', payload);
    return resp.data;
  },
  list: async (params?: { object_type?: MarketObjectType; object_id?: number; product?: string; period?: string; latest?: boolean }): Promise<MTMSnapshot[]> => {
    const resp = await api.get<MTMSnapshot[]>('/mtm/snapshots', { params });
    return resp.data;
  },
};
