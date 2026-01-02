import React, { useState } from "react";

import { useData } from "../../contexts/DataContextAPI";
import { locationsService } from "../../services/locationsService";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Page, PageHeader, SectionCard } from "../components/ui/page";

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
    <Page>
      <PageHeader
        title="Estoque"
        description="Localizações e posições de estoque (MT)"
      />

      <SectionCard title="Adicionar localização">
        <form
          onSubmit={handleSubmit}
          className="grid md:grid-cols-4 gap-3"
        >
          <div className="md:col-span-2 space-y-1">
            <Label>Nome do local</Label>
            <Input
              required
              placeholder="Ex: Porto de Santos"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Input
              required
              placeholder="porto, armazém..."
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Estoque atual (MT)</Label>
            <Input
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={formData.current_stock_mt}
              onChange={(e) =>
                setFormData({ ...formData, current_stock_mt: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Capacidade (MT)</Label>
            <Input
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={formData.capacity_mt}
              onChange={(e) => setFormData({ ...formData, capacity_mt: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={saving} className="md:col-span-4">
            {saving ? "Salvando..." : "Adicionar localização"}
          </Button>
        </form>
      </SectionCard>

      <SectionCard
        title="Localizações"
        action={
          <span className="text-xs text-muted-foreground">
            {locations.length} itens
          </span>
        }
      >
        {loadingLocations ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : locations.length === 0 ? (
          <div className="text-muted-foreground">Nenhuma localização cadastrada.</div>
        ) : (
          <div className="space-y-3">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="bg-card border rounded-lg p-4 flex justify-between"
              >
                <div>
                  <h3 className="font-semibold">{loc.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {loc.type || "Tipo não informado"} • Estoque:{" "}
                    {loc.current_stock_mt ?? 0} MT • Capacidade:{" "}
                    {loc.capacity_mt ?? 0} MT
                  </p>
                </div>
                <Badge variant="secondary">
                  {loc.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </Page>
  );
};
