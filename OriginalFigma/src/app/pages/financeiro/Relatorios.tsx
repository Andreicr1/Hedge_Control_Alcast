import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { Download, Filter } from 'lucide-react';

export const FinanceiroRelatorios = () => {
  const { pos, sos, contrapartes } = useData();
  const [filtroContraparte, setFiltroContraparte] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const exportCSV = () => {
    alert('Exportação CSV implementada');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2>Relatórios por Contraparte</h2>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-2 text-sm">Contraparte</label>
            <select
              value={filtroContraparte}
              onChange={(e) => setFiltroContraparte(e.target.value)}
              className="w-full px-4 py-2 border rounded-md bg-background"
            >
              <option value="">Todas</option>
              {contrapartes.map((cp) => (
                <option key={cp.id} value={cp.nome}>
                  {cp.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm">Data Início</label>
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="w-full px-4 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm">Data Fim</label>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="w-full px-4 py-2 border rounded-md bg-background"
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-muted-foreground mb-2">Total POs</h3>
          <p className="text-2xl">{pos.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-muted-foreground mb-2">Total SOs</h3>
          <p className="text-2xl">{sos.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-muted-foreground mb-2">Volume Total</h3>
          <p className="text-2xl">
            R$ {(pos.reduce((sum, po) => sum + po.total, 0) + sos.reduce((sum, so) => sum + so.total, 0)).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
