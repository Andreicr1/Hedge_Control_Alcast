// Enums
export enum OrderStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PricingType {
  FIXED = 'fixed',
  TBF = 'tbf',
  MONTHLY_AVERAGE = 'monthly_average',
  LME_PREMIUM = 'lme_premium',
}

export enum MarketObjectType {
  HEDGE = 'hedge',
  PO = 'po',
  SO = 'so',
  PORTFOLIO = 'portfolio',
  EXPOSURE = 'exposure',
  NET = 'net',
}

export enum RoleName {
  ADMIN = 'admin',
  COMPRAS = 'compras',
  VENDAS = 'vendas',
  FINANCEIRO = 'financeiro',
  ESTOQUE = 'estoque',
}

export enum CounterpartyType {
  BANK = 'bank',
  BROKER = 'broker',
}

export enum RfqStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  SENT = 'sent',
  QUOTED = 'quoted',
  AWARDED = 'awarded',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

export enum HedgeStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

// Core types
export interface Role {
  id: number;
  name: RoleName;
  description?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  active: boolean;
  role: Role;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  code?: string;
  legal_name?: string;
  tax_id?: string;
  state_registration?: string;
  address_line?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  credit_limit?: number;
  credit_score?: number;
  kyc_status?: string;
  kyc_notes?: string;
  contact_email?: string;
  contact_phone?: string;
  active: boolean;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  code?: string;
  legal_name?: string;
  tax_id?: string;
  state_registration?: string;
  address_line?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  credit_limit?: number;
  credit_score?: number;
  kyc_status?: string;
  kyc_notes?: string;
  contact_email?: string;
  contact_phone?: string;
  active: boolean;
  created_at: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier?: Supplier;
  product?: string;
  total_quantity_mt: number;
  unit?: string;
  unit_price?: number;
  pricing_type: PricingType;
  pricing_period?: string;
  lme_premium: number;
  premium?: number;
  reference_price?: string;
  fixing_deadline?: string;
  expected_delivery_date?: string;
  location?: string;
  avg_cost?: number;
  status: OrderStatus;
  notes?: string;
  created_at: string;
}

export interface SalesOrder {
  id: number;
  so_number: string;
  customer_id: number;
  customer?: Customer;
  product?: string;
  total_quantity_mt: number;
  unit?: string;
  unit_price?: number;
  pricing_type: PricingType;
  pricing_period?: string;
  lme_premium: number;
  premium?: number;
  reference_price?: string;
  fixing_deadline?: string;
  expected_delivery_date?: string;
  location?: string;
  status: OrderStatus;
  notes?: string;
  created_at: string;
}

export interface Counterparty {
  id: number;
  name: string;
  type: CounterpartyType;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  active: boolean;
  created_at: string;
}

export interface RfqQuote {
  id: number;
  counterparty_id?: number;
  counterparty_name?: string;
  quote_price: number;
  status: string;
  quoted_at: string;
}

export interface Rfq {
  id: number;
  rfq_number: string;
  so_id: number;
  quantity_mt: number;
  period: string;
  status: RfqStatus;
  message_text?: string;
  counterparty_quotes: RfqQuote[];
  created_at: string;
}

export interface Hedge {
  id: number;
  so_id?: number;
  counterparty_id: number;
  quantity_mt: number;
  contract_price: number;
  current_market_price?: number;
  mtm_value?: number;
  period: string;
  instrument?: string;
  maturity_date?: string;
  reference_code?: string;
  status: HedgeStatus;
  created_at: string;
}

export interface MarketPrice {
  id: number;
  source: string;
  symbol: string;
  contract_month?: string;
  price: number;
  currency: string;
  as_of: string;
  fx?: boolean;
  created_at: string;
}

export interface MarketPriceCreate {
  source: string;
  symbol: string;
  contract_month?: string;
  price: number;
  currency?: string;
  as_of: string;
  fx?: boolean;
}

export interface MTMSnapshot {
  id: number;
  object_type: MarketObjectType;
  object_id?: number;
  product?: string;
  period?: string;
  price: number;
  quantity_mt: number;
  mtm_value: number;
  as_of_date: string;
  created_at: string;
}

export interface MTMSnapshotCreate {
  object_type: MarketObjectType;
  object_id?: number;
  product?: string;
  period?: string;
  price: number;
  as_of_date?: string;
}

export interface WarehouseLocation {
  id: number;
  name: string;
  type?: string;
  current_stock_mt?: number;
  capacity_mt?: number;
  active: boolean;
  created_at: string;
}

// Request DTOs
export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface SupplierPayload {
  name: string;
  code?: string;
  legal_name?: string;
  tax_id?: string;
  state_registration?: string;
  address_line?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  credit_limit?: number;
  credit_score?: number;
  kyc_status?: string;
  kyc_notes?: string;
  contact_email?: string;
  contact_phone?: string;
  active?: boolean;
}

