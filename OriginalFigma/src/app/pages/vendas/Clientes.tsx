import React from 'react';
import { useData } from '../../../contexts/DataContext';

export const VendasClientes = () => {
  const { contrapartes } = useData();
  const clientes = contrapartes.filter((c) => c.tipo === 'cliente');

  return (
    <div className="p-6 space-y-6">
      <h2>Clientes</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientes.map((cliente) => (
          <div key={cliente.id} className="bg-card border rounded-lg p-6 space-y-3">
            <h3>{cliente.nome}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{cliente.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Limite:</span>
                <span>R$ {cliente.limite.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
