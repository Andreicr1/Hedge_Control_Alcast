import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  PurchaseOrder,
  SalesOrder,
  Supplier,
  Customer,
  Counterparty,
  Rfq,
  Hedge,
  WarehouseLocation,
  Exposure,
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
import { exposuresService } from '../services/exposuresService';

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
  hedges: Hedge[];
  loadingHedges: boolean;
  fetchHedges: () => Promise<void>;

  // Locations
  locations: WarehouseLocation[];
  loadingLocations: boolean;
  fetchLocations: () => Promise<void>;

  // Exposures
  exposures: Exposure[];
  loadingExposures: boolean;
  fetchExposures: () => Promise<void>;

  // Flag para saber se está usando mock
  isUsingMock: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Verificar modo mock da variável de ambiente
  const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

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

  const [hedges, setHedges] = useState<Hedge[]>([]);
  const [loadingHedges, setLoadingHedges] = useState(true);

  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const [exposures, setExposures] = useState<Exposure[]>([]);
  const [loadingExposures, setLoadingExposures] = useState(true);

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
      if (useMock) {
        setPurchaseOrders(mockData.purchaseOrders as any);
      } else {
        setPurchaseOrders([]);
      }
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
      if (useMock) {
        setSalesOrders(mockData.salesOrders as any);
      } else {
        setSalesOrders([]);
      }
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
      if (useMock) {
        setSuppliers(mockData.suppliers as any);
      } else {
        setSuppliers([]);
      }
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
      if (useMock) {
        setCustomers(mockData.customers as any);
      } else {
        setCustomers([]);
      }
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
      if (useMock) {
        setCounterparties(mockData.counterparties as any);
      } else {
        setCounterparties([]);
      }
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
      if (useMock) {
        setRfqs(mockData.rfqs as any);
      } else {
        setRfqs([]);
      }
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
      if (useMock) {
        setHedges(mockData.hedges as any);
      } else {
        setHedges([]);
      }
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
      if (useMock) {
        setLocations(mockData.locations as any);
      } else {
        setLocations([]);
      }
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchExposures = async () => {
    try {
      setLoadingExposures(true);
      if (useMock) {
        setExposures(mockData.exposures as any);
      } else {
        const data = await exposuresService.getAll();
        setExposures(data);
      }
    } catch (error: any) {
      if (useMock) {
        setExposures(mockData.exposures as any);
      } else {
        setExposures([]);
      }
    } finally {
      setLoadingExposures(false);
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
    fetchExposures();
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
        exposures,
        loadingExposures,
        fetchExposures,
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
