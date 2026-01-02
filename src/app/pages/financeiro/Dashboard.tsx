import React, { useEffect, useMemo, useState } from "react";
import { addBusinessDays, format, isSameDay, parseISO } from "date-fns";
import { ResponsiveContainer, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { useData } from "../../../contexts/DataContextAPI";
import {
  HedgeStatus,
  MarketObjectType,
  OrderStatus,
  type AluminumHistoryPoint,
  type AluminumQuote,
  type SettlementItem,
} from "../../../types/api";
import config from "../../../config/env";
import { aluminumService, type AluminumRange } from "../../../services/aluminumService";
import { settlementsService } from "../../../services/settlementsService";
import { Button } from "../../components/ui/button";
import { FigmaSurface } from "../../components/ui/figma";
import { Page } from "../../components/ui/page";
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

const formatUsdNumber = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "USD" });
};

const formatUsdPerTon = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD/ton`;
};

const formatPreco = (value?: number | null) => {
  if (value === undefined || value === null) return '—';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const derivePeriodFromDate = (date?: string | null) => (date ? date.slice(0, 7) : '');

const computeSettlementDate = (maturityDate?: string | null) => {
  if (!maturityDate) return null;
  try {
    const d = parseISO(maturityDate);
    return addBusinessDays(d, 2);
  } catch {
    return null;
  }
};

const settlementUrgencyTone = (settlementDate: Date, today: Date) => {
  if (isSameDay(settlementDate, today)) return "danger";
  const diffDays = Math.ceil((settlementDate.getTime() - today.getTime()) / 86400000);
  if (diffDays <= 3) return "warning";
  return "neutral";
};

const moneyTone = (valueUsd?: number | null) => {
  if (valueUsd === undefined || valueUsd === null) return "neutral";
  if (valueUsd > 0) return "success";
  if (valueUsd < 0) return "danger";
  return "neutral";
};

export const FinanceiroDashboard = () => {
  const { purchaseOrders, salesOrders, exposures, hedges, counterparties } = useData();
  const [isMtmExpanded, setIsMtmExpanded] = useState(false);
  const [alRange, setAlRange] = useState<AluminumRange>("30d");
  const [alQuote, setAlQuote] = useState<AluminumQuote | null>(null);
  const [alHistory, setAlHistory] = useState<AluminumHistoryPoint[]>([]);
  const [loadingAl, setLoadingAl] = useState(false);
  const [todaySettlements, setTodaySettlements] = useState<SettlementItem[]>([]);
  const [upcomingSettlements, setUpcomingSettlements] = useState<SettlementItem[]>([]);
  const [loadingSettlements, setLoadingSettlements] = useState(false);

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

  // Derivação local (fallback): settlement_date = maturity_date + 2 business days
  const derivedSettlementItems = useMemo<SettlementItem[]>(() => {
    const today = new Date();
    return hedges
      .filter((h) => h.status === HedgeStatus.ACTIVE)
      .map((h) => {
        const cp = counterparties.find((c) => c.id === h.counterparty_id);
        const settlement = computeSettlementDate(h.maturity_date);
        const settlementIso = settlement ? settlement.toISOString() : "";

        // Proxy: até o backend devolver settlement_value_usd, usamos MTM como sinal financeiro (não é settlement real).
        const proxySettlementValueUsd =
          typeof h.mtm_value === "number"
            ? h.mtm_value
            : typeof h.current_market_price === "number"
              ? (h.current_market_price - h.contract_price) * (h.quantity_mt || 0)
              : null;

        return {
          hedge_id: h.id,
          counterparty_id: h.counterparty_id,
          counterparty_name: cp?.name || "Contraparte",
          settlement_date: settlementIso,
          mtm_today_usd: h.mtm_value ?? null,
          settlement_value_usd: proxySettlementValueUsd,
        };
      })
      .filter((x) => Boolean(x.settlement_date))
      .sort((a, b) => a.settlement_date.localeCompare(b.settlement_date))
      // remove itens muito antigos
      .filter((x) => {
        try {
          const d = parseISO(x.settlement_date);
          return d.getTime() >= today.getTime() - 7 * 86400000;
        } catch {
          return true;
        }
      });
  }, [hedges, counterparties]);

  const derivedTodaySettlements = useMemo(() => {
    const today = new Date();
    return derivedSettlementItems.filter((x) => {
      try {
        return isSameDay(parseISO(x.settlement_date), today);
      } catch {
        return false;
      }
    });
  }, [derivedSettlementItems]);

  const derivedUpcomingSettlements = useMemo(() => {
    const today = new Date();
    return derivedSettlementItems
      .filter((x) => {
        try {
          return parseISO(x.settlement_date).getTime() >= today.setHours(0, 0, 0, 0);
        } catch {
          return false;
        }
      })
      .slice(0, 5);
  }, [derivedSettlementItems]);

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

  const totalSettlementTodayUsd = useMemo(() => {
    const list = todaySettlements.length ? todaySettlements : derivedTodaySettlements;
    return list.reduce((sum, x) => sum + (x.settlement_value_usd || 0), 0);
  }, [todaySettlements, derivedTodaySettlements]);

  const settlementTodayTone = moneyTone(totalSettlementTodayUsd);

  const spreadUsdPerTon = useMemo(() => {
    if (!alQuote) return null;
    return alQuote.ask - alQuote.bid;
  }, [alQuote]);

  // Load external market data + settlements (via backend). Em modo mock, gera dados locais.
  useEffect(() => {
    const load = async () => {
      setLoadingAl(true);
      try {
        if (config.useMockData) {
          const base = 2300;
          const now = new Date();
          const bid = base + Math.sin(now.getTime() / 8.64e7) * 20;
          const ask = bid + 3;
          setAlQuote({
            bid,
            ask,
            currency: "USD",
            unit: "ton",
            as_of: now.toISOString(),
            source: "mock",
          });
          const days = alRange === "7d" ? 7 : alRange === "30d" ? 30 : 365;
          const history: AluminumHistoryPoint[] = Array.from({ length: days }).map((_, i) => {
            const d = new Date(now.getTime() - (days - i) * 86400000);
            const mid = base + Math.sin(i / 7) * 35 + Math.cos(i / 11) * 12;
            return { ts: d.toISOString(), mid };
          });
          setAlHistory(history);
        } else {
          const [quote, history] = await Promise.all([
            aluminumService.getQuote(),
            aluminumService.getHistory(alRange),
          ]);
          setAlQuote(quote);
          setAlHistory(history);
        }
      } finally {
        setLoadingAl(false);
      }
    };
    load();
  }, [alRange]);

  useEffect(() => {
    const loadSettlements = async () => {
      setLoadingSettlements(true);
      try {
        if (config.useMockData) {
          setTodaySettlements([]);
          setUpcomingSettlements([]);
        } else {
          const [today, upcoming] = await Promise.all([
            settlementsService.getToday(),
            settlementsService.getUpcoming(5),
          ]);
          setTodaySettlements(today);
          setUpcomingSettlements(upcoming);
        }
      } catch {
        // fallback: usa derivação local a partir dos hedges
        setTodaySettlements([]);
        setUpcomingSettlements([]);
      } finally {
        setLoadingSettlements(false);
      }
    };
    loadSettlements();
  }, [hedges.length, counterparties.length]);

  const effectiveTodaySettlements = todaySettlements.length ? todaySettlements : derivedTodaySettlements;
  const effectiveUpcomingSettlements = upcomingSettlements.length ? upcomingSettlements : derivedUpcomingSettlements;

  return (
    <Page className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[24px] font-normal leading-[normal] text-foreground truncate">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Destaques do dia (settlement) + mercado (Alumínio) + MTM (somente contratos).
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FigmaSurface className="p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Alumínio (USD/ton)
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Compra (Bid)</p>
              <p className="text-lg font-semibold">
                {loadingAl ? "…" : formatUsdPerTon(alQuote?.bid)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Venda (Ask)</p>
              <p className="text-lg font-semibold">
                {loadingAl ? "…" : formatUsdPerTon(alQuote?.ask)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Spread: {spreadUsdPerTon == null ? "—" : `${spreadUsdPerTon.toFixed(2)} USD/ton`} •{" "}
            Atualizado: {alQuote?.as_of ? format(parseISO(alQuote.as_of), "dd/MM HH:mm") : "—"}
          </p>
        </FigmaSurface>

        <FigmaSurface className="p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
            MTM do dia (Contratos)
          </p>
          <p
            className={cn(
              "mt-2 text-2xl font-semibold",
              mtmTotals.diferenca >= 0 ? "text-emerald-700" : "text-rose-700",
            )}
          >
            {formatUsd(mtmTotals.diferenca)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ponta comprada {formatUsd(mtmTotals.pontaComprada)} • Ponta vendida {formatUsd(mtmTotals.pontaVendida)}
          </p>
        </FigmaSurface>

        <FigmaSurface
          className={cn(
            "p-4",
            settlementTodayTone === "danger" && "border-rose-200 bg-rose-50/40",
            settlementTodayTone === "success" && "border-emerald-200 bg-emerald-50/40",
            settlementTodayTone === "neutral" && effectiveTodaySettlements.length > 0 && "border-amber-200 bg-amber-50/30",
          )}
        >
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Vencimentos do dia (Settlement)
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <p className="text-2xl font-semibold">
              {effectiveTodaySettlements.length}
            </p>
            <p className={cn(
              "text-lg font-semibold",
              settlementTodayTone === "danger" && "text-rose-700",
              settlementTodayTone === "success" && "text-emerald-700",
            )}>
              {formatUsdNumber(totalSettlementTodayUsd)}
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Valor de liquidação (USD). {loadingSettlements ? "Atualizando…" : ""}
          </p>
        </FigmaSurface>
      </div>

      {/* Chart + settlements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <FigmaSurface className="lg:col-span-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium">Preço de mercado do Alumínio</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Série histórica (USD/ton) — 7D / 30D / 1Y.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(["7d", "30d", "1y"] as const).map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant={alRange === r ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 px-2 text-xs rounded-[6px]"
                  onClick={() => setAlRange(r)}
                >
                  {r.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4 h-[260px]">
            {loadingAl ? (
              <div className="text-sm text-muted-foreground">Carregando gráfico…</div>
            ) : alHistory.length === 0 ? (
              <div className="text-sm text-muted-foreground">Sem histórico disponível.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={alHistory}>
                  <XAxis
                    dataKey="ts"
                    tickFormatter={(v) => {
                      try {
                        return format(parseISO(v), alRange === "1y" ? "MM/yy" : "dd/MM");
                      } catch {
                        return "";
                      }
                    }}
                    minTickGap={20}
                  />
                  <YAxis
                    width={60}
                    tickFormatter={(v) => `${Number(v).toFixed(0)}`}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toFixed(2)} USD/ton`, "Preço"]}
                    labelFormatter={(label) => {
                      try {
                        return format(parseISO(String(label)), "dd/MM/yyyy HH:mm");
                      } catch {
                        return String(label);
                      }
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mid"
                    stroke="var(--ui-neutral,#6592b7)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </FigmaSurface>

        <div className="flex flex-col gap-3">
          <FigmaSurface className="p-4">
            <h2 className="text-sm font-medium">Vencimentos do dia</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Settlement hoje (USD). Destaque por cor para chamar atenção.
            </p>

            {effectiveTodaySettlements.length === 0 ? (
              <div className="mt-3 text-sm text-muted-foreground">
                Nenhum settlement hoje.
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {effectiveTodaySettlements.slice(0, 6).map((item, idx) => {
                  const tone = moneyTone(item.settlement_value_usd);
                  return (
                    <div
                      key={`${item.counterparty_name}-${idx}`}
                      className={cn(
                        "flex items-center justify-between rounded-[6px] border px-3 py-2",
                        tone === "danger" && "border-rose-200 bg-rose-50/40",
                        tone === "success" && "border-emerald-200 bg-emerald-50/40",
                      )}
                    >
                      <span className="text-sm font-medium truncate">
                        {item.counterparty_name}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          tone === "danger" && "text-rose-700",
                          tone === "success" && "text-emerald-700",
                        )}
                        title="Valor de liquidação (USD)"
                      >
                        {formatUsdNumber(item.settlement_value_usd)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-3 text-[11px] text-muted-foreground">
              Obs.: até o backend entregar settlement real, usamos um proxy (MTM) quando necessário.
            </p>
          </FigmaSurface>

          <FigmaSurface className="p-4">
            <h2 className="text-sm font-medium">Próximos vencimentos (Top 5)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Contraparte • Settlement date • MTM do dia.
            </p>

            <div className="mt-3 overflow-x-auto">
              <Table className="text-[14px]">
                <TableHeader className="bg-card">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[12px] font-normal">Contraparte</TableHead>
                    <TableHead className="text-[12px] font-normal">Data</TableHead>
                    <TableHead className="text-[12px] font-normal text-right">MTM (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                  {effectiveUpcomingSettlements.length === 0 ? (
                    <TableRow className="h-10">
                      <TableCell className="text-sm text-muted-foreground" colSpan={3}>
                        Sem próximos vencimentos (ou dados indisponíveis).
                  </TableCell>
                </TableRow>
              ) : (
                    effectiveUpcomingSettlements.map((item, idx) => {
                      const today = new Date();
                      const d = parseISO(item.settlement_date);
                      const urg = settlementUrgencyTone(d, today);
                      const mtmTone = moneyTone(item.mtm_today_usd);
                      return (
                        <TableRow
                          key={`${item.counterparty_name}-${idx}`}
                          className={cn(
                            "h-10",
                            idx % 2 === 1 ? "bg-[var(--white-secondary,#f1f2f5)]" : "bg-card",
                          )}
                        >
                          <TableCell className="font-medium">
                            <span
                              className={cn(
                                "inline-flex items-center gap-2",
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-flex h-2 w-2 rounded-full",
                                  urg === "danger" && "bg-rose-500",
                                  urg === "warning" && "bg-amber-500",
                                  urg === "neutral" && "bg-slate-300",
                                )}
                                title={urg === "danger" ? "Hoje" : urg === "warning" ? "Próximo" : "Planejado"}
                              />
                              <span className="truncate">{item.counterparty_name}</span>
                            </span>
                          </TableCell>
                          <TableCell>{format(d, "dd/MM/yyyy")}</TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-semibold",
                              mtmTone === "danger" && "text-rose-700",
                              mtmTone === "success" && "text-emerald-700",
                            )}
                          >
                            {formatUsdNumber(item.mtm_today_usd)}
                          </TableCell>
                  </TableRow>
                      );
                    })
              )}
            </TableBody>
          </Table>
        </div>
          </FigmaSurface>
        </div>
      </div>

      {/* B) MTM Consolidado */}
      <FigmaSurface className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-sm font-medium">MTM consolidado (contratos ativos)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Expandir mostra detalhamento por contraparte.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs rounded-[6px]"
            onClick={() => setIsMtmExpanded((v) => !v)}
          >
            {isMtmExpanded ? "Recolher" : "Expandir"}
          </Button>
        </div>

        {isMtmExpanded && (
          <div className="overflow-x-auto mt-3">
            <Table className="text-[14px]">
              <TableHeader className="bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[12px] font-normal">Contraparte</TableHead>
                  <TableHead className="text-[12px] font-normal">Quantidade</TableHead>
                  <TableHead className="text-[12px] font-normal">Preço (compra)</TableHead>
                  <TableHead className="text-[12px] font-normal">Preço (venda)</TableHead>
                  <TableHead className="text-[12px] font-normal">MTM do dia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeContracts.length === 0 ? (
                  <TableRow className="h-10">
                    <TableCell className="text-sm text-muted-foreground" colSpan={5}>
                      Nenhum contrato ativo.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeContracts.map((c, idx) => (
                    <TableRow
                      key={c.id}
                      className={cn(
                        "h-10",
                        idx % 2 === 1 ? "bg-[var(--white-secondary,#f1f2f5)]" : "bg-card",
                      )}
                    >
                      <TableCell className="font-medium">{c.contraparte}</TableCell>
                      <TableCell>{formatQuantidade(c.quantidadeMt)}</TableCell>
                      <TableCell className="font-mono">USD {formatPreco(c.precoCompra)}</TableCell>
                      <TableCell className="font-mono">USD {formatPreco(c.precoVenda)}</TableCell>
                      <TableCell
                        className={cn(
                          "font-semibold",
                          (c.mtmDia || 0) >= 0 ? "text-emerald-700" : "text-rose-700",
                        )}
                      >
                        {c.mtmDia === undefined || c.mtmDia === null ? "—" : formatUsd(c.mtmDia)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </FigmaSurface>

      {/* Exposições pendentes (tabela operacional) */}
      <FigmaSurface className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-sm font-medium">Exposições pendentes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              POs/SOs ativos sem hedge concluído.
            </p>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {pendingRows.length} itens
          </span>
        </div>

        <div className="overflow-x-auto mt-3">
          <Table className="text-[14px]">
            <TableHeader className="bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[12px] font-normal">Referência</TableHead>
                <TableHead className="text-[12px] font-normal">Commodity</TableHead>
                <TableHead className="text-[12px] font-normal">Quantidade</TableHead>
                <TableHead className="text-[12px] font-normal">Período</TableHead>
                <TableHead className="text-[12px] font-normal">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRows.length === 0 ? (
                <TableRow className="h-10">
                  <TableCell className="text-sm text-muted-foreground" colSpan={5}>
                    Nenhuma exposição pendente.
                  </TableCell>
                </TableRow>
              ) : (
                pendingRows.map((row, idx) => (
                  <TableRow
                    key={`${row.referencia}-${row.periodo}`}
                    className={cn(
                      "h-10",
                      idx % 2 === 1 ? "bg-[var(--white-secondary,#f1f2f5)]" : "bg-card",
                    )}
                  >
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
      </FigmaSurface>
    </Page>
  );
};
