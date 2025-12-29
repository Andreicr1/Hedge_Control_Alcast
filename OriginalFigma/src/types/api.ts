// Enums do backend
export enum OrderStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  HEDGED = 'hedged',
  SETTLED = 'settled',
}

export enum RoleName {
  ADMIN = 'admin',
  COMPRAS = 'compras',
  VENDAS = 'vendas',
  FINANCEIRO = 'financeiro',
}

export enum HedgeStatus {
  PLANNED = 'planned',
  RFQ = 'rfq',
  EXECUTED = 'executed',
  CLOSED = 'closed',
}

export enum RfqStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  QUOTED = 'quoted',
  AWARDED = 'awarded',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

// Interfaces do backend
export interface User {
  id: number;
  email: string;
  name: string;
  role_id: number;
  role?: Role;
  active: boolean;
  created_at: string;
}

export interface Role {
  id: number;
  name: RoleName;
  description?: string;
}

export interface Supplier {
  id: number;
  name: string;
  country?: string;
  contact?: string;
}

export interface Customer {
  id: number;
  name: string;
  country?: string;
  contact?: string;
}

export interface WarehouseLocation {
  id: number;
  name: string;
  active: boolean;
  created_at: string;
}

export interface PurchaseOrder {
  id: number;
  code: string;
  supplier_id: number;
  supplier?: Supplier;
  quantity_tons: number;
  aluminum_type: string;
  expected_delivery_date?: string;
  expected_payment_date?: string;
  payment_terms?: string;
  currency: string;
  notes?: string;
  status: OrderStatus;
  created_by?: number;
  created_at: string;
  location_id?: number;
  location?: WarehouseLocation;
  avg_cost?: number;
  arrival_date?: string;
}

export interface SalesOrder {
  id: number;
  code: string;
  customer_id: number;
  customer?: Customer;
  quantity_tons: number;
  aluminum_type: string;
  expected_delivery_date?: string;
  expected_receipt_date?: string;
  receipt_terms?: string;
  currency: string;
  notes?: string;
  status: OrderStatus;
  created_by?: number;
  created_at: string;
  location_id?: number;
  location?: WarehouseLocation;
}

export interface HedgeTrade {
  id: number;
  hedge_type: 'purchase' | 'sale';
  side: 'buy' | 'sell';
  lme_contract: string;
  contract_month: string;
  expiry_date?: string;
  lots: number;
  lot_size_tons: number;
  price: number;
  currency: string;
  notional_tons: number;
  status: HedgeStatus;
  purchase_order_id?: number;
  sales_order_id?: number;
  rfq_id?: number;
  executed_at?: string;
  created_at: string;
}

export interface Rfq {
  id: number;
  rfq_type: 'hedge_buy' | 'hedge_sell';
  reference_po_id?: number;
  reference_so_id?: number;
  tenor_month?: string;
  quantity_tons: number;
  channel: string;
  status: RfqStatus;
  message_text?: string;
  sent_at?: string;
  awarded_at?: string;
  created_by?: number;
  created_at: string;
  quotes?: RfqQuote[];
}

export interface RfqQuote {
  id: number;
  rfq_id: number;
  provider: string;
  price: number;
  fee_bps?: number;
  currency: string;
  valid_until?: string;
  ranking_score?: number;
  selected: boolean;
  created_at: string;
}

export interface Counterparty {
  id: number;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  preferred_channel: string;
  api_endpoint?: string;
  credit_limit?: number;
  credit_limit_currency?: string;
  credit_expiry?: string;
  notes?: string;
  active: boolean;
  created_at: string;
}

// DTOs para criação
export interface PurchaseOrderCreate {
  code: string;
  supplier_id: number;
  quantity_tons: number;
  aluminum_type: string;
  expected_delivery_date?: string;
  expected_payment_date?: string;
  payment_terms?: string;
  currency?: string;
  notes?: string;
  location_id?: number;
  avg_cost?: number;
  arrival_date?: string;
}

export interface SalesOrderCreate {
  code: string;
  customer_id: number;
  quantity_tons: number;
  aluminum_type: string;
  expected_delivery_date?: string;
  expected_receipt_date?: string;
  receipt_terms?: string;
  currency?: string;
  notes?: string;
  location_id?: number;
  linked_purchase_order_ids?: number[];
}

export interface RfqCreate {
  rfq_type: 'hedge_buy' | 'hedge_sell';
  reference_po_id?: number;
  reference_so_id?: number;
  tenor_month?: string;
  quantity_tons: number;
  channel?: string;
  message_text?: string;
}

// Tipos de autenticação
export interface LoginRequest {
  username: string; // email
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// Tipos de atualização de status
export interface OrderStatusUpdate {
  status: OrderStatus;
}
