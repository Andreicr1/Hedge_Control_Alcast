import React from 'react';
import { useData } from '../../../contexts/DataContext';

export const FinanceiroMTM = () => {
  const { estoque } = useData();

  const totalCusto = estoque.reduce((sum, l) => sum + l.custoMedio * l.disponivel, 0);
  const totalMTM = estoque.reduce((sum, l) => sum + l.mtm * l.disponivel, 0);
  const pnl = totalMTM - totalCusto;

  return (
    <div className="p-6 space-y-6">
      <h2>Mark-to-Market</h2>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-muted-foreground mb-2">Custo Total</h3>
          <p className="text-2xl">R$ {totalCusto.toLocaleString()}</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-muted-foreground mb-2">MTM Total</h3>
          <p className="text-2xl">R$ {totalMTM.toLocaleString()}</p>
        </div>
        <div className={`bg-card border rounded-lg p-6 ${pnl >= 0 ? 'border-green-500' : 'border-red-500'}`}>
          <h3 className="text-muted-foreground mb-2">P&L</h3>
          <p className={`text-2xl ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            R$ {pnl.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-accent">
            <tr>
              <th className="text-left p-4">Produto</th>
              <th className="text-right p-4">Qtd</th>
              <th className="text-right p-4">Custo Médio</th>
              <th className="text-right p-4">MTM</th>
              <th className="text-right p-4">P&L</th>
            </tr>
          </thead>
          <tbody>
            {estoque.map((lote) => {
              const lotePnL = (lote.mtm - lote.custoMedio) * lote.disponivel;
              return (
                <tr key={lote.id} className="border-b">
                  <td className="p-4">{lote.produto}</td>
                  <td className="p-4 text-right">{lote.disponivel.toLocaleString()}</td>
                  <td className="p-4 text-right">R$ {lote.custoMedio.toLocaleString()}</td>
                  <td className="p-4 text-right">R$ {lote.mtm.toLocaleString()}</td>
                  <td className={`p-4 text-right ${lotePnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {lotePnL.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
