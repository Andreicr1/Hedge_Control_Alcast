import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../contexts/DataContext';
import { Plus, Send } from 'lucide-react';

export const FinanceiroRFQs = () => {
  const { rfqs } = useData();
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2>RFQs - Request for Quotation</h2>
        <button 
          onClick={() => navigate('/financeiro/novorfq')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Novo RFQ
        </button>
      </div>

      <div className="space-y-4">
        {rfqs.map((rfq) => (
          <div key={rfq.id} className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex justify-between">
              <div>
                <h3>{rfq.id} - {rfq.produto}</h3>
                <p className="text-muted-foreground">{rfq.quantidade.toLocaleString()} kg</p>
              </div>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm h-fit">
                {rfq.status}
              </span>
            </div>

            {rfq.quotes.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="mb-3">Quotes Recebidos</h4>
                <div className="space-y-2">
                  {rfq.quotes.map((quote) => (
                    <div key={quote.id} className="flex justify-between items-center bg-accent/50 p-3 rounded-md">
                      <span>{quote.contraparte}</span>
                      <span>R$ {quote.preco.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};