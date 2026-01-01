import React, { useEffect, useMemo, useState } from 'react';
import { netExposureService, NetExposureRow } from '../../../services/netExposureService';
import { useData } from '../../../contexts/DataContextAPI';

export const NetExposure = () => {
  const { exposures, hedges, salesOrders } = useData();
  const [rows, setRows] = useState<NetExposureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const totals = useMemo(() => {
    if (loading) {
      return { grossActive: 0, grossPassive: 0, hedgedTotal: 0, netTotal: 0 };
    }
    const grossActive = rows.reduce((sum, row) => sum + row.gross_active, 0);
    const grossPassive = rows.reduce((sum, row) => sum + row.gross_passive, 0);
    const hedgedTotal = rows.reduce((sum, row) => sum + row.hedged, 0);
    const netTotal = rows.reduce((sum, row) => sum + row.net, 0);
    return { grossActive, grossPassive, hedgedTotal, netTotal };
  }, [rows, loading]);

  const fallbackRows = useMemo(() => {
    if (!exposures.length) return [];
    const bucket: Record<string, NetExposureRow> = {};
    exposures.forEach((exp) => {
      const period = exp.delivery_date?.slice(0, 7) || exp.sale_date?.slice(0, 7) || 'unknown';
      const key = `${exp.product || 'Commodity'}|${period}`;
      if (!bucket[key]) {
        bucket[key] = {
          product: exp.product || 'Commodity',
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
      if (bucket[key]) {
        bucket[key].hedged += h.quantity_mt;
      }
    });
    return Object.values(bucket).map((row) => ({
      ...row,
      net: row.gross_active - row.gross_passive - row.hedged,
    }));
  }, [exposures, hedges, salesOrders]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await netExposureService.getAll();
        setRows(data.length ? data : fallbackRows);
      } catch {
        setRows(fallbackRows);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fallbackRows]);

  return (
    <div className="p-5 space-y-5">
      <section className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Exposição Líquida</p>
            <h2 className="text-xl font-semibold">Origem do risco</h2>
          </div>
          <span className="text-xs text-muted-foreground">{rows.length ? `${rows.length} buckets` : 'Sem consolidação'}</span>
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-3">
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Exposição Líquida</p>
            <p className="mt-1 text-3xl font-semibold">
              {totals.netTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })} MT
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {rows.length ? 'Atualizado com consolidação' : 'Aguardando consolidação'}
            </p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Hedge aplicado</p>
            <p className="mt-1 text-lg font-semibold">
              {totals.hedgedTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })} MT
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Mitigação registrada</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="border rounded-lg p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Exposição ativa</p>
            <p className="mt-1 text-base font-semibold">
              {totals.grossActive.toLocaleString('en-US', { maximumFractionDigits: 2 })} MT
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Recebíveis e vendas</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Exposição passiva</p>
            <p className="mt-1 text-base font-semibold">
              {totals.grossPassive.toLocaleString('en-US', { maximumFractionDigits: 2 })} MT
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Pagamentos e compras</p>
          </div>
        </div>
      </section>

      <section className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Evidências por bucket</h3>
          <span className="text-xs text-muted-foreground">Detalhamento operacional</span>
        </div>
        {loading ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-md p-4 bg-muted/40">Sem dados disponíveis no momento.</div>
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
                {rows.map((row) => (
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
    </div>
  );
};
