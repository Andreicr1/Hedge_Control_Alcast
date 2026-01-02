import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Send,
} from "lucide-react";
import { useData } from '../../../contexts/DataContextAPI';
import { rankRfq } from '../../../utils/rfqRanking';
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
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
import { cn } from "../../components/ui/utils";

export const FinanceiroRFQs = () => {
  const { rfqs, loadingRfqs } = useData();
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const sortedRfqs = useMemo(() => {
    return [...rfqs].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  }, [rfqs]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(sortedRfqs.length / pageSize)),
    [sortedRfqs.length, pageSize],
  );

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRfqs.slice(start, start + pageSize);
  }, [sortedRfqs, page, pageSize]);

  const pageRangeLabel = useMemo(() => {
    if (sortedRfqs.length === 0) return "0-0 de 0";
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, sortedRfqs.length);
    return `${start}-${end} de ${sortedRfqs.length}`;
  }, [sortedRfqs.length, page, pageSize]);

  return (
    <Page>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[24px] font-normal leading-[normal] text-foreground truncate">
            RFQs
          </h1>
          <p className="text-sm text-muted-foreground">Pedidos de cotação</p>
        </div>
        <Button
          onClick={() => navigate("/financeiro/novorfq")}
          className="h-8 rounded-[6px] bg-[var(--primary-orange,#ffa548)] text-white hover:bg-[var(--primary-orange,#ffa548)]/90"
        >
            <Plus className="w-4 h-4" />
          Novo
          </Button>
      </div>

      <FigmaSurface>
        <div className="p-4">
        {loadingRfqs ? (
          <div className="text-muted-foreground text-sm">Carregando RFQs...</div>
          ) : sortedRfqs.length === 0 ? (
            <div className="text-muted-foreground text-sm">
            Nenhum RFQ registrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
              <Table className="text-[14px]">
                <TableHeader className="bg-card">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[12px] font-normal">RFQ</TableHead>
                    <TableHead className="text-[12px] font-normal">SO</TableHead>
                    <TableHead className="text-[12px] font-normal">Qtd</TableHead>
                    <TableHead className="text-[12px] font-normal">Período</TableHead>
                    <TableHead className="text-[12px] font-normal">Lado</TableHead>
                    <TableHead className="text-[12px] font-normal">Status</TableHead>
                    <TableHead className="text-[12px] font-normal">Vencedor</TableHead>
                    <TableHead className="text-[12px] font-normal">Convites</TableHead>
                    <TableHead className="text-[12px] font-normal">Ranking</TableHead>
                    <TableHead className="text-[12px] font-normal">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {pageItems.map((rfq, idx) => {
                  const ranking = rankRfq(rfq);
                  const best = ranking.entries[0];
                  const invites = rfq.invitations?.length || rfq.counterparty_quotes.length;
                  const answered = rfq.counterparty_quotes.filter((q) => q.status === 'answered' || q.status === 'quoted').length;
                  const winnerName = rfq.winner_quote_id
                    ? rfq.counterparty_quotes.find((q) => q.id === rfq.winner_quote_id)
                        ?.counterparty_name || "Registrada"
                    : "—";
                  return (
                      <TableRow
                        key={rfq.id}
                        className={cn(
                          "h-10 align-top",
                          idx % 2 === 1 ? "bg-[var(--white-secondary,#f1f2f5)]" : "bg-card",
                        )}
                      >
                      <TableCell className="font-medium">{rfq.rfq_number}</TableCell>
                      <TableCell>{rfq.so_id}</TableCell>
                      <TableCell>{rfq.quantity_mt} MT</TableCell>
                      <TableCell>{rfq.period}</TableCell>
                      <TableCell className="capitalize text-xs">
                        {ranking.side === "buy" ? "Compra" : "Venda"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {rfq.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{winnerName}</TableCell>
                      <TableCell className="text-xs">
                        {answered}/{invites || '-'} respondidos
                      </TableCell>
                      <TableCell>
                        {rfq.counterparty_quotes.length === 0 ? (
                          <span className="text-muted-foreground text-xs">Sem respostas</span>
                        ) : (
                          <div className="space-y-1">
                              {ranking.entries.map((entry, i) => (
                                <div key={`${entry.counterparty_name}-${i}`} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-2">
                                    <span className="inline-flex w-5 justify-center text-[11px] font-semibold text-muted-foreground">{i + 1}</span>
                                  {entry.counterparty_name || 'N/D'}
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className={`${i === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                    {entry.display}
                                  </span>
                                </span>
                              </div>
                            ))}
                            {best && (
                              <div className="text-[11px] text-success bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">
                                Melhor: {best.counterparty_name} ({best.display})
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => navigate(`/financeiro/rfqs/${rfq.id}`)}
                        >
                          <Send className="w-3 h-3" />
                          Detalhar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
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
