import React, { useMemo, useState } from "react";
import { useData } from "../../../contexts/DataContextAPI";
import { HedgeStatus } from "../../../types/api";
import { cn } from "../../components/ui/utils";
import { Button } from "../../components/ui/button";
import { FigmaSurface } from "../../components/ui/figma";
import { Page } from "../../components/ui/page";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

type ContratoRow = {
  id: number;
  contraparte: string;
  periodo: string;
  quantidadeMt: number;
  precoFixado: number;
  precoVariavel?: number | null;
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

export const FinanceiroContratos = () => {
  const { hedges, counterparties } = useData();
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const rows: ContratoRow[] = useMemo(() => {
    return hedges
      .filter((h) => h.status === HedgeStatus.ACTIVE)
      .map((h) => {
        const cp = counterparties.find((c) => c.id === h.counterparty_id);
        return {
          id: h.id,
          contraparte: cp?.name || 'Contraparte',
          periodo: h.period || '—',
          quantidadeMt: h.quantity_mt,
          precoFixado: h.contract_price,
          precoVariavel: h.current_market_price,
          mtmDia: h.mtm_value,
        };
      })
      .sort((a, b) => a.contraparte.localeCompare(b.contraparte));
  }, [hedges, counterparties]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(rows.length / pageSize)),
    [rows.length, pageSize],
  );

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const pageRangeLabel = useMemo(() => {
    if (rows.length === 0) return "0-0 de 0";
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, rows.length);
    return `${start}-${end} de ${rows.length}`;
  }, [rows.length, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [pageSize]);

  return (
    <Page>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[24px] font-normal leading-[normal] text-foreground truncate">
            Contratos
          </h1>
          <p className="text-sm text-muted-foreground">{rows.length} ativos</p>
                  </div>
                  </div>

      <FigmaSurface>
        <div className="p-4">
          <div className="overflow-x-auto">
            <Table className="text-[14px]">
              <TableHeader className="bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[12px] font-normal">Contraparte</TableHead>
                  <TableHead className="text-[12px] font-normal">Período</TableHead>
                  <TableHead className="text-[12px] font-normal">Quantidade</TableHead>
                  <TableHead className="text-[12px] font-normal">Preço (fixado)</TableHead>
                  <TableHead className="text-[12px] font-normal">Preço (variável)</TableHead>
                  <TableHead className="text-[12px] font-normal">MTM do dia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                    <TableCell className="text-sm text-muted-foreground" colSpan={6}>
                    Nenhum contrato ativo.
                  </TableCell>
                </TableRow>
              ) : (
                  pageItems.map((c, idx) => (
                    <TableRow
                      key={c.id}
                      className={cn(
                        "h-10",
                        idx % 2 === 1 ? "bg-[var(--white-secondary,#f1f2f5)]" : "bg-card",
                      )}
                    >
                    <TableCell className="font-medium">{c.contraparte}</TableCell>
                    <TableCell>{c.periodo}</TableCell>
                    <TableCell>{formatQuantidade(c.quantidadeMt)}</TableCell>
                      <TableCell className="font-mono">USD {formatPreco(c.precoFixado)}</TableCell>
                      <TableCell className="font-mono">USD {formatPreco(c.precoVariavel)}</TableCell>
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
        </div>

        <div className="flex items-center justify-between gap-4 px-4 pb-4 pt-2">
          <div className="text-[14px] font-medium text-foreground">
            {pageRangeLabel}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-[6px]"
              onClick={() => setPage(1)}
              disabled={page <= 1}
              aria-label="Primeira página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-[6px]"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-[6px]"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-[6px]"
              onClick={() => setPage(pageCount)}
              disabled={page >= pageCount}
              aria-label="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-foreground">
              Linhas por página
            </span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-[90px] rounded-[6px] shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FigmaSurface>
    </Page>
  );
};
