import React, { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Send } from "lucide-react";

import { useData } from "../../../contexts/DataContextAPI";
import { salesOrdersService } from "../../../services/salesOrdersService";
import { OrderStatus, PricingType } from "../../../types/api";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Page, PageHeader, SectionCard } from "../../components/ui/page";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";

type FormState = {
  customer_id: string;
  product: string;
  total_quantity_mt: number;
  unit: string;
  unit_price: number;
  pricing_type: PricingType;
  pricing_period: string;
  lme_premium: number;
  premium: number;
  reference_price: string;
  fixing_deadline: string;
  expected_delivery_date: string;
  location: string;
  notes: string;
};

const initialForm: FormState = {
  customer_id: '',
  product: '',
  total_quantity_mt: 0,
  unit: 'MT',
  unit_price: 0,
  pricing_type: PricingType.MONTHLY_AVERAGE,
  pricing_period: 'M+1',
  lme_premium: 0,
  premium: 0,
  reference_price: '',
  fixing_deadline: '',
  expected_delivery_date: '',
  location: '',
  notes: '',
};

const statusBadgeClass: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  pendente_financeiro: "bg-warning/10 text-warning border-warning/20",
  aprovado: "bg-success/10 text-success border-success/20",
  rejeitado: "bg-destructive/10 text-destructive border-destructive/20",
  active: "bg-primary/10 text-primary border-primary/20",
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'draft':
      return 'Rascunho';
    case 'pendente_financeiro':
      return 'Pendente Financeiro';
    case 'aprovado':
      return 'Aprovado';
    case 'rejeitado':
      return 'Rejeitado';
    case 'active':
      return 'Ativo';
    default:
      return status;
  }
};

