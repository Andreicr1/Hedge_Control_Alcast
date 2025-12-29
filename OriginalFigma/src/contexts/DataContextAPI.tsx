import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  PurchaseOrder,
  SalesOrder,
  Supplier,
  Customer,
  Counterparty,
  Rfq,
  HedgeTrade,
  WarehouseLocation,
} from '../types/api';

// Importar serviços
import { purchaseOrdersService } from '../services/purchaseOrdersService';
import { salesOrdersService } from '../services/salesOrdersService';
import { suppliersService } from '../services/suppliersService';
import { customersService } from '../services/customersService';
import { counterpartiesService } from '../services/counterpartiesService';
import { rfqsService } from '../services/rfqsService';
import { hedgesService } from '../services/hedgesService';
import { locationsService } from '../services/locationsService';

// Importar dados mockados como fallback
import mockData from './mockData';

interface DataContextType {
  // Purchase Orders
  purchaseOrders: PurchaseOrder[];
  loadingPOs: boolean;
  fetchPurchaseOrders: () => Promise<void>;

  // Sales Orders
  salesOrders: SalesOrder[];
  loadingSOs: boolean;
  fetchSalesOrders: () => Promise<void>;

  // Suppliers
  suppliers: Supplier[];
  loadingSuppliers: boolean;
  fetchSuppliers: () => Promise<void>;

  // Customers
  customers: Customer[];
  loadingCustomers: boolean;
  fetchCustomers: () => Promise<void>;

  // Counterparties
  counterparties: Counterparty[];
  loadingCounterparties: boolean;
  fetchCounterparties: () => Promise<void>;

  // RFQs
  rfqs: Rfq[];
  loadingRfqs: boolean;
  fetchRfqs: () => Promise<void>;

  // Hedges
  hedges: HedgeTrade[];
  loadingHedges: boolean;
  fetchHedges: () => Promise<void>;

  // Locations
  locations: WarehouseLocation[];
  loadingLocations: boolean;
  fetchLocations: () => Promise<void>;

  // Flag para saber se está usando mock
  isUsingMock: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Verificar modo mock da variável de ambiente
  const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

  console.log('🔧 DataContext initialized');
  console.log('   Mode:', useMock ? 'MOCK' : 'API REAL');
  console.log('   API URL:', import.meta.env.VITE_API_URL);

  // States
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loadingPOs, setLoadingPOs] = useState(true);

  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loadingSOs, setLoadingSOs] = useState(true);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [loadingCounterparties, setLoadingCounterparties] = useState(true);

  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loadingRfqs, setLoadingRfqs] = useState(true);

  const [hedges, setHedges] = useState<HedgeTrade[]>([]);
  const [loadingHedges, setLoadingHedges] = useState(true);

  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Fetch functions com fallback automático para mock
  const fetchPurchaseOrders = async () => {
    try {
      setLoadingPOs(true);
      if (useMock) {
        // Usar dados mockados diretamente
        setPurchaseOrders(mockData.purchaseOrders as any);
      } else {
        // Tentar buscar do backend
        const data = await purchaseOrdersService.getAll();
        setPurchaseOrders(data);
      }
    } catch (error: any) {
      console.warn('Backend não disponível, usando dados mockados para POs');
      // Fallback automático para mock
      setPurchaseOrders(mockData.purchaseOrders as any);
    } finally {
      setLoadingPOs(false);
    }
  };

  const fetchSalesOrders = async () => {
    try {
      setLoadingSOs(true);
      if (useMock) {
        setSalesOrders(mockData.salesOrders as any);
      } else {
        const data = await salesOrdersService.getAll();
        setSalesOrders(data);
      }
    } catch (error: any) {
      console.warn('Backend não disponível, usando dados mockados para SOs');
      setSalesOrders(mockData.salesOrders as any);
    } finally {
      setLoadingSOs(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      if (useMock) {
        setSuppliers(mockData.suppliers as any);
      } else {
        const data = await suppliersService.getAll();
        setSuppliers(data);
      }
    } catch (error: any) {
      console.warn('Backend não disponível, usando dados mockados para Suppliers');
      setSuppliers(mockData.suppliers as any);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      if (useMock) {
        setCustomers(mockData.customers as any);
      } else {
        const data = await customersService.getAll();
        setCustomers(data);
      }
    } catch (error: any) {
      console.warn('Backend não disponível, usando dados mockados para Customers');
      setCustomers(mockData.customers as any);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchCounterparties = async () => {
    try {
      setLoadingCounterparties(true);
      if (useMock) {
        setCounterparties(mockData.counterparties as any);
      } else {
        const data = await counterpartiesService.getAll();
        setCounterparties(data);
      }
    } catch (error: any) {
      console.warn('Backend não disponível, usando dados mockados para Counterparties');
      setCounterparties(mockData.counterparties as any);
    } finally {
      setLoadingCounterparties(false);
    }
  };

  const fetchRfqs = async () => {
    try {
      setLoadingRfqs(true);
      if (useMock) {
        setRfqs(mockData.rfqs as any);
      } else {
        const data = await rfqsService.getAll();
        setRfqs(data);
      }
    } catch (error: any) {
      console.warn('Backend não disponível, usando dados mockados para RFQs');
      setRfqs(mockData.rfqs as any);
    } finally {
      setLoadingRfqs(false);
    }
  };

  const fetchHedges = async () => {
    try {
      setLoadingHedges(true);
      if (useMock) {
        setHedges(mockData.hedges as any);
      } else {
        const data = await hedgesService.getAll();
        setHedges(data);
      }
    } catch (error: any) {
      console.warn('Backend não disponível, usando dados mockados para Hedges');
      setHedges(mockData.hedges as any);
    } finally {
      setLoadingHedges(false);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      if (useMock) {
        setLocations(mockData.locations as any);
      } else {
        const data = await locationsService.getAll();
        setLocations(data);
      }
    } catch (error: any) {
      console.warn('Backend não disponível, usando dados mockados para Locations');
      setLocations(mockData.locations as any);
    } finally {
      setLoadingLocations(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    fetchPurchaseOrders();
    fetchSalesOrders();
    fetchSuppliers();
    fetchCustomers();
    fetchCounterparties();
    fetchRfqs();
    fetchHedges();
    fetchLocations();
  }, []);

  return (
    <DataContext.Provider
      value={{
        purchaseOrders,
        loadingPOs,
        fetchPurchaseOrders,
        salesOrders,
        loadingSOs,
        fetchSalesOrders,
        suppliers,
        loadingSuppliers,
        fetchSuppliers,
        customers,
        loadingCustomers,
        fetchCustomers,
        counterparties,
        loadingCounterparties,
        fetchCounterparties,
        rfqs,
        loadingRfqs,
        fetchRfqs,
        hedges,
        loadingHedges,
        fetchHedges,
        locations,
        loadingLocations,
        fetchLocations,
        isUsingMock: useMock,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
};