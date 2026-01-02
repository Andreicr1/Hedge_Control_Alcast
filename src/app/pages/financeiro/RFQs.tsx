import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Send } from "lucide-react";
import { useData } from '../../../contexts/DataContextAPI';
import { rankRfq } from '../../../utils/rfqRanking';
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Page, PageHeader, SectionCard } from "../../components/ui/page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

export const FinanceiroRFQs = () => {
  const { rfqs, loadingRfqs } = useData();
  const navigate = useNavigate();

  return (
    <Page>
      <PageHeader
        title="RFQs"
        description="Pedidos de cotação"
        actions={
          <Button onClick={() => navigate("/financeiro/novorfq")} size="sm">
            <Plus className="w-4 h-4" />
            Novo RFQ
          </Button>
        }
      />

      <SectionCard>
        {loadingRfqs ? (
          <div className="text-muted-foreground text-sm">Carregando RFQs...</div>
        ) : rfqs.length === 0 ? (
          <div className="text-muted-foreground text-sm border rounded-md p-4 bg-muted/40">
            Nenhum RFQ registrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFQ</TableHead>
                  <TableHead>SO</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Lado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vencedor</TableHead>
                  <TableHead>Convites</TableHead>
                  <TableHead>Ranking</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqs.map((rfq) => {
                  const ranking = rankRfq(rfq);
                  const best = ranking.entries[0];
                  const invites = rfq.invitations?.length || rfq.counterparty_quotes.length;
                  const answered = rfq.counterparty_quotes.filter((q) => q.status === 'answered' || q.status === 'quoted').length;
                  const winnerName = rfq.winner_quote_id
                    ? rfq.counterparty_quotes.find((q) => q.id === rfq.winner_quote_id)
                        ?.counterparty_name || "Registrada"
                    : "—";
                  return (
                    <TableRow key={rfq.id} className="align-top">
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
                            {ranking.entries.map((entry, idx) => (
                              <div key={`${entry.counterparty_name}-${idx}`} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-2">
                                  <span className="inline-flex w-5 justify-center text-[11px] font-semibold text-muted-foreground">{idx + 1}</span>
                                  {entry.counterparty_name || 'N/D'}
                                </span>
                                <span className="flex items-center gap-2">
                                  <span className={`${idx === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                    {entry.display}
                                  </span>
                                  <Badge variant="secondary" className="text-[11px] capitalize">
                                    {entry.trades.length > 1
                                      ? `${entry.trades.length} trades`
                                      : "1 trade"}
                                  </Badge>
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
      </SectionCard>
    </Page>
  );
};