export const VendasSOs = () => {
  const { salesOrders, customers, fetchSalesOrders, loadingSOs, loadingCustomers } = useData();
  const [selectedSO, setSelectedSO] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const sortedSOs = useMemo(
    () => [...salesOrders].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [salesOrders]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await salesOrdersService.create({
        customer_id: Number(formData.customer_id),
        product: formData.product,
        total_quantity_mt: Number(formData.total_quantity_mt),
        unit: formData.unit,
        unit_price: Number(formData.unit_price),
        pricing_type: formData.pricing_type,
        pricing_period: formData.pricing_period,
        lme_premium: Number(formData.lme_premium),
        premium: Number(formData.premium),
        reference_price: formData.reference_price,
        fixing_deadline: formData.fixing_deadline || undefined,
        expected_delivery_date: formData.expected_delivery_date || undefined,
        location: formData.location,
        notes: formData.notes,
      });
      await fetchSalesOrders();
      setFormData(initialForm);
      setCreateOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const openDetails = (so: any) => {
    setSelectedSO(so);
    setDetailsOpen(true);
  };

  return (
    <Page>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <PageHeader
          eyebrow="Vendas"
          title="Exposição Ativa (Vendas)"
          description="Ordens de venda em acompanhamento."
          actions={
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4" />
                Nova SO
              </Button>
            </DialogTrigger>
          }
        />

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Sales Order</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="customer-select">Cliente *</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, customer_id: value })
                  }
                  disabled={loadingCustomers}
                >
                  <SelectTrigger id="customer-select">
                    <SelectValue
                      placeholder={loadingCustomers ? "Carregando..." : "Selecione"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} {c.code ? `(${c.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Produto *</Label>
                <Input
                  required
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  placeholder="Billets, T-bars..."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  required
                  value={formData.total_quantity_mt}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      total_quantity_mt: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Unidade</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Preço Unitário</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) =>
                    setFormData({ ...formData, unit_price: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="pricing-type">Tipo de Precificação</Label>
                <Select
                  value={formData.pricing_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, pricing_type: value as PricingType })
                  }
                >
                  <SelectTrigger id="pricing-type">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PricingType.FIXED}>Fixo</SelectItem>
                    <SelectItem value={PricingType.TBF}>TBF</SelectItem>
                    <SelectItem value={PricingType.MONTHLY_AVERAGE}>Média mensal</SelectItem>
                    <SelectItem value={PricingType.LME_PREMIUM}>LME + Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Período</Label>
                <Input
                  value={formData.pricing_period}
                  onChange={(e) =>
                    setFormData({ ...formData, pricing_period: e.target.value })
                  }
                  placeholder="M+1"
                />
              </div>
              <div className="space-y-1">
                <Label>LME Premium</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.lme_premium}
                  onChange={(e) =>
                    setFormData({ ...formData, lme_premium: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Premium</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.premium}
                  onChange={(e) =>
                    setFormData({ ...formData, premium: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Preço de Referência</Label>
                <Input
                  value={formData.reference_price}
                  onChange={(e) =>
                    setFormData({ ...formData, reference_price: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Data Limite Fixação</Label>
                <Input
                  type="date"
                  value={formData.fixing_deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, fixing_deadline: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Entrega Prevista</Label>
                <Input
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expected_delivery_date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Localização</Label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar SO"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SectionCard>
        {loadingSOs ? (
          <div className="text-muted-foreground">Carregando SOs...</div>
        ) : sortedSOs.length === 0 ? (
          <div className="text-muted-foreground">
            Nenhuma Sales Order cadastrada.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedSOs.map((so) => (
              <div
                key={so.id}
                className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">
                      {so.so_number} - {so.customer?.name}
                    </h3>
                    <p className="text-muted-foreground">
                      {so.product || "Produto não informado"}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={statusBadgeClass[so.status] || statusBadgeClass.draft}
                  >
                    {statusLabel(so.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Quantidade:</span>
                    <p>
                      {so.total_quantity_mt.toLocaleString()} {so.unit || "MT"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Preço Unitário:</span>
                    <p>
                      {so.unit_price
                        ? `US$ ${so.unit_price.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span>
                    <p className="font-medium">
                      {so.unit_price
                        ? `US$ ${(so.unit_price * so.total_quantity_mt).toLocaleString(
                            "en-US",
                            { minimumFractionDigits: 2 },
                          )}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entrega:</span>
                    <p>
                      {so.expected_delivery_date
                        ? new Date(so.expected_delivery_date).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 mt-4 border-t">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openDetails(so)}
                  >
                    <Eye className="w-4 h-4" />
                    Ver detalhes completos
                  </Button>

                  {so.status === "draft" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        salesOrdersService
                          .update(so.id, { status: OrderStatus.ACTIVE })
                          .then(fetchSalesOrders)
                      }
                    >
                      <Send className="w-4 h-4" />
                      Enviar ao Financeiro
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSO && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes da Sales Order</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedSO.so_number}
                </p>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    variant="secondary"
                    className={
                      statusBadgeClass[selectedSO.status] || statusBadgeClass.draft
                    }
                  >
                    {statusLabel(selectedSO.status)}
                  </Badge>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-muted-foreground">Informações do Cliente</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <Info label="Cliente" value={selectedSO.customer?.name} />
                    <Info label="Produto" value={selectedSO.product} />
                    <Info
                      label="Quantidade"
                      value={`${selectedSO.total_quantity_mt} ${selectedSO.unit || ""}`}
                    />
                    <Info
                      label="Preço Unitário"
                      value={selectedSO.unit_price ? `US$ ${selectedSO.unit_price}` : "—"}
                    />
                    <Info label="Tipo" value={selectedSO.pricing_type} />
                    <Info label="Período" value={selectedSO.pricing_period} />
                    <Info label="Premium" value={selectedSO.premium ?? selectedSO.lme_premium} />
                    <Info label="Ref. preço" value={selectedSO.reference_price} />
                    <Info label="Fixing até" value={selectedSO.fixing_deadline} />
                    <Info label="Entrega prevista" value={selectedSO.expected_delivery_date} />
                    <Info label="Localização" value={selectedSO.location} />
                    <Info label="Notas" value={selectedSO.notes} />
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Page>
  );
};

const Info = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm text-foreground">{value ?? '—'}</p>
  </div>
);
