import React from 'react';

export const FinanceiroRelatorios = () => {
  return (
    <div className="p-6 space-y-4">
      <h2>Relatórios</h2>
      <p className="text-muted-foreground">Relatórios derivam dos dados registrados em RFQs, hedges e ordens.</p>
      <div className="bg-card border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Use os endpoints da API para exportar dados consolidados.</p>
      </div>
    </div>
  );
};
