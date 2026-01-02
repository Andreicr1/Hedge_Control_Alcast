import React, { useMemo } from "react";
import { useData } from "../../../contexts/DataContextAPI";
import { HedgeStatus } from "../../../types/api";
import { cn } from "../../components/ui/utils";
import { Page, PageHeader, SectionCard } from "../../components/ui/page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

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

  return (
    <Page>
      <PageHeader title="Contratos" meta={`${rows.length} ativos`} />

      <SectionCard>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contraparte</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>
                  <div className="flex flex-col">
                    <span>Preço (fixado)</span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      Contrato
                    </span>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex flex-col">
                    <span>Preço (variável)</span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      Mercado (D-1)
                    </span>
                  </div>
                </TableHead>
                <TableHead>MTM do dia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="text-sm text-muted-foreground"
                    colSpan={6}
                  >
                    Nenhum contrato ativo.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.contraparte}</TableCell>
                    <TableCell>{c.periodo}</TableCell>
                    <TableCell>{formatQuantidade(c.quantidadeMt)}</TableCell>
                    <TableCell className="font-mono">
                      USD {formatPreco(c.precoFixado)}
                    </TableCell>
                    <TableCell className="font-mono">
                      USD {formatPreco(c.precoVariavel)}
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
      </SectionCard>
    </Page>
  );
};
