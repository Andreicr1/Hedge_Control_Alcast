import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Send } from 'lucide-react';
import { useData } from '../../../contexts/DataContextAPI';
import { rankRfq } from '../../../utils/rfqRanking';

export const FinanceiroRFQs = () => {
  const { rfqs, loadingRfqs } = useData();
  const navigate = useNavigate();

  return (
    <div className="p-5 space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">RFQs</h2>
          <p className="text-sm text-muted-foreground">Pedidos de cotação</p>
        </div>
        <button
          onClick={() => navigate('/financeiro/novorfq')}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm"
        >
          <Plus className="w-4 h-4" />
          Novo RFQ
        </button>
      </div>

      <div className="bg-card border rounded-lg p-4">
        {loadingRfqs ? (
          <div className="text-muted-foreground text-sm">Carregando RFQs...</div>
        ) : rfqs.length === 0 ? (
          <div className="text-muted-foreground text-sm border rounded-md p-4 bg-muted/40">
            Nenhum RFQ registrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2 border-b">RFQ</th>
                  <th className="text-left px-3 py-2 border-b">SO</th>
                  <th className="text-left px-3 py-2 border-b">Qtd</th>
                  <th className="text-left px-3 py-2 border-b">Período</th>
                  <th className="text-left px-3 py-2 border-b">Lado</th>
                  <th className="text-left px-3 py-2 border-b">Status</th>
                  <th className="text-left px-3 py-2 border-b">Vencedor</th>
                  <th className="text-left px-3 py-2 border-b">Convites</th>
                  <th className="text-left px-3 py-2 border-b">Ranking</th>
                  <th className="text-left px-3 py-2 border-b">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.map((rfq) => {
                  const ranking = rankRfq(rfq);
                  const best = ranking.entries[0];
                  const invites = rfq.invitations?.length || rfq.counterparty_quotes.length;
                  const answered = rfq.counterparty_quotes.filter((q) => q.status === 'answered' || q.status === 'quoted').length;
                  return (
                    <tr key={rfq.id} className="border-b last:border-none align-top">
                      <td className="px-3 py-2 font-medium">{rfq.rfq_number}</td>
                      <td className="px-3 py-2">{rfq.so_id}</td>
                      <td className="px-3 py-2">{rfq.quantity_mt} MT</td>
                      <td className="px-3 py-2">{rfq.period}</td>
                      <td className="px-3 py-2 capitalize text-xs">{ranking.side === 'buy' ? 'Compra' : 'Venda'}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-1 rounded-full bg-muted text-[12px] capitalize">{rfq.status}</span>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {rfq.winner_quote_id
                          ? ranking.sorted.find((q) => q.id === rfq.winner_quote_id)?.counterparty_name || 'Registrada'
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {answered}/{invites || '-'} respondidos
                      </td>
                      <td className="px-3 py-2">
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
                                  <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] capitalize">{entry.trades.length > 1 ? `${entry.trades.length} trades` : '1 trade'}</span>
                                </span>
                              </div>
                            ))}
                            {best && (
                              <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">
                                Melhor: {best.counterparty_name} ({best.display})
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                          onClick={() => navigate(`/financeiro/rfqs/${rfq.id}`)}
                        >
                          <Send className="w-3 h-3" />
                          Detalhar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
