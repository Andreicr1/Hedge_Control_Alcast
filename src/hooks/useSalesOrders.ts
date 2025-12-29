import { useState, useEffect } from 'react';
import { SalesOrder, SalesOrderCreate, OrderStatusUpdate } from '../types/api';
import { salesOrdersService } from '../services/salesOrdersService';
import { toast } from 'sonner';

export const useSalesOrders = () => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await salesOrdersService.getAll();
      setSalesOrders(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao carregar Sales Orders';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createSalesOrder = async (data: SalesOrderCreate) => {
    try {
      const newSO = await salesOrdersService.create(data);
      setSalesOrders((prev) => [newSO, ...prev]);
      toast.success('Sales Order criada com sucesso!');
      return newSO;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao criar Sales Order';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateStatus = async (id: number, statusUpdate: OrderStatusUpdate) => {
    try {
      const updatedSO = await salesOrdersService.updateStatus(id, statusUpdate);
      setSalesOrders((prev) =>
        prev.map((so) => (so.id === id ? updatedSO : so))
      );
      toast.success('Status atualizado com sucesso!');
      return updatedSO;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao atualizar status';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  return {
    salesOrders,
    loading,
    error,
    refetch: fetchSalesOrders,
    createSalesOrder,
    updateStatus,
  };
};
