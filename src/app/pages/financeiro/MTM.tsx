import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../../contexts/DataContextAPI';
import { netExposureService, NetExposureRow } from '../../../services/netExposureService';
import { mtmSnapshotsService } from '../../../services/mtmSnapshotsService';
import { marketPricesService } from '../../../services/marketPricesService';
import { Counterparty, Exposure, Hedge, MarketObjectType, MarketPrice, MTMSnapshot, MTMSnapshotCreate, SalesOrder } from '../../../types/api';

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

const formatCurrency = (value?: number) => (value === undefined || value === null ? '-' : value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }));

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

      const payload: MTMSnapshotCreate = {
        object_type: snapshotForm.object_type,
        price: Number(snapshotForm.price),
        as_of_date: snapshotForm.as_of_date || undefined,
      };
      if (snapshotForm.object_id) payload.object_id = Number(snapshotForm.object_id);
      if (snapshotForm.product) payload.product = snapshotForm.product;
      if (snapshotForm.period) payload.period = snapshotForm.period;

      await mtmSnapshotsService.create(payload);
      await loadSnapshots();
      setSnapshotForm((prev) => ({
        ...prev,
        price: '',
        object_id: prev.object_type === MarketObjectType.NET ? '' : prev.object_id,
      }));
    } catch (err: any) {
      console.error(err);
      setError('Erro ao registrar snapshot de MTM.');
    } finally {
      setSavingSnapshot(false);
    }
  };

  const handlePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrice(true);
    try {
      await marketPricesService.create({
        source: priceForm.source || 'manual',
        symbol: priceForm.symbol,
        contract_month: priceForm.contract_month || undefined,
        price: Number(priceForm.price),
        currency: priceForm.currency,
        as_of: new Date(priceForm.as_of).toISOString(),
        fx: priceForm.fx,
      });
      await loadMarketPrices();
      setPriceForm((prev) => ({ ...prev, price: '' }));
    } catch (err) {
      console.error(err);
      setError('Erro ao registrar preço de mercado.');
    } finally {
      setSavingPrice(false);
    }
  };

  const latestPrice = marketPrices[0];
  const effectiveNetRows = netRows.length ? netRows : fallbackNetRows;
  const netTotal = effectiveNetRows.reduce((sum, row) => sum + row.net, 0);
  const grossActive = effectiveNetRows.reduce((sum, row) => sum + row.gross_active, 0);
  const grossPassive = effectiveNetRows.reduce((sum, row) => sum + row.gross_passive, 0);
  const hedgedTotal = effectiveNetRows.reduce((sum, row) => sum + row.hedged, 0);
  const totalSnapshotMtm = snapshots.reduce((sum, snap) => sum + (snap.mtm_value || 0), 0);

  const renderObjectSelect = () => {
    if (snapshotForm.object_type === MarketObjectType.HEDGE) {
      return (
        <select
          required
          value={snapshotForm.object_id}
          onChange={(e) => {
            const value = e.target.value;
            setSnapshotForm((prev) => {
              const selected = hedgeOptions.find((h) => h.id === Number(value));
              return {
                ...prev,
                object_id: value,
                product: selected?.product || prev.product,
                period: selected?.period || prev.period,
              };
            });
          }}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">Selecionar hedge</option>
          {hedgeOptions.map((h) => (
            <option key={h.id} value={h.id}>
              {h.label}
            </option>
          ))}
        </select>
      );
    }
    if (snapshotForm.object_type === MarketObjectType.EXPOSURE) {
      return (
        <select
          required
          value={snapshotForm.object_id}
          onChange={(e) => {
            const value = e.target.value;
            setSnapshotForm((prev) => {
              const selected = exposureOptions.find((exp) => exp.id === Number(value));
              return {
                ...prev,
                object_id: value,
                product: selected?.product || prev.product,
                period: selected?.period || prev.period,
              };
            });
          }}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">Selecionar exposição</option>
          {exposureOptions.map((exp) => (
            <option key={exp.id} value={exp.id}>
              {exp.label}
            </option>
          ))}
        </select>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Financeiro</p>
          <h1 className="text-2xl font-semibold">Painel Financeiro</h1>
          <p className="text-sm text-muted-foreground">Exposição, hedge e MTM em uma visão única.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">MTM Atual</p>
          <h2 className="text-2xl font-bold mt-1">{latestSnapshot ? formatCurrency(latestSnapshot.mtm_value) : '-'}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {latestSnapshot ? `${latestSnapshot.product || 'Commodity'} • ${latestSnapshot.period || '-'}` : 'Aguardando cálculo'}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Exposição Bruta</p>
          <h2 className="text-2xl font-bold mt-1">{(grossActive + grossPassive).toLocaleString('en-US', { maximumFractionDigits: 2 })} MT</h2>
          <p className="text-xs text-muted-foreground mt-1">Ativa {grossActive.toFixed(0)} • Passiva {grossPassive.toFixed(0)}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Hedge Aplicado</p>
          <h2 className="text-2xl font-bold mt-1">{hedgedTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })} MT</h2>
          <p className="text-xs text-muted-foreground mt-1">Cobertura registrada</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Exposição Líquida</p>
          <h2 className="text-2xl font-bold mt-1">{netTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })} MT</h2>
          <p className="text-xs text-muted-foreground mt-1">{effectiveNetRows.length ? `${effectiveNetRows.length} buckets` : 'Aguardando dados'}</p>
        </div>
      </div>

      {error && <div className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-2 rounded">Não foi possível carregar agora.</div>}

      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Fonte de preço</h3>
          <span className="text-xs text-muted-foreground">Atualize o preço-base</span>
        </div>
        <form className="grid md:grid-cols-6 gap-3" onSubmit={handlePriceSubmit}>
          <input
            required
            placeholder="Fonte (ex: manual, LME)"
            value={priceForm.source}
            onChange={(e) => setPriceForm((prev) => ({ ...prev, source: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <input
            required
            placeholder="Símbolo (ex: LME-ALU)"
            value={priceForm.symbol}
            onChange={(e) => setPriceForm((prev) => ({ ...prev, symbol: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <input
            placeholder="Período/contrato (YYYY-MM)"
            value={priceForm.contract_month}
            onChange={(e) => setPriceForm((prev) => ({ ...prev, contract_month: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <input
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="Preço"
            value={priceForm.price}
            onChange={(e) => setPriceForm((prev) => ({ ...prev, price: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="datetime-local"
            required
            value={priceForm.as_of}
            onChange={(e) => setPriceForm((prev) => ({ ...prev, as_of: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
            <input
              id="fx-flag"
              type="checkbox"
              checked={priceForm.fx}
              onChange={(e) => setPriceForm((prev) => ({ ...prev, fx: e.target.checked }))}
              className="h-4 w-4"
            />
            <label htmlFor="fx-flag" className="text-sm">FX?</label>
          </div>
          <button
            type="submit"
            disabled={savingPrice}
            className="md:col-span-6 px-3 py-2 border rounded-md hover:bg-accent disabled:opacity-50"
          >
            {savingPrice ? 'Atualizando...' : 'Salvar preço'}
          </button>
        </form>
        {marketPrices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border rounded-md">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2 border-b">Símbolo</th>
                  <th className="text-left px-3 py-2 border-b">Fonte</th>
                  <th className="text-left px-3 py-2 border-b">Período</th>
                  <th className="text-left px-3 py-2 border-b">Preço</th>
                  <th className="text-left px-3 py-2 border-b">As of</th>
                </tr>
              </thead>
              <tbody>
                {marketPrices.map((mp) => (
                  <tr key={mp.id} className="border-b last:border-none">
                    <td className="px-3 py-2">{mp.symbol}</td>
                    <td className="px-3 py-2">{mp.source}</td>
                    <td className="px-3 py-2">{mp.contract_month || '-'}</td>
                    <td className="px-3 py-2">{mp.price}</td>
                    <td className="px-3 py-2">{new Date(mp.as_of).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Calcular MTM</h3>
          <span className="text-xs text-muted-foreground">Registro imutável</span>
        </div>
        <form className="grid md:grid-cols-3 gap-3" onSubmit={handleSnapshotSubmit}>
          <select
            value={snapshotForm.object_type}
            onChange={(e) => {
              const newType = e.target.value as MarketObjectType;
              setSnapshotForm((prev) => ({
                ...prev,
                object_type: newType,
                object_id: newType === MarketObjectType.NET ? '' : prev.object_id,
              }));
            }}
            className="px-3 py-2 border rounded-md"
          >
            <option value={MarketObjectType.HEDGE}>Hedge</option>
            <option value={MarketObjectType.EXPOSURE}>Exposure</option>
            <option value={MarketObjectType.NET}>Exposição Líquida</option>
          </select>

          {renderObjectSelect()}

          <input
            placeholder="Commodity"
            value={snapshotForm.product}
            onChange={(e) => setSnapshotForm((prev) => ({ ...prev, product: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <input
            placeholder="Período (YYYY-MM)"
            value={snapshotForm.period}
            onChange={(e) => setSnapshotForm((prev) => ({ ...prev, period: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <input
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="Preço usado"
            value={snapshotForm.price}
            onChange={(e) => setSnapshotForm((prev) => ({ ...prev, price: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="date"
            value={snapshotForm.as_of_date}
            onChange={(e) => setSnapshotForm((prev) => ({ ...prev, as_of_date: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <button
            type="submit"
            disabled={savingSnapshot}
            className="md:col-span-3 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {savingSnapshot ? 'Calculando...' : 'Calcular e registrar MTM'}
          </button>
        </form>
      </div>

      <div className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Exposição por bucket</h3>
          <span className="text-xs text-muted-foreground">Consolidação</span>
        </div>
        {effectiveNetRows.length === 0 ? (
          <div className="text-muted-foreground text-sm">Sem dados de exposição.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border rounded-md">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2 border-b">Commodity</th>
                  <th className="text-left px-3 py-2 border-b">Período</th>
                  <th className="text-left px-3 py-2 border-b">Exposição Ativa</th>
                  <th className="text-left px-3 py-2 border-b">Exposição Passiva</th>
                  <th className="text-left px-3 py-2 border-b">Hedge Aplicado</th>
                  <th className="text-left px-3 py-2 border-b">Exposição Líquida</th>
                </tr>
              </thead>
              <tbody>
                {effectiveNetRows.map((row, idx) => (
                  <tr key={idx} className="border-b last:border-none">
                    <td className="px-3 py-2">{row.product}</td>
                    <td className="px-3 py-2">{row.period}</td>
                    <td className="px-3 py-2">{row.gross_active}</td>
                    <td className="px-3 py-2">{row.gross_passive}</td>
                    <td className="px-3 py-2">{row.hedged}</td>
                    <td className="px-3 py-2 font-semibold">{row.net}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Histórico MTM</h3>
          <div className="text-sm text-muted-foreground">Filtro por commodity, período e entidade</div>
        </div>
        <div className="grid md:grid-cols-5 gap-3">
          <select
            value={filters.object_type}
            onChange={(e) => setFilters((prev) => ({ ...prev, object_type: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">Tipo</option>
            <option value={MarketObjectType.HEDGE}>Hedge</option>
            <option value={MarketObjectType.EXPOSURE}>Exposure</option>
            <option value={MarketObjectType.NET}>Exposição Líquida</option>
          </select>
          <input
            placeholder="ID da entidade"
            value={filters.object_id}
            onChange={(e) => setFilters((prev) => ({ ...prev, object_id: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <input
            placeholder="Commodity"
            value={filters.product}
            onChange={(e) => setFilters((prev) => ({ ...prev, product: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <input
            placeholder="Período (YYYY-MM)"
            value={filters.period}
            onChange={(e) => setFilters((prev) => ({ ...prev, period: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <button
            className="px-4 py-2 bg-muted rounded-md"
            onClick={loadSnapshots}
            disabled={loadingSnapshots}
          >
            {loadingSnapshots ? 'Filtrando...' : 'Aplicar filtros'}
          </button>
        </div>

        {loadingSnapshots ? (
          <div className="text-muted-foreground">Carregando snapshots...</div>
        ) : snapshots.length === 0 ? (
          <div className="text-muted-foreground">Nenhum registro MTM encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border rounded-md">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2 border-b">Tipo</th>
                  <th className="text-left px-3 py-2 border-b">Entidade</th>
                  <th className="text-left px-3 py-2 border-b">Commodity</th>
                  <th className="text-left px-3 py-2 border-b">Período</th>
                  <th className="text-left px-3 py-2 border-b">Preço</th>
                  <th className="text-left px-3 py-2 border-b">Quantidade</th>
                  <th className="text-left px-3 py-2 border-b">MTM</th>
                  <th className="text-left px-3 py-2 border-b">As of</th>
                  <th className="text-left px-3 py-2 border-b">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((snap) => (
                  <tr key={snap.id} className="border-b last:border-none">
                    <td className="px-3 py-2 capitalize">{snap.object_type}</td>
                    <td className="px-3 py-2">{snap.object_id ?? '-'}</td>
                    <td className="px-3 py-2">{snap.product || '-'}</td>
                    <td className="px-3 py-2">{snap.period || '-'}</td>
                    <td className="px-3 py-2">{snap.price}</td>
                    <td className="px-3 py-2">{snap.quantity_mt}</td>
                    <td className="px-3 py-2 font-semibold">{formatCurrency(snap.mtm_value)}</td>
                    <td className="px-3 py-2">{snap.as_of_date}</td>
                    <td className="px-3 py-2">{new Date(snap.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          Valor total em tela: {formatCurrency(totalSnapshotMtm)}
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Hedges</h3>
          <button className="px-3 py-2 border rounded-md" onClick={fetchHedges} disabled={loadingHedges}>
            {loadingHedges ? 'Atualizando...' : 'Recarregar'}
          </button>
        </div>
        {loadingHedges ? (
          <div className="text-muted-foreground">Carregando hedges...</div>
        ) : hedges.length === 0 ? (
          <div className="text-muted-foreground">Nenhum hedge cadastrado.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {hedges.map((hedge) => (
              <div key={hedge.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Hedge {hedge.id}</h4>
                    <p className="text-sm text-muted-foreground">{hedgeLabel(hedge, salesOrders, counterparties)}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 capitalize">{hedge.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div>
                    <p className="text-muted-foreground">Preço contrato</p>
                    <p>{hedge.contract_price}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Preço mercado</p>
                    <p>{hedge.current_market_price ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">MTM atual</p>
                    <p className="font-semibold">{formatCurrency(hedge.mtm_value)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Criado em</p>
                    <p>{new Date(hedge.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
