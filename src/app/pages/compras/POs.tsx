import React, { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Send } from "lucide-react";
import { toast } from "sonner";

import { useData } from "../../../contexts/DataContextAPI";
import { purchaseOrdersService } from "../../../services/purchaseOrdersService";
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
  supplier_id: string;
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
  avg_cost: number;
  notes: string;
};

const initialForm: FormState = {
  supplier_id: '',
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
  avg_cost: 0,
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

export const ComprasPOs = () => {
  const { purchaseOrders, suppliers, fetchPurchaseOrders, loadingPOs, loadingSuppliers } = useData();
  const [selectedPO, setSelectedPO] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const sortedPOs = useMemo(
    () => [...purchaseOrders].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [purchaseOrders]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_id || Number(formData.total_quantity_mt) <= 0 || Number(formData.unit_price) <= 0) {
      toast.error('Dados inválidos. Verifique quantidade, preço e fornecedor.');
      return;
    }
    setSaving(true);
    try {
          await purchaseOrdersService.create({
            supplier_id: Number(formData.supplier_id),
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
        avg_cost: formData.avg_cost || undefined,
        notes: formData.notes,
      });
      await fetchPurchaseOrders();
      setFormData(initialForm);
      setCreateOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const openDetails = (po: any) => {
    setSelectedPO(po);
    setDetailsOpen(true);
  };

  return (
    <Page>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <PageHeader
          eyebrow="Compras"
          title="Exposição Passiva (Compras)"
          description="Ordens de compra em acompanhamento."
          actions={
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4" />
                Nova PO
              </Button>
            </DialogTrigger>
          }
        />

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Purchase Order</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="supplier-select">Fornecedor *</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, supplier_id: value })
                  }
                  disabled={loadingSuppliers}
                >
                  <SelectTrigger id="supplier-select">
                    <SelectValue
                      placeholder={loadingSuppliers ? "Carregando..." : "Selecione"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name} {s.code ? `(${s.code})` : ""}
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
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label>Unidade</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="MT"
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
                  placeholder="0.00"
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
                  placeholder="0.00"
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
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <Label>Preço de Referência</Label>
                <Input
                  value={formData.reference_price}
                  onChange={(e) =>
                    setFormData({ ...formData, reference_price: e.target.value })
                  }
                  placeholder="Referência de preço"
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
                  placeholder="Local de entrega"
                />
              </div>
              <div className="space-y-1">
                <Label>Custo Médio</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.avg_cost}
                  onChange={(e) =>
                    setFormData({ ...formData, avg_cost: Number(e.target.value) })
                  }
                  placeholder="0.00"
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
                placeholder="Observações adicionais"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar PO"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SectionCard>
        {loadingPOs ? (
          <div className="text-muted-foreground">Carregando POs...</div>
        ) : sortedPOs.length === 0 ? (
          <div className="text-muted-foreground">
            Nenhuma Purchase Order cadastrada.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPOs.map((po) => (
              <div
                key={po.id}
                className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">
                      {po.po_number} - {po.supplier?.name}
                    </h3>
                    <p className="text-muted-foreground">
                      {po.product || "Produto não informado"}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={statusBadgeClass[po.status] || statusBadgeClass.draft}
                  >
                    {statusLabel(po.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Quantidade:</span>
                    <p>
                      {po.total_quantity_mt.toLocaleString()} {po.unit || "MT"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Preço Unitário:</span>
                    <p>
                      {po.unit_price
                        ? `US$ ${po.unit_price.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span>
                    <p className="font-medium">
                      {po.unit_price
                        ? `US$ ${(po.unit_price * po.total_quantity_mt).toLocaleString(
                            "en-US",
                            { minimumFractionDigits: 2 },
                          )}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entrega:</span>
                    <p>
                      {po.expected_delivery_date
                        ? new Date(po.expected_delivery_date).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 mt-4 border-t">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openDetails(po)}
                  >
                    <Eye className="w-4 h-4" />
                    Ver detalhes completos
                  </Button>

                  {po.status === "draft" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        purchaseOrdersService
                          .update(po.id, { status: OrderStatus.ACTIVE })
                          .then(fetchPurchaseOrders)
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
          {selectedPO && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes da Purchase Order</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedPO.po_number}
                </p>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    variant="secondary"
                    className={
                      statusBadgeClass[selectedPO.status] || statusBadgeClass.draft
                    }
                  >
                    {statusLabel(selectedPO.status)}
                  </Badge>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-muted-foreground">Informações do Fornecedor</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <Info label="Fornecedor" value={selectedPO.supplier?.name} />
                    <Info label="Produto" value={selectedPO.product} />
                    <Info
                      label="Quantidade"
                      value={`${selectedPO.total_quantity_mt} ${selectedPO.unit || ""}`}
                    />
                    <Info
                      label="Preço Unitário"
                      value={selectedPO.unit_price ? `US$ ${selectedPO.unit_price}` : "—"}
                    />
                    <Info label="Tipo" value={selectedPO.pricing_type} />
                    <Info label="Período" value={selectedPO.pricing_period} />
                    <Info label="Premium" value={selectedPO.premium ?? selectedPO.lme_premium} />
                    <Info label="Ref. preço" value={selectedPO.reference_price} />
                    <Info label="Fixing até" value={selectedPO.fixing_deadline} />
                    <Info label="Entrega prevista" value={selectedPO.expected_delivery_date} />
                    <Info label="Localização" value={selectedPO.location} />
                    <Info label="Custo médio" value={selectedPO.avg_cost} />
                    <Info label="Notas" value={selectedPO.notes} />
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
