import React, { useMemo, useState } from "react";
import { useData } from "../../../contexts/DataContextAPI";
import { HedgeStatus, MarketObjectType, OrderStatus } from "../../../types/api";
import { Button } from "../../components/ui/button";
import { Page, PageHeader, SectionCard } from "../../components/ui/page";
import { cn } from "../../components/ui/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

type PendingExposureRow = {
  referencia: string;
  commodity: string;
  quantidadeMt: number;
  periodo: string;
  status: string;
};

type ContractRow = {
  id: number;
  contraparte: string;
  quantidadeMt: number;
  precoCompra: number;
  precoVenda?: number | null;
  mtmDia?: number | null;
};

const formatQuantidade = (value: number) =>
  `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} MT`;

const formatUsd = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' });

const formatPreco = (value?: number | null) => {
  if (value === undefined || value === null) return '—';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const derivePeriodFromDate = (date?: string | null) => (date ? date.slice(0, 7) : '');

export const FinanceiroDashboard = () => {
  const { purchaseOrders, salesOrders, exposures, hedges, counterparties } = useData();
  const [isMtmExpanded, setIsMtmExpanded] = useState(false);

  const pendingRows: PendingExposureRow[] = useMemo(() => {
    const exposureByKey = new Map<string, (typeof exposures)[number]>();
    exposures.forEach((exp) => {
      exposureByKey.set(`${String(exp.source_type).toLowerCase()}:${exp.source_id}`, exp);
    });

    const hedgedQtyBySo = new Map<number, number>();
    hedges
      .filter((h) => h.status !== HedgeStatus.CANCELLED)
      .forEach((h) => {
        if (!h.so_id) return;
        hedgedQtyBySo.set(h.so_id, (hedgedQtyBySo.get(h.so_id) || 0) + (h.quantity_mt || 0));
      });

    const isExposureConcluded = (exp?: (typeof exposures)[number]) => {
      if (!exp) return false;
      const status = String(exp.status || '').toLowerCase();
      if (status === 'hedged' || status === 'closed') return true;
      if (Array.isArray(exp.tasks) && exp.tasks.length > 0) {
        const allDone = exp.tasks.every((t) => t.status === 'hedged' || t.status === 'completed');
        if (allDone) return true;
      }
      return false;
    };

    const derivePeriodo = (exp?: (typeof exposures)[number], fallback?: { pricing_period?: string; fixing_deadline?: string; expected_delivery_date?: string; created_at?: string }) => {
      const expDate = exp?.delivery_date || exp?.sale_date || exp?.payment_date;
      if (expDate) return derivePeriodFromDate(expDate);
      if (fallback?.pricing_period) return fallback.pricing_period;
      if (fallback?.expected_delivery_date) return derivePeriodFromDate(fallback.expected_delivery_date);
      if (fallback?.fixing_deadline) return derivePeriodFromDate(fallback.fixing_deadline);
      if (fallback?.created_at) return derivePeriodFromDate(fallback.created_at);
      return '—';
    };

    const buildPoRows: PendingExposureRow[] = purchaseOrders
      .filter((po) => po.status === OrderStatus.ACTIVE)
      .map((po) => {
        const exp = exposureByKey.get(`${MarketObjectType.PO}:${po.id}`);
        const concluded = isExposureConcluded(exp);
        return {
          referencia: po.po_number || `PO-${po.id}`,
          commodity: exp?.product || po.product || '—',
          quantidadeMt: po.total_quantity_mt,
          periodo: derivePeriodo(exp, po),
          status: concluded ? 'Hedge concluído' : 'Sem hedge',
        };
      })
      .filter((row) => row.status !== 'Hedge concluído');

    const buildSoRows: PendingExposureRow[] = salesOrders
      .filter((so) => so.status === OrderStatus.ACTIVE)
      .map((so) => {
        const exp = exposureByKey.get(`${MarketObjectType.SO}:${so.id}`);
        const hedgedQty = hedgedQtyBySo.get(so.id) || 0;
        const concluded = isExposureConcluded(exp) || hedgedQty >= (so.total_quantity_mt || 0) - 1e-6;
        const status = concluded ? 'Hedge concluído' : hedgedQty > 0 ? 'Hedge parcial' : 'Sem hedge';
        return {
          referencia: so.so_number || `SO-${so.id}`,
          commodity: exp?.product || so.product || '—',
          quantidadeMt: so.total_quantity_mt,
          periodo: derivePeriodo(exp, so),
          status,
        };
      })
      .filter((row) => row.status !== 'Hedge concluído');

    return [...buildPoRows, ...buildSoRows].sort((a, b) => a.referencia.localeCompare(b.referencia));
  }, [purchaseOrders, salesOrders, exposures, hedges]);

  const activeContracts: ContractRow[] = useMemo(() => {
    return hedges
      .filter((h) => h.status === HedgeStatus.ACTIVE)
      .map((h) => {
        const cp = counterparties.find((c) => c.id === h.counterparty_id);
        return {
          id: h.id,
          contraparte: cp?.name || 'Contraparte',
          quantidadeMt: h.quantity_mt,
          precoCompra: h.contract_price,
          precoVenda: h.current_market_price,
          mtmDia: h.mtm_value,
        };
      });
  }, [hedges, counterparties]);

  const mtmTotals = useMemo(() => {
    const pontaComprada = activeContracts.reduce((sum, c) => sum + c.precoCompra * (c.quantidadeMt || 0), 0);
    const pontaVendida = activeContracts.reduce((sum, c) => {
      const base = c.precoCompra * (c.quantidadeMt || 0);
      if (c.precoVenda !== undefined && c.precoVenda !== null) {
        return sum + c.precoVenda * (c.quantidadeMt || 0);
      }
      if (c.mtmDia !== undefined && c.mtmDia !== null) {
        return sum + base + c.mtmDia;
      }
      return sum + base;
    }, 0);
    const diferenca = pontaVendida - pontaComprada;
    return { pontaComprada, pontaVendida, diferenca };
  }, [activeContracts]);

  return (
    <Page className="space-y-8">
      <PageHeader title="Dashboard" />

      {/* A) Exposições Pendentes */}
      <SectionCard title="Exposições pendentes" action={<span className="text-xs text-muted-foreground">{pendingRows.length} itens</span>}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referência</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRows.length === 0 ? (
                <TableRow>
                  <TableCell className="text-sm text-muted-foreground" colSpan={5}>
                    Nenhuma exposição pendente.
                  </TableCell>
                </TableRow>
              ) : (
                pendingRows.map((row) => (
                  <TableRow key={`${row.referencia}-${row.periodo}`}>
                    <TableCell className="font-medium">{row.referencia}</TableCell>
                    <TableCell>{row.commodity}</TableCell>
                    <TableCell>{formatQuantidade(row.quantidadeMt)}</TableCell>
                    <TableCell>{row.periodo}</TableCell>
                    <TableCell>{row.status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      {/* B) MTM Consolidado */}
      <SectionCard
        title="MTM consolidado (contratos ativos)"
        action={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setIsMtmExpanded((v) => !v)}
          >
            {isMtmExpanded ? "Recolher" : "Expandir"}
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="border rounded-lg p-3 bg-background">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Ponta comprada</p>
            <p className="mt-1 text-lg font-semibold">{formatUsd(mtmTotals.pontaComprada)}</p>
          </div>
          <div className="border rounded-lg p-3 bg-background">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Ponta vendida</p>
            <p className="mt-1 text-lg font-semibold">{formatUsd(mtmTotals.pontaVendida)}</p>
          </div>
          <div className="border rounded-lg p-3 bg-background">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Diferença</p>
            <p
              className={cn(
                'mt-1 text-lg font-semibold',
                mtmTotals.diferenca >= 0 ? 'text-emerald-700' : 'text-rose-700',
              )}
            >
              {formatUsd(mtmTotals.diferenca)}
            </p>
          </div>
        </div>

        {isMtmExpanded && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contraparte</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>
                    <div className="flex flex-col">
                      <span>Preço (compra)</span>
                      <span className="text-[11px] text-muted-foreground font-normal">
                        Fixado no contrato
                      </span>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex flex-col">
                      <span>Preço (venda)</span>
                      <span className="text-[11px] text-muted-foreground font-normal">
                        Variável (D-1)
                      </span>
                    </div>
                  </TableHead>
                  <TableHead>MTM do dia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeContracts.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-sm text-muted-foreground" colSpan={5}>
                      Nenhum contrato ativo.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeContracts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.contraparte}</TableCell>
                      <TableCell>{formatQuantidade(c.quantidadeMt)}</TableCell>
                      <TableCell className="font-mono">
                        USD {formatPreco(c.precoCompra)}
                      </TableCell>
                      <TableCell className="font-mono">
                        USD {formatPreco(c.precoVenda)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-semibold",
                          (c.mtmDia || 0) >= 0
                            ? "text-emerald-700"
                            : "text-rose-700",
                        )}
                      >
                        {c.mtmDia === undefined || c.mtmDia === null
                          ? "—"
                          : formatUsd(c.mtmDia)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </Page>
  );
};
