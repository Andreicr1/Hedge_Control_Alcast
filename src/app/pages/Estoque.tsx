import React, { useState } from 'react';
import { useData } from '../../contexts/DataContextAPI';
import { locationsService } from '../../services/locationsService';

export const Estoque = () => {
  const { locations, fetchLocations, loadingLocations } = useData();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    current_stock_mt: '',
    capacity_mt: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await locationsService.create({
        name: formData.name,
        type: formData.type,
        current_stock_mt: Number(formData.current_stock_mt),
        capacity_mt: Number(formData.capacity_mt),
      });
      await fetchLocations();
      setFormData({ name: '', type: '', current_stock_mt: '', capacity_mt: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2>Estoque</h2>
        <p className="text-muted-foreground">Localizações e posições de estoque (MT)</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-4 grid md:grid-cols-4 gap-3">
        <input
          required
          placeholder="Nome do local"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="px-3 py-2 border rounded-md md:col-span-2"
        />
        <input
          required
          placeholder="Tipo (porto, armazém...)"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="px-3 py-2 border rounded-md"
        />
        <input
          required
          type="number"
          min="0"
          step="0.01"
          placeholder="Estoque atual (MT)"
          value={formData.current_stock_mt}
          onChange={(e) => setFormData({ ...formData, current_stock_mt: e.target.value })}
          className="px-3 py-2 border rounded-md"
        />
        <input
          required
          type="number"
          min="0"
          step="0.01"
          placeholder="Capacidade (MT)"
          value={formData.capacity_mt}
          onChange={(e) => setFormData({ ...formData, capacity_mt: e.target.value })}
          className="px-3 py-2 border rounded-md"
        />
        <button
          type="submit"
          disabled={saving}
          className="md:col-span-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Adicionar localização'}
        </button>
      </form>

      <div className="space-y-3">
        {loadingLocations ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : locations.length === 0 ? (
          <div className="text-muted-foreground">Nenhuma localização cadastrada.</div>
        ) : (
          locations.map((loc) => (
            <div key={loc.id} className="bg-card border rounded-lg p-4 flex justify-between">
              <div>
                <h3 className="font-semibold">{loc.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {loc.type || 'Tipo não informado'} • Estoque: {loc.current_stock_mt ?? 0} MT • Capacidade: {loc.capacity_mt ?? 0} MT
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100">{loc.active ? 'Ativo' : 'Inativo'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
