import React, { useMemo } from 'react';
import { useData } from '../../../contexts/DataContextAPI';
import { HedgeStatus } from '../../../types/api';
import { cn } from '../../components/ui/utils';

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
    <div className="p-6 space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contratos</h1>
        </div>
        <span className="text-xs text-muted-foreground">{rows.length} ativos</span>
      </div>

      <section className="bg-card border rounded-lg p-4 space-y-3">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 border-b">Contraparte</th>
                <th className="text-left px-3 py-2 border-b">Período</th>
                <th className="text-left px-3 py-2 border-b">Quantidade</th>
                <th className="text-left px-3 py-2 border-b">
                  <div className="flex flex-col">
                    <span>Preço (fixado)</span>
                    <span className="text-[11px] text-muted-foreground font-normal">Contrato</span>
                  </div>
                </th>
                <th className="text-left px-3 py-2 border-b">
                  <div className="flex flex-col">
                    <span>Preço (variável)</span>
                    <span className="text-[11px] text-muted-foreground font-normal">Mercado (D-1)</span>
                  </div>
                </th>
                <th className="text-left px-3 py-2 border-b">MTM do dia</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-sm text-muted-foreground" colSpan={6}>
                    Nenhum contrato ativo.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="border-b last:border-none">
                    <td className="px-3 py-2 font-medium">{c.contraparte}</td>
                    <td className="px-3 py-2">{c.periodo}</td>
                    <td className="px-3 py-2">{formatQuantidade(c.quantidadeMt)}</td>
                    <td className="px-3 py-2 font-mono">USD {formatPreco(c.precoFixado)}</td>
                    <td className="px-3 py-2 font-mono">USD {formatPreco(c.precoVariavel)}</td>
                    <td
                      className={cn(
                        'px-3 py-2 font-semibold',
                        (c.mtmDia || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700',
                      )}
                    >
                      {c.mtmDia === undefined || c.mtmDia === null ? '—' : formatUsd(c.mtmDia)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

