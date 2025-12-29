import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Send } from 'lucide-react';
import { useData } from '../../../contexts/DataContextAPI';

export const FinanceiroRFQs = () => {
  const { rfqs, loadingRfqs } = useData();
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">RFQs</h2>
          <p className="text-muted-foreground">Solicitações às contrapartes</p>
        </div>
        <button
          onClick={() => navigate('/financeiro/novorfq')}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Novo RFQ
        </button>
      </div>

      <div className="space-y-3">
        {loadingRfqs ? (
          <div className="text-muted-foreground">Carregando RFQs...</div>
        ) : rfqs.length === 0 ? (
          <div className="text-muted-foreground">Nenhum RFQ cadastrado.</div>
        ) : (
          rfqs.map((rfq) => (
            <div key={rfq.id} className="bg-card border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{rfq.rfq_number}</h3>
                  <p className="text-sm text-muted-foreground">
                    SO: {rfq.so_id} • {rfq.quantity_mt} MT • Período {rfq.period}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-sm capitalize">{rfq.status}</span>
                  <button
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                    onClick={() => navigate('/financeiro/novorfq')}
                  >
                    <Send className="w-4 h-4" />
                    Reenviar / Editar
                  </button>
                </div>
              </div>
              {rfq.counterparty_quotes.length > 0 && (
                <div className="border-t pt-2 text-sm">
                  <p className="font-semibold mb-1">Quotes</p>
                  <div className="space-y-1">
                    {rfq.counterparty_quotes.map((quote) => (
                      <div key={quote.id} className="flex justify-between">
                        <span>{quote.counterparty_name || 'N/D'}</span>
                        <span>USD {quote.quote_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
