import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Download, Filter } from 'lucide-react';

export const Estoque = () => {
  const { estoque } = useData();
  const [filtro, setFiltro] = useState('');

  const estoqueFiltrado = estoque.filter(
    (lote) =>
      lote.produto.toLowerCase().includes(filtro.toLowerCase()) ||
      lote.codigo.toLowerCase().includes(filtro.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ['Código', 'Produto', 'Disponível', 'Comprometido', 'Custo Médio', 'MTM', 'Chegada', 'Local'];
    const rows = estoqueFiltrado.map((l) => [
      l.codigo,
      l.produto,
      l.disponivel,
      l.comprometido,
      l.custoMedio,
      l.mtm,
      l.dataChegada,
      l.localizacao,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'estoque.csv';
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2>Estoque</h2>
          <p className="text-muted-foreground">Visualização consolidada de lotes</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrar por produto ou código..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Código</th>
                <th className="text-left p-3">Produto</th>
                <th className="text-right p-3">Disponível</th>
                <th className="text-right p-3">Comprometido</th>
                <th className="text-right p-3">Custo Médio</th>
                <th className="text-right p-3">MTM</th>
                <th className="text-left p-3">Chegada</th>
                <th className="text-left p-3">Local</th>
              </tr>
            </thead>
            <tbody>
              {estoqueFiltrado.map((lote) => (
                <tr key={lote.id} className="border-b hover:bg-accent/50">
                  <td className="p-3">{lote.codigo}</td>
                  <td className="p-3">{lote.produto}</td>
                  <td className="p-3 text-right">{lote.disponivel.toLocaleString()}</td>
                  <td className="p-3 text-right">{lote.comprometido.toLocaleString()}</td>
                  <td className="p-3 text-right">R$ {lote.custoMedio.toLocaleString()}</td>
                  <td className="p-3 text-right">R$ {lote.mtm.toLocaleString()}</td>
                  <td className="p-3">{new Date(lote.dataChegada).toLocaleDateString()}</td>
                  <td className="p-3">{lote.localizacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};