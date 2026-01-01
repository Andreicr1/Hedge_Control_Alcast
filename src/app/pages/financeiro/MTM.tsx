import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../../contexts/DataContextAPI';
import { netExposureService, NetExposureRow } from '../../../services/netExposureService';
import { mtmSnapshotsService } from '../../../services/mtmSnapshotsService';
import { marketPricesService } from '../../../services/marketPricesService';
import { Counterparty, Exposure, Hedge, MarketObjectType, MarketPrice, MTMSnapshot, MTMSnapshotCreate, SalesOrder } from '../../../types/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { RefreshCw, DollarSign, TrendingUp, TrendingDown, AlertCircle, Calendar } from 'lucide-react';
import { cn } from '../../components/ui/utils';

type SnapshotForm = {
  object_type: MarketObjectType;
  object_id: string;
  product: string;
  period: string;
  price: string;
  as_of_date: string;
};

type PriceForm = {
  source: string;
  symbol: string;
  contract_month: string;
  price: string;
  currency: string;
  as_of: string;
  fx: boolean;
};

const formatCurrency = (value?: number) =>
  (value === undefined || value === null ? '-' : value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }));

const deriveExposurePeriod = (exp: Exposure) => {
  if (exp.delivery_date) return exp.delivery_date.slice(0, 7);
  if (exp.sale_date) return exp.sale_date.slice(0, 7);
  if (exp.payment_date) return exp.payment_date.slice(0, 7);
  return '';
};

const hedgeLabel = (hedge: Hedge, salesOrders: SalesOrder[], counterparties: Counterparty[]) => {
  const so = salesOrders.find((s) => s.id === hedge.so_id);
  const cp = counterparties.find((c) => c.id === hedge.counterparty_id);
  const parts = [cp?.name || 'Contraparte', hedge.period, `${hedge.quantity_mt} MT`, so?.product || hedge.instrument].filter(Boolean);
  return parts.join(' • ');
};

