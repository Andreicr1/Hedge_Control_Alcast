import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../../contexts/DataContextAPI';
import { mtmSnapshotsService } from '../../../services/mtmSnapshotsService';
import { dealsService } from '../../../services/dealsService';
import { DealPnl, MTMSnapshot, RfqSide } from '../../../types/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Download } from 'lucide-react';

type NetRow = {
  product: string;
  period: string;
  gross_active: number;
  gross_passive: number;
  hedged: number;
  net: number;
};

  const deriveExposurePeriod = (date?: string | null) => (date ? date.slice(0, 7) : 'unknown');
  const formatMoney = (value?: number, currency = 'USD') =>
    value === undefined || value === null ? '-' : value.toLocaleString('pt-BR', { style: 'currency', currency });
  const dealRelevantPeriod = (d: DealPnl | null) => {
    if (!d) return '';
    return d.physical_legs[0]?.pricing_reference || d.hedge_legs[0]?.contract_period || '';
  };

export const FinanceiroRelatorios = () => {
  const { exposures, hedges, salesOrders, rfqs, counterparties } = useData();
  const [mtmSnapshots, setMtmSnapshots] = useState<MTMSnapshot[]>([]);
  const [loadingMtm, setLoadingMtm] = useState(false);
  const [filters, setFilters] = useState({ commodity: '', period: '', counterparty: '', status: '' });
  const [dealIdInput, setDealIdInput] = useState('');
  const [dealPnl, setDealPnl] = useState<DealPnl | null>(null);
  const [loadingDeal, setLoadingDeal] = useState(false);
  const [dealError, setDealError] = useState<string | null>(null);

  const netRows = useMemo(() => {
    const bucket: Record<string, NetRow> = {};
    exposures.forEach((exp) => {
      const period = deriveExposurePeriod(exp.delivery_date || exp.sale_date || exp.payment_date);
      const product = exp.product || 'Commodity';
      const key = `${product}|${period}`;
      if (!bucket[key]) {
        bucket[key] = {
          product,
          period,
          gross_active: 0,
          gross_passive: 0,
          hedged: 0,
          net: 0,
        };
      }
      if (exp.exposure_type === 'active') {
        bucket[key].gross_active += exp.quantity_mt;
      } else {
        bucket[key].gross_passive += exp.quantity_mt;
      }
    });

    hedges.forEach((h) => {
      const product = salesOrders.find((s) => s.id === h.so_id)?.product || 'Commodity';
      const key = `${product}|${h.period || 'unknown'}`;
      if (!bucket[key]) {
        bucket[key] = { product, period: h.period || 'unknown', gross_active: 0, gross_passive: 0, hedged: 0, net: 0 };
      }
      bucket[key].hedged += h.quantity_mt;
    });

    return Object.values(bucket).map((row) => ({
      ...row,
      net: row.gross_active - row.gross_passive - row.hedged,
    }));
  }, [exposures, hedges, salesOrders]);

  const filteredNetRows = netRows.filter((row) => {
    const byCommodity = filters.commodity ? row.product.toLowerCase().includes(filters.commodity.toLowerCase()) : true;
    const byPeriod = filters.period ? row.period.startsWith(filters.period) : true;
    const byCounterparty = filters.counterparty
      ? hedges.some((h) => String(h.counterparty_id) === filters.counterparty && (h.period || 'unknown') === row.period)
      : true;
    return byCommodity && byPeriod && byCounterparty;
  });

  const grossActive = filteredNetRows.reduce((sum, r) => sum + r.gross_active, 0);
  const grossPassive = filteredNetRows.reduce((sum, r) => sum + r.gross_passive, 0);
  const hedgedTotal = filteredNetRows.reduce((sum, r) => sum + r.hedged, 0);
  const netTotal = filteredNetRows.reduce((sum, r) => sum + r.net, 0);
  const matchesDealFilters = () => {
    if (!dealPnl) return true;
    const byCommodity = filters.commodity ? (dealPnl.commodity || '').toLowerCase().includes(filters.commodity.toLowerCase()) : true;
    const byStatus = filters.status ? dealPnl.status === filters.status : true;
    const period = dealRelevantPeriod(dealPnl);
    const byPeriod = filters.period ? period.startsWith(filters.period) : true;
    return byCommodity && byStatus && byPeriod;
  };

  const loadMtm = async () => {
    setLoadingMtm(true);
    try {
      const data = await mtmSnapshotsService.list({});
      setMtmSnapshots(data);
    } catch (err) {
      setMtmSnapshots([]);
    } finally {
      setLoadingMtm(false);
    }
  };

  useEffect(() => {
    loadMtm();
  }, []);

  const filteredMtm = mtmSnapshots.filter((snap) => {
    const byCommodity = filters.commodity ? snap.product?.toLowerCase().includes(filters.commodity.toLowerCase()) : true;
    const byPeriod = filters.period ? (snap.period || '').startsWith(filters.period) : true;
    return byCommodity && byPeriod;
  });

  const filteredRfqs = useMemo(() => {
    return rfqs.filter((rfq) => {
      const byPeriod = filters.period ? rfq.period.startsWith(filters.period) : true;
      const byCounterparty = filters.counterparty
        ? rfq.counterparty_quotes.some((q) => String(q.counterparty_id) === filters.counterparty)
        : true;
      return byPeriod && byCounterparty;
    });
  }, [rfqs, filters]);

  const computeSpread = (quotes: { quote_price: number }[], side: RfqSide) => {
    if (!quotes.length) return 0;
    const prices = quotes.map((q) => q.quote_price);
    const best = side === 'buy' ? Math.min(...prices) : Math.max(...prices);
    const worst = side === 'buy' ? Math.max(...prices) : Math.min(...prices);
    return Number((worst - best).toFixed(2));
  };

  const fetchDeal = async () => {
    if (!dealIdInput.trim()) {
      setDealError('Informe o deal_id');
      return;
    }
    setLoadingDeal(true);
    setDealError(null);
    try {
      const data = await dealsService.getPnl(Number(dealIdInput));
      setDealPnl(data);
    } catch (err) {
      setDealError('Não foi possível consultar o deal.');
      setDealPnl(null);
    } finally {
      setLoadingDeal(false);
    }
  };

  const exportCsv = (rows: Record<string, any>[], filename: string) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportNet = () =>
    exportCsv(
      filteredNetRows.map((r) => ({
        commodity: r.product,
        period: r.period,
        gross_active: r.gross_active,
        gross_passive: r.gross_passive,
        hedged: r.hedged,
        net: r.net,
      })),
      'exposicao.csv',
    );

  const exportMtm = () =>
    exportCsv(
      filteredMtm.map((m) => ({
        type: m.object_type,
        entity: m.object_id || '',
        commodity: m.product || '',
        period: m.period || '',
        price: m.price,
        quantity_mt: m.quantity_mt,
        mtm_value: m.mtm_value,
        as_of_date: m.as_of_date,
      })),
      'mtm.csv',
    );

  const exportRfqs = () =>
    exportCsv(
      filteredRfqs.map((r) => ({
        rfq: r.rfq_number,
        so: r.so_id,
        period: r.period,
        side: r.side || 'buy',
        status: r.status,
        quotes: r.counterparty_quotes.length,
      })),
      'rfqs.csv',
    );

  return (
    <div className="p-5 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Relatórios</h2>
        <p className="text-sm text-muted-foreground">Leitura executiva dos resultados por deal</p>
      </div>

      <div className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Deal Engine</p>
            <h3 className="text-lg font-semibold">Resultado econômico por deal_id</h3>
            <p className="text-sm text-muted-foreground">Visão executiva consolidada de físico e hedge.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Input
              placeholder="deal_id"
              value={dealIdInput}
              onChange={(e) => setDealIdInput(e.target.value)}
              className="h-10"
            />
            <Button onClick={fetchDeal} disabled={loadingDeal} className="h-10">
              {loadingDeal ? 'Consultando...' : 'Consultar'}
            </Button>
          </div>
        </div>
        {dealError && <p className="text-sm text-destructive">{dealError}</p>}
        {dealPnl ? (
          !matchesDealFilters() ? (
            <p className="text-sm text-muted-foreground">O deal informado não atende aos filtros atuais.</p>
          ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="border rounded-md p-3 bg-muted/40">
                <p className="text-xs text-muted-foreground">Deal</p>
                <p className="text-base font-semibold">#{dealPnl.deal_id}</p>
                <p className="text-xs text-muted-foreground">{dealPnl.commodity || 'Commodity'} · {dealPnl.status}</p>
                <p className="text-xs text-muted-foreground">{dealRelevantPeriod(dealPnl) || 'Período não informado'}</p>
              </div>
              <div className="border rounded-md p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground">Resultado total</p>
                <p className="text-xl font-semibold">{formatMoney(dealPnl.net_pnl, dealPnl.currency)}</p>
                <p className="text-xs text-muted-foreground">Atualizado {new Date(dealPnl.snapshot_at).toLocaleString()}</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="text-xs text-muted-foreground">Margem absoluta</p>
                <p className="text-lg font-semibold">{formatMoney(dealPnl.physical_revenue - dealPnl.physical_cost, dealPnl.currency)}</p>
                <p className="text-xs text-muted-foreground">Receita física: {formatMoney(dealPnl.physical_revenue, dealPnl.currency)}</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="text-xs text-muted-foreground">Margem percentual</p>
                <p className="text-lg font-semibold">
                  {dealPnl.physical_revenue > 0 ? `${((dealPnl.net_pnl / dealPnl.physical_revenue) * 100).toFixed(2)}%` : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Moeda: {dealPnl.currency}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Físico</h4>
                  <span className="text-xs text-muted-foreground">{dealPnl.physical_legs.length} entradas</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {dealPnl.physical_legs.map((leg) => (
                    <div key={`${leg.source}-${leg.source_id}`} className="text-sm border rounded p-2 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{leg.source} #{leg.source_id}</span>
                        <span className="text-xs text-muted-foreground">{leg.status || '—'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{leg.quantity_mt} MT · {leg.pricing_type || 'preço a definir'}</p>
                      <p className="text-xs text-muted-foreground">Direção: {leg.direction}</p>
                    </div>
                  ))}
                  {!dealPnl.physical_legs.length && <p className="text-xs text-muted-foreground">Nenhum componente físico vinculado.</p>}
                </div>
              </div>
              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Hedge</h4>
                  <span className="text-xs text-muted-foreground">{dealPnl.hedge_legs.length} posições</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {dealPnl.hedge_legs.map((leg) => (
                    <div key={leg.hedge_id} className="text-sm border rounded p-2 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Hedge #{leg.hedge_id}</span>
                        <span className="text-xs text-muted-foreground">{leg.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{leg.quantity_mt} MT · {leg.contract_period || 'período não definido'}</p>
                      <p className="text-xs text-muted-foreground">MTM: {formatMoney(leg.mtm_value, dealPnl.currency)}</p>
                    </div>
                  ))}
                  {!dealPnl.hedge_legs.length && <p className="text-xs text-muted-foreground">Nenhum hedge associado.</p>}
                </div>
              </div>
            </div>
          </div>
          )
        ) : (
          <p className="text-sm text-muted-foreground">Consulte um deal_id para ver o consolidado físico + hedge.</p>
        )}
      </div>

      <div className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Commodity</Label>
            <Input
              placeholder="Filtrar commodity"
              value={filters.commodity}
              onChange={(e) => setFilters((prev) => ({ ...prev, commodity: e.target.value }))}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Período (YYYY-MM)</Label>
            <Input
              placeholder="2024-02"
              value={filters.period}
              onChange={(e) => setFilters((prev) => ({ ...prev, period: e.target.value }))}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Contraparte</Label>
            <Select value={filters.counterparty} onValueChange={(value) => setFilters((prev) => ({ ...prev, counterparty: value }))}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {counterparties.map((cp) => (
                  <SelectItem key={cp.id} value={String(cp.id)}>
                    {cp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status do deal</Label>
            <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="open">open</SelectItem>
                <SelectItem value="partially_fixed">partially_fixed</SelectItem>
                <SelectItem value="fixed">fixed</SelectItem>
                <SelectItem value="settled">settled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <div className="bg-card border rounded-lg p-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Exposição líquida</p>
          <p className="text-2xl font-semibold mt-1">{netTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })} MT</p>
          <p className="text-xs text-muted-foreground mt-1">{filteredNetRows.length} buckets</p>
        </div>
        <div className="bg-card border rounded-lg p-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Exposição bruta</p>
          <p className="text-lg font-semibold mt-1">{(grossActive + grossPassive).toLocaleString('en-US', { maximumFractionDigits: 2 })} MT</p>
          <p className="text-xs text-muted-foreground mt-1">Ativa {grossActive.toFixed(0)} • Passiva {grossPassive.toFixed(0)}</p>
        </div>
        <div className="bg-card border rounded-lg p-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Hedge</p>
          <p className="text-lg font-semibold mt-1">{hedgedTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })} MT</p>
          <p className="text-xs text-muted-foreground mt-1">Cobertura registrada</p>
        </div>
        <div className="bg-card border rounded-lg p-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">RFQs</p>
          <p className="text-lg font-semibold mt-1">{filteredRfqs.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Na seleção atual</p>
        </div>
      </div>

      <section className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Exposição vs Hedge</h3>
          <Button variant="outline" size="sm" onClick={exportNet} disabled={!filteredNetRows.length}>
            <Download className="w-4 h-4" />
            CSV
          </Button>
        </div>
        {filteredNetRows.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/40">Sem dados para os filtros atuais.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2 border-b">Commodity</th>
                  <th className="text-left px-3 py-2 border-b">Período</th>
                  <th className="text-left px-3 py-2 border-b">Gross Ativa</th>
                  <th className="text-left px-3 py-2 border-b">Gross Passiva</th>
                  <th className="text-left px-3 py-2 border-b">Hedge</th>
                  <th className="text-left px-3 py-2 border-b">Líquida</th>
                </tr>
              </thead>
              <tbody>
                {filteredNetRows.map((row) => (
                  <tr key={`${row.product}-${row.period}`} className="border-b last:border-none">
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
      </section>

      <section className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">MTM por commodity/período</h3>
          <Button variant="outline" size="sm" onClick={exportMtm} disabled={!filteredMtm.length || loadingMtm}>
            <Download className="w-4 h-4" />
            CSV
          </Button>
        </div>
        {loadingMtm ? (
          <div className="text-sm text-muted-foreground">Carregando MTM...</div>
        ) : filteredMtm.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/40">Sem snapshots para os filtros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
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
                </tr>
              </thead>
              <tbody>
                {filteredMtm.map((snap) => (
                  <tr key={snap.id} className="border-b last:border-none">
                    <td className="px-3 py-2 capitalize text-xs">{snap.object_type}</td>
                    <td className="px-3 py-2">{snap.object_id || '-'}</td>
                    <td className="px-3 py-2">{snap.product || '-'}</td>
                    <td className="px-3 py-2">{snap.period || '-'}</td>
                    <td className="px-3 py-2">{snap.price}</td>
                    <td className="px-3 py-2">{snap.quantity_mt}</td>
                    <td className="px-3 py-2 font-semibold">{snap.mtm_value}</td>
                    <td className="px-3 py-2">{snap.as_of_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">RFQs e spreads</h3>
          <Button variant="outline" size="sm" onClick={exportRfqs} disabled={!filteredRfqs.length}>
            <Download className="w-4 h-4" />
            CSV
          </Button>
        </div>
        {filteredRfqs.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/40">Nenhum RFQ para os filtros aplicados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2 border-b">RFQ</th>
                  <th className="text-left px-3 py-2 border-b">Período</th>
                  <th className="text-left px-3 py-2 border-b">Lado</th>
                  <th className="text-left px-3 py-2 border-b">Status</th>
                  <th className="text-left px-3 py-2 border-b">Cotações</th>
                  <th className="text-left px-3 py-2 border-b">Spread</th>
                  <th className="text-left px-3 py-2 border-b">Melhor</th>
                </tr>
              </thead>
              <tbody>
                {filteredRfqs.map((rfq) => {
                  const side = rfq.side || 'buy';
                  const ranking = [...rfq.counterparty_quotes].sort((a, b) =>
                    side === 'buy' ? a.quote_price - b.quote_price : b.quote_price - a.quote_price,
                  );
                  const spread = computeSpread(rfq.counterparty_quotes, side);
                  const best = ranking[0];
                  return (
                    <tr key={rfq.id} className="border-b last:border-none align-top">
                      <td className="px-3 py-2 font-medium">{rfq.rfq_number}</td>
                      <td className="px-3 py-2">{rfq.period}</td>
                      <td className="px-3 py-2 capitalize text-xs">{side}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-1 rounded-full bg-muted text-[12px] capitalize">{rfq.status}</span>
                      </td>
                      <td className="px-3 py-2">
                        {rfq.counterparty_quotes.length === 0 ? (
                          <span className="text-muted-foreground text-xs">Sem respostas</span>
                        ) : (
                          <div className="space-y-1">
                            {ranking.map((quote, idx) => (
                              <div key={quote.id} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-2">
                                  <span className="inline-flex w-5 justify-center text-[11px] font-semibold text-muted-foreground">{idx + 1}</span>
                                  {quote.counterparty_name || 'N/D'}
                                </span>
                                <span className={`${idx === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                  USD {quote.quote_price.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">{spread.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        {best ? `${best.counterparty_name || 'N/D'} • ${best.quote_price.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