export interface CustomerPayload {
  name: string;
  code?: string;
  legal_name?: string;
  tax_id?: string;
  state_registration?: string;
  address_line?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  credit_limit?: number;
  credit_score?: number;
  kyc_status?: string;
  kyc_notes?: string;
  contact_email?: string;
  contact_phone?: string;
  active?: boolean;
}

export interface PurchaseOrderCreate {
  po_number?: string;
  supplier_id: number;
  product?: string;
  total_quantity_mt: number;
  unit?: string;
  unit_price?: number;
  pricing_type: PricingType;
  lme_premium: number;
  pricing_period?: string;
  premium?: number;
  reference_price?: string;
  fixing_deadline?: string;
  expected_delivery_date?: string;
  location?: string;
  avg_cost?: number;
  notes?: string;
  status?: OrderStatus;
}

export type PurchaseOrderUpdate = Partial<PurchaseOrderCreate>;

export interface SalesOrderCreate {
  so_number?: string;
  customer_id: number;
  product?: string;
  total_quantity_mt: number;
  unit?: string;
  unit_price?: number;
  pricing_type: PricingType;
  lme_premium: number;
  pricing_period?: string;
  premium?: number;
  reference_price?: string;
  fixing_deadline?: string;
  expected_delivery_date?: string;
  location?: string;
  notes?: string;
  status?: OrderStatus;
}

export type SalesOrderUpdate = Partial<SalesOrderCreate>;

export interface CounterpartyPayload {
  name: string;
  type: CounterpartyType;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  active?: boolean;
}

export interface RfqCreate {
  rfq_number: string;
  so_id: number;
  quantity_mt: number;
  period: string;
  status?: RfqStatus;
  message_text?: string;
  counterparty_quotes?: RfqQuoteCreate[];
}

export type RfqUpdate = Partial<Omit<RfqCreate, 'counterparty_quotes'>> & {
  counterparty_quotes?: RfqQuoteCreate[];
};

export interface RfqQuoteCreate {
  counterparty_id?: number;
  counterparty_name: string;
  quote_price: number;
  status?: string;
}

export interface HedgeCreate {
  so_id: number;
  counterparty_id: number;
  quantity_mt: number;
  contract_price: number;
  current_market_price?: number;
  mtm_value?: number;
  period: string;
  status?: HedgeStatus;
}

export type HedgeUpdate = Partial<HedgeCreate>;

export interface WarehouseLocationPayload {
  name: string;
  type: string;
  current_stock_mt: number;
  capacity_mt: number;
  active?: boolean;
}

export interface KycDocument {
  id: number;
  owner_type: 'customer' | 'supplier';
  owner_id: number;
  filename: string;
  content_type?: string;
  path: string;
  uploaded_at: string;
}

export interface CreditCheck {
  id: number;
  owner_type: 'customer' | 'supplier';
  owner_id: number;
  bureau?: string;
  score?: number;
  status?: string;
  raw_response?: string;
  created_at: string;
}

// RFQ preview types (rfq_engine parity)
export type RfqPriceType = 'AVG' | 'AVGInter' | 'Fix' | 'C2R';
export type RfqTradeType = 'Swap' | 'Forward';
export type RfqSide = 'buy' | 'sell';
export type RfqOrderType = 'At Market' | 'Limit' | 'Resting';

export interface RfqPreviewOrder {
  order_type: RfqOrderType;
  validity?: string;
  limit_price?: string;
}

export interface RfqPreviewLeg {
  side: RfqSide;
  price_type: RfqPriceType;
  quantity_mt: number;
  month_name?: string;
  year?: number;
  start_date?: string;
  end_date?: string;
  fixing_date?: string;
  ppt?: string;
  order?: RfqPreviewOrder;
}

export interface RfqPreviewRequest {
  trade_type: RfqTradeType;
  leg1: RfqPreviewLeg;
  leg2?: RfqPreviewLeg;
  sync_ppt?: boolean;
  holidays?: string[];
  company_header?: string;
  company_label_for_payoff?: string;
}

export interface RfqPreviewResponse {
  text: string;
}

export type ExposureType = 'active' | 'passive';
export type ExposureStatus = 'open' | 'hedged' | 'closed';
export type HedgeTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface HedgeTask {
  id: number;
  status: HedgeTaskStatus;
  created_at: string;
}

export interface Exposure {
  id: number;
  source_type: MarketObjectType;
  source_id: number;
  exposure_type: ExposureType;
  quantity_mt: number;
  product?: string;
  payment_date?: string;
  delivery_date?: string;
  sale_date?: string;
  status: ExposureStatus;
  created_at: string;
  tasks: HedgeTask[];
}
