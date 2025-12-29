import api from './api';
import type {
  LoginRequest,
  TokenResponse,
  User,
  PurchaseOrder,
  PurchaseOrderCreate,
  OrderStatusUpdate,
  SalesOrder,
  SalesOrderCreate,
  Rfq,
  RfqCreate,
  RfqQuote,
  Counterparty,
  Supplier,
  Customer,
  WarehouseLocation,
  HedgeTrade,
} from '../types/api';

// ==================== AUTH ====================
export const authService = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);

    const response = await api.post<TokenResponse>('/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

// ==================== PURCHASE ORDERS ====================
export const purchaseOrderService = {
  getAll: async (): Promise<PurchaseOrder[]> => {
    const response = await api.get<PurchaseOrder[]>('/purchase-orders');
    return response.data;
  },

  getById: async (id: number): Promise<PurchaseOrder> => {
    const response = await api.get<PurchaseOrder>(`/purchase-orders/${id}`);
    return response.data;
  },

  create: async (data: PurchaseOrderCreate): Promise<PurchaseOrder> => {
    const response = await api.post<PurchaseOrder>('/purchase-orders', data);
    return response.data;
  },

  updateStatus: async (id: number, data: OrderStatusUpdate): Promise<PurchaseOrder> => {
    const response = await api.post<PurchaseOrder>(`/purchase-orders/${id}/status`, data);
    return response.data;
  },
};

// ==================== SALES ORDERS ====================
export const salesOrderService = {
  getAll: async (): Promise<SalesOrder[]> => {
    const response = await api.get<SalesOrder[]>('/sales-orders');
    return response.data;
  },

  getById: async (id: number): Promise<SalesOrder> => {
    const response = await api.get<SalesOrder>(`/sales-orders/${id}`);
    return response.data;
  },

  create: async (data: SalesOrderCreate): Promise<SalesOrder> => {
    const response = await api.post<SalesOrder>('/sales-orders', data);
    return response.data;
  },

  updateStatus: async (id: number, data: OrderStatusUpdate): Promise<SalesOrder> => {
    const response = await api.post<SalesOrder>(`/sales-orders/${id}/status`, data);
    return response.data;
  },
};

// ==================== RFQs ====================
export const rfqService = {
  getAll: async (): Promise<Rfq[]> => {
    const response = await api.get<Rfq[]>('/rfqs');
    return response.data;
  },

  getById: async (id: number): Promise<Rfq> => {
    const response = await api.get<Rfq>(`/rfqs/${id}`);
    return response.data;
  },

  create: async (data: RfqCreate): Promise<Rfq> => {
    const response = await api.post<Rfq>('/rfqs', data);
    return response.data;
  },

  addQuote: async (rfqId: number, quote: Partial<RfqQuote>): Promise<RfqQuote> => {
    const response = await api.post<RfqQuote>(`/rfqs/${rfqId}/quotes`, quote);
    return response.data;
  },

  send: async (rfqId: number, counterpartyIds: number[]): Promise<void> => {
    await api.post(`/rfqs/${rfqId}/send`, { counterparty_ids: counterpartyIds });
  },

  award: async (rfqId: number, quoteId: number): Promise<Rfq> => {
    const response = await api.post<Rfq>(`/rfqs/${rfqId}/award`, { quote_id: quoteId });
    return response.data;
  },
};

// ==================== HEDGES ====================
export const hedgeService = {
  getAll: async (): Promise<HedgeTrade[]> => {
    const response = await api.get<HedgeTrade[]>('/hedges');
    return response.data;
  },

  getById: async (id: number): Promise<HedgeTrade> => {
    const response = await api.get<HedgeTrade>(`/hedges/${id}`);
    return response.data;
  },

  create: async (data: Partial<HedgeTrade>): Promise<HedgeTrade> => {
    const response = await api.post<HedgeTrade>('/hedges', data);
    return response.data;
  },
};

// ==================== COUNTERPARTIES ====================
export const counterpartyService = {
  getAll: async (): Promise<Counterparty[]> => {
    const response = await api.get<Counterparty[]>('/counterparties');
    return response.data;
  },

  getById: async (id: number): Promise<Counterparty> => {
    const response = await api.get<Counterparty>(`/counterparties/${id}`);
    return response.data;
  },

  create: async (data: Partial<Counterparty>): Promise<Counterparty> => {
    const response = await api.post<Counterparty>('/counterparties', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Counterparty>): Promise<Counterparty> => {
    const response = await api.put<Counterparty>(`/counterparties/${id}`, data);
    return response.data;
  },
};

// ==================== SUPPLIERS ====================
export const supplierService = {
  getAll: async (): Promise<Supplier[]> => {
    const response = await api.get<Supplier[]>('/suppliers');
    return response.data;
  },

  create: async (data: Partial<Supplier>): Promise<Supplier> => {
    const response = await api.post<Supplier>('/suppliers', data);
    return response.data;
  },
};

// ==================== CUSTOMERS ====================
export const customerService = {
  getAll: async (): Promise<Customer[]> => {
    const response = await api.get<Customer[]>('/customers');
    return response.data;
  },

  create: async (data: Partial<Customer>): Promise<Customer> => {
    const response = await api.post<Customer>('/customers', data);
    return response.data;
  },
};

// ==================== WAREHOUSE LOCATIONS ====================
export const locationService = {
  getAll: async (): Promise<WarehouseLocation[]> => {
    const response = await api.get<WarehouseLocation[]>('/locations');
    return response.data;
  },

  create: async (data: { name: string }): Promise<WarehouseLocation> => {
    const response = await api.post<WarehouseLocation>('/locations', data);
    return response.data;
  },
};

// ==================== INVENTORY ====================
export interface InventoryItem {
  id: number;
  po_code: string;
  supplier_name: string;
  aluminum_type: string;
  quantity_tons: number;
  allocated_tons: number;
  available_tons: number;
  avg_cost: number;
  location_name?: string;
  arrival_date?: string;
}

export const inventoryService = {
  getAll: async (): Promise<InventoryItem[]> => {
    const response = await api.get<InventoryItem[]>('/inventory');
    return response.data;
  },
};

// ==================== MTM (Mark-to-Market) ====================
export interface MtmRecord {
  id: number;
  as_of_date: string;
  object_type: 'hedge' | 'po' | 'so' | 'portfolio';
  object_id?: number;
  forward_price?: number;
  fx_rate?: number;
  mtm_value: number;
  methodology?: string;
  computed_at: string;
}

export const mtmService = {
  getLatest: async (): Promise<MtmRecord[]> => {
    const response = await api.get<MtmRecord[]>('/mtm/latest');
    return response.data;
  },

  compute: async (asOfDate?: string): Promise<{ message: string; records_count: number }> => {
    const response = await api.post('/mtm/compute', { as_of_date: asOfDate });
    return response.data;
  },
};

// ==================== MARKET DATA ====================
export interface MarketPrice {
  id: number;
  source: string;
  symbol: string;
  contract_month?: string;
  price: number;
  currency: string;
  as_of: string;
  fx: boolean;
  created_at: string;
}

export const marketDataService = {
  getLatestPrices: async (): Promise<MarketPrice[]> => {
    const response = await api.get<MarketPrice[]>('/market-data/latest');
    return response.data;
  },

  getLMEPrice: async (contractMonth?: string): Promise<MarketPrice> => {
    const params = contractMonth ? { contract_month: contractMonth } : {};
    const response = await api.get<MarketPrice>('/market-data/lme', { params });
    return response.data;
  },
};

// Export all services
export default {
  auth: authService,
  purchaseOrders: purchaseOrderService,
  salesOrders: salesOrderService,
  rfqs: rfqService,
  hedges: hedgeService,
  counterparties: counterpartyService,
  suppliers: supplierService,
  customers: customerService,
  locations: locationService,
  inventory: inventoryService,
  mtm: mtmService,
  marketData: marketDataService,
};
