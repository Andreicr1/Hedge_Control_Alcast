import React, { useEffect, useMemo, useState } from "react";
import { netExposureService, NetExposureRow } from "../../../services/netExposureService";
import { useData } from "../../../contexts/DataContextAPI";
import { Page, PageHeader, SectionCard } from "../../components/ui/page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

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
    <Page>
      <PageHeader
        title="Exposição Líquida"
        description="Origem do risco"
        meta={rows.length ? `${rows.length} buckets` : "Sem consolidação"}
      />

      <SectionCard>
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
      </SectionCard>

      <SectionCard title="Evidências por bucket" description="Detalhamento operacional">
        {loading ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-md p-4 bg-muted/40">Sem dados disponíveis no momento.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Exposição Ativa</TableHead>
                  <TableHead>Exposição Passiva</TableHead>
                  <TableHead>Hedge Aplicado</TableHead>
                  <TableHead>Exposição Líquida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={`${row.product}-${row.period}`}>
                    <TableCell>{row.product}</TableCell>
                    <TableCell>{row.period}</TableCell>
                    <TableCell>{row.gross_active}</TableCell>
                    <TableCell>{row.gross_passive}</TableCell>
                    <TableCell>{row.hedged}</TableCell>
                    <TableCell className="font-semibold">{row.net}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </Page>
  );
};
