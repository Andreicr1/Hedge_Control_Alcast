import React, { useEffect, useMemo, useState } from 'react';
import { netExposureService, NetExposureRow } from '../../../services/netExposureService';
import { useData } from '../../../contexts/DataContextAPI';

export const NetExposure = () => {
  const { exposures, hedges, salesOrders } = useData();
  const [rows, setRows] = useState<NetExposureRow[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="p-6 space-y-4">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Financeiro</p>
        <h2 className="text-xl font-semibold">Exposição Líquida</h2>
        <p className="text-muted-foreground">Consolidação por commodity e período</p>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : rows.length === 0 ? (
        <div className="text-muted-foreground">Sem dados disponíveis.</div>
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
              {rows.map((row, idx) => (
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
  );
};