export const FinanceiroMTM = () => {
  const { hedges, exposures, salesOrders, counterparties, fetchHedges, loadingHedges } = useData();

  const [snapshots, setSnapshots] = useState<MTMSnapshot[]>([]);
  const [latestSnapshot, setLatestSnapshot] = useState<MTMSnapshot | null>(null);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [netRows, setNetRows] = useState<NetExposureRow[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [snapshotForm, setSnapshotForm] = useState<SnapshotForm>({
    object_type: MarketObjectType.HEDGE,
    object_id: '',
    product: '',
    period: '',
    price: '',
    as_of_date: new Date().toISOString().slice(0, 10),
  });

  const [priceForm, setPriceForm] = useState<PriceForm>({
    source: 'manual',
    symbol: '',
    contract_month: '',
    price: '',
    currency: 'USD',
    as_of: new Date().toISOString().slice(0, 16),
    fx: false,
  });

  const [filters, setFilters] = useState<{ object_type: string; object_id: string; product: string; period: string }>({
    object_type: '',
    object_id: '',
    product: '',
    period: '',
  });

  const hedgeOptions = useMemo(
    () =>
      hedges.map((h) => ({
        id: h.id,
        label: hedgeLabel(h, salesOrders, counterparties),
        product: salesOrders.find((s) => s.id === h.so_id)?.product || h.instrument || '',
        period: h.period || '',
      })),
    [hedges, salesOrders, counterparties],
  );

  const exposureOptions = useMemo(
    () =>
      exposures.map((exp) => ({
        id: exp.id,
        label: `${exp.product || 'Commodity'} • ${deriveExposurePeriod(exp) || 'sem período'} • ${exp.quantity_mt} MT`,
        product: exp.product || '',
        period: deriveExposurePeriod(exp),
      })),
    [exposures],
  );

  const fallbackNetRows: NetExposureRow[] = useMemo(() => {
    if (!exposures.length) return [];
    const bucketMap: Record<string, NetExposureRow> = {};
    exposures.forEach((exp) => {
      const key = `${exp.product || 'Commodity'}|${deriveExposurePeriod(exp) || 'unknown'}`;
      if (!bucketMap[key]) {
        bucketMap[key] = {
          product: exp.product || 'Commodity',
          period: deriveExposurePeriod(exp) || 'unknown',
          gross_active: 0,
          gross_passive: 0,
          hedged: 0,
          net: 0,
        };
      }
      if (exp.exposure_type === 'active') {
        bucketMap[key].gross_active += exp.quantity_mt;
      } else {
        bucketMap[key].gross_passive += exp.quantity_mt;
      }
    });
    hedges.forEach((h) => {
      const key = `${salesOrders.find((s) => s.id === h.so_id)?.product || 'Commodity'}|${h.period || 'unknown'}`;
      if (bucketMap[key]) {
        bucketMap[key].hedged += h.quantity_mt;
      }
    });
    return Object.values(bucketMap).map((row) => ({
      ...row,
      net: row.gross_active - row.gross_passive - row.hedged,
    }));
  }, [exposures, hedges, salesOrders]);

  const effectiveNetRows = netRows.length ? netRows : fallbackNetRows;
  const totalSnapshotMtm = snapshots.reduce((sum, s) => sum + (s.mtm_value || 0), 0);

  useEffect(() => {
    loadSnapshots();
    loadMarketPrices();
    loadNetExposure();
  }, []);

  const loadSnapshots = async () => {
    setLoadingSnapshots(true);
    setError(null);
    try {
      const params: any = {};
      if (filters.object_type) params.object_type = filters.object_type as MarketObjectType;
      if (filters.object_id) params.object_id = Number(filters.object_id);
      if (filters.product) params.product = filters.product;
      if (filters.period) params.period = filters.period;
      const data = await mtmSnapshotsService.list(params);
      setSnapshots(data);
      setLatestSnapshot(data[0] ?? null);
    } catch (err: any) {
      console.error(err);
      setError('Falha ao carregar snapshots de MTM. Verifique o backend.');
    } finally {
      setLoadingSnapshots(false);
    }
  };

  const loadMarketPrices = async () => {
    try {
      const data = await marketPricesService.list();
      setMarketPrices(data.slice(0, 10));
    } catch (err) {
      console.warn('Não foi possível carregar preços de mercado', err);
    }
  };

  const loadNetExposure = async () => {
    try {
      const data = await netExposureService.getAll();
      setNetRows(data);
    } catch (err) {
      console.warn('Não foi possível carregar exposição líquida', err);
      setNetRows([]);
    }
  };

  const handleSnapshotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSnapshot(true);
    setError(null);
    try {
      if ((snapshotForm.object_type === MarketObjectType.HEDGE || snapshotForm.object_type === MarketObjectType.EXPOSURE) && !snapshotForm.object_id) {
        setError('Selecione a entidade para calcular o MTM.');
        return;
      }
      const body: MTMSnapshotCreate = {
        object_type: snapshotForm.object_type,
        object_id: snapshotForm.object_id ? Number(snapshotForm.object_id) : undefined,
        product: snapshotForm.product || undefined,
        period: snapshotForm.period || undefined,
        price: Number(snapshotForm.price),
        as_of_date: snapshotForm.as_of_date,
      };
      await mtmSnapshotsService.create(body);
      await loadSnapshots();
      setSnapshotForm({
        object_type: MarketObjectType.HEDGE,
        object_id: '',
        product: '',
        period: '',
        price: '',
        as_of_date: new Date().toISOString().slice(0, 10),
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao registrar snapshot MTM');
    } finally {
      setSavingSnapshot(false);
    }
  };

  const handlePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrice(true);
    setError(null);
    try {
      await marketPricesService.create({
        source: priceForm.source,
        symbol: priceForm.symbol,
        contract_month: priceForm.contract_month,
        price: Number(priceForm.price),
        currency: priceForm.currency,
        as_of: priceForm.as_of,
        fx: priceForm.fx,
      });
      await loadMarketPrices();
      setPriceForm({
        source: 'manual',
        symbol: '',
        contract_month: '',
        price: '',
        currency: 'USD',
        as_of: new Date().toISOString().slice(0, 16),
        fx: false,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao registrar preço de mercado');
    } finally {
      setSavingPrice(false);
    }
  };

  // Calculate totals
  const totalMTM = hedges.reduce((sum, h) => sum + (h.mtm_value || 0), 0);
  const positiveHedges = hedges.filter(h => (h.mtm_value || 0) > 0).length;
  const negativeHedges = hedges.length - positiveHedges;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mark-to-Market</h1>
          <p className="text-muted-foreground">
            Valuation de contratos e exposições
          </p>
        </div>
        <Button onClick={loadSnapshots} disabled={loadingSnapshots} variant="outline">
          <RefreshCw className={cn("h-4 w-4 mr-2", loadingSnapshots && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MTM Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              totalMTM >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(totalMTM)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {hedges.length} hedges ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Snapshots Registrados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{snapshots.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {formatCurrency(totalSnapshotMtm)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hedges Positivos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{positiveHedges}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Em ganho
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hedges Negativos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{negativeHedges}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Em perda
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="exposure" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exposure">Exposição por Bucket</TabsTrigger>
          <TabsTrigger value="snapshots">Histórico MTM</TabsTrigger>
          <TabsTrigger value="hedges">Hedges</TabsTrigger>
          <TabsTrigger value="register">Registrar MTM</TabsTrigger>
          <TabsTrigger value="prices">Preços de Mercado</TabsTrigger>
        </TabsList>

        {/* Exposure Tab */}
        <TabsContent value="exposure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exposição por Bucket</CardTitle>
              <CardDescription>Evidência operacional consolidada</CardDescription>
            </CardHeader>
            <CardContent>
              {effectiveNetRows.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma exposição registrada.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Commodity</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead className="text-right">Exp. Ativa</TableHead>
                      <TableHead className="text-right">Exp. Passiva</TableHead>
                      <TableHead className="text-right">Hedge Aplicado</TableHead>
                      <TableHead className="text-right">Exp. Líquida</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {effectiveNetRows.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row.product}</TableCell>
                        <TableCell>{row.period}</TableCell>
                        <TableCell className="text-right">{row.gross_active} MT</TableCell>
                        <TableCell className="text-right">{row.gross_passive} MT</TableCell>
                        <TableCell className="text-right">{row.hedged} MT</TableCell>
                        <TableCell className={cn(
                          "text-right font-semibold",
                          row.net > 0 ? "text-red-600" : row.net < 0 ? "text-green-600" : ""
                        )}>
                          {row.net} MT
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Snapshots Tab */}
        <TabsContent value="snapshots" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico MTM</CardTitle>
                  <CardDescription>Contexto temporal de snapshots</CardDescription>
                </div>
                <Button onClick={loadSnapshots} disabled={loadingSnapshots} variant="outline" size="sm">
                  {loadingSnapshots ? 'Filtrando...' : 'Aplicar Filtros'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid md:grid-cols-5 gap-3">
                <Select
                  value={filters.object_type}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, object_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value={MarketObjectType.HEDGE}>Hedge</SelectItem>
                    <SelectItem value={MarketObjectType.EXPOSURE}>Exposure</SelectItem>
                    <SelectItem value={MarketObjectType.NET}>Exposição Líquida</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="ID da entidade"
                  value={filters.object_id}
                  onChange={(e) => setFilters(prev => ({ ...prev, object_id: e.target.value }))}
                />
                <Input
                  placeholder="Commodity"
                  value={filters.product}
                  onChange={(e) => setFilters(prev => ({ ...prev, product: e.target.value }))}
                />
                <Input
                  placeholder="Período (YYYY-MM)"
                  value={filters.period}
                  onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                />
              </div>

              {/* Table */}
              {loadingSnapshots ? (
                <div className="text-center py-12 text-muted-foreground">
                  Carregando snapshots...
                </div>
              ) : snapshots.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum registro MTM encontrado.
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead>Commodity</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">MTM</TableHead>
                        <TableHead>As of</TableHead>
                        <TableHead>Criado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {snapshots.map((snap) => (
                        <TableRow key={snap.id}>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{snap.object_type}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{snap.object_id ?? '-'}</TableCell>
                          <TableCell>{snap.product || '-'}</TableCell>
                          <TableCell>{snap.period || '-'}</TableCell>
                          <TableCell className="text-right font-mono">${snap.price}</TableCell>
                          <TableCell className="text-right">{snap.quantity_mt} MT</TableCell>
                          <TableCell className={cn(
                            "text-right font-bold",
                            (snap.mtm_value || 0) >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {formatCurrency(snap.mtm_value)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{snap.as_of_date}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(snap.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="text-sm text-muted-foreground text-right">
                    Valor total em tela: {formatCurrency(totalSnapshotMtm)}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hedges Tab */}
        <TabsContent value="hedges" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hedges Ativos</CardTitle>
                  <CardDescription>Posições de hedge registradas</CardDescription>
                </div>
                <Button onClick={fetchHedges} disabled={loadingHedges} variant="outline" size="sm">
                  {loadingHedges ? 'Atualizando...' : 'Atualizar Lista'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingHedges ? (
                <div className="text-center py-12 text-muted-foreground">
                  Carregando hedges...
                </div>
              ) : hedges.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum hedge cadastrado.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {hedges.map((hedge) => (
                    <Card key={hedge.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">Hedge #{hedge.id}</CardTitle>
                            <CardDescription className="text-xs">
                              {hedgeLabel(hedge, salesOrders, counterparties)}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="capitalize">{hedge.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Preço Contrato</p>
                            <p className="font-semibold">${hedge.contract_price}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Preço Mercado</p>
                            <p className="font-semibold">${hedge.current_market_price ?? '-'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">MTM Atual</p>
                            <p className={cn(
                              "text-lg font-bold",
                              (hedge.mtm_value || 0) >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {formatCurrency(hedge.mtm_value)}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">Criado em</p>
                            <p className="text-sm">{new Date(hedge.created_at).toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Register MTM Tab */}
        <TabsContent value="register" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Snapshot MTM</CardTitle>
              <CardDescription>Criar novo registro de mark-to-market</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSnapshotSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="object_type">Tipo de Objeto *</Label>
                    <Select
                      value={snapshotForm.object_type}
                      onValueChange={(value: MarketObjectType) =>
                        setSnapshotForm(prev => ({ ...prev, object_type: value, object_id: '' }))
                      }
                    >
                      <SelectTrigger id="object_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={MarketObjectType.HEDGE}>Hedge</SelectItem>
                        <SelectItem value={MarketObjectType.EXPOSURE}>Exposure</SelectItem>
                        <SelectItem value={MarketObjectType.NET}>Exposição Líquida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(snapshotForm.object_type === MarketObjectType.HEDGE ||
                    snapshotForm.object_type === MarketObjectType.EXPOSURE) && (
                    <div className="space-y-2">
                      <Label htmlFor="object_id">Entidade *</Label>
                      <Select
                        value={snapshotForm.object_id}
                        onValueChange={(value) => {
                          const opts = snapshotForm.object_type === MarketObjectType.HEDGE ? hedgeOptions : exposureOptions;
                          const selected = opts.find(o => String(o.id) === value);
                          setSnapshotForm(prev => ({
                            ...prev,
                            object_id: value,
                            product: selected?.product || '',
                            period: selected?.period || '',
                          }));
                        }}
                      >
                        <SelectTrigger id="object_id">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(snapshotForm.object_type === MarketObjectType.HEDGE ? hedgeOptions : exposureOptions).map((opt) => (
                            <SelectItem key={opt.id} value={String(opt.id)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {snapshotForm.object_type === MarketObjectType.NET && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="product">Commodity *</Label>
                        <Input
                          id="product"
                          value={snapshotForm.product}
                          onChange={(e) => setSnapshotForm(prev => ({ ...prev, product: e.target.value }))}
                          placeholder="Aluminum"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="period">Período *</Label>
                        <Input
                          id="period"
                          value={snapshotForm.period}
                          onChange={(e) => setSnapshotForm(prev => ({ ...prev, period: e.target.value }))}
                          placeholder="2026-04"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="price">Preço de Mercado *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={snapshotForm.price}
                      onChange={(e) => setSnapshotForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="2500.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="as_of_date">Data de Referência *</Label>
                    <Input
                      id="as_of_date"
                      type="date"
                      value={snapshotForm.as_of_date}
                      onChange={(e) => setSnapshotForm(prev => ({ ...prev, as_of_date: e.target.value }))}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={savingSnapshot} className="w-full">
                  {savingSnapshot ? 'Registrando...' : 'Registrar Snapshot MTM'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Prices Tab */}
        <TabsContent value="prices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Preço de Mercado</CardTitle>
              <CardDescription>Adicionar cotação manual</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePriceSubmit} className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Símbolo *</Label>
                    <Input
                      id="symbol"
                      value={priceForm.symbol}
                      onChange={(e) => setPriceForm(prev => ({ ...prev, symbol: e.target.value }))}
                      placeholder="AL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contract_month">Contrato *</Label>
                    <Input
                      id="contract_month"
                      value={priceForm.contract_month}
                      onChange={(e) => setPriceForm(prev => ({ ...prev, contract_month: e.target.value }))}
                      placeholder="2026-04"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="market_price">Preço *</Label>
                    <Input
                      id="market_price"
                      type="number"
                      step="0.01"
                      value={priceForm.price}
                      onChange={(e) => setPriceForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="2500.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Moeda</Label>
                    <Select
                      value={priceForm.currency}
                      onValueChange={(value) => setPriceForm(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="BRL">BRL</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="as_of_price">Data/Hora *</Label>
                    <Input
                      id="as_of_price"
                      type="datetime-local"
                      value={priceForm.as_of}
                      onChange={(e) => setPriceForm(prev => ({ ...prev, as_of: e.target.value }))}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={savingPrice} className="w-full">
                  {savingPrice ? 'Registrando...' : 'Registrar Preço de Mercado'}
                </Button>
              </form>

              {marketPrices.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h4 className="font-semibold mb-3">Últimos Preços Registrados</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Símbolo</TableHead>
                          <TableHead>Contrato</TableHead>
                          <TableHead className="text-right">Preço</TableHead>
                          <TableHead>Moeda</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marketPrices.map((price) => (
                          <TableRow key={price.id}>
                            <TableCell className="font-medium">{price.symbol}</TableCell>
                            <TableCell>{price.contract_month}</TableCell>
                            <TableCell className="text-right font-mono">{price.price}</TableCell>
                            <TableCell>{price.currency}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(price.as_of).toLocaleString('pt-BR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
