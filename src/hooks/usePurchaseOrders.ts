import { useState, useEffect } from 'react';
import { PurchaseOrder, PurchaseOrderCreate, OrderStatusUpdate } from '../types/api';
import { purchaseOrdersService } from '../services/purchaseOrdersService';
import { toast } from 'sonner';

export const usePurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await purchaseOrdersService.getAll();
      setPurchaseOrders(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao carregar Purchase Orders';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createPurchaseOrder = async (data: PurchaseOrderCreate) => {
    try {
      const newPO = await purchaseOrdersService.create(data);
      setPurchaseOrders((prev) => [newPO, ...prev]);
      toast.success('Purchase Order criada com sucesso!');
      return newPO;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao criar Purchase Order';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateStatus = async (id: number, statusUpdate: OrderStatusUpdate) => {
    try {
      const updatedPO = await purchaseOrdersService.updateStatus(id, statusUpdate);
      setPurchaseOrders((prev) =>
        prev.map((po) => (po.id === id ? updatedPO : po))
      );
      toast.success('Status atualizado com sucesso!');
      return updatedPO;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao atualizar status';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  return {
    purchaseOrders,
    loading,
    error,
    refetch: fetchPurchaseOrders,
    createPurchaseOrder,
    updateStatus,
  };
};
