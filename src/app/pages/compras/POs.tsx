import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Send, Eye, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useData } from '../../../contexts/DataContextAPI';
import { purchaseOrdersService } from '../../../services/purchaseOrdersService';
import { OrderStatus, PricingType } from '../../../types/api';

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

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pendente_financeiro: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-green-100 text-green-800',
  rejeitado: 'bg-red-100 text-red-800',
  active: 'bg-blue-100 text-blue-800',
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Compras</p>
          <h2 className="text-xl font-semibold">Exposição Passiva (Compras)</h2>
          <p className="text-muted-foreground text-sm">Ordens de compra em acompanhamento.</p>
        </div>
        <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              <Plus className="w-4 h-4" />
              Nova PO
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto z-50">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-lg font-semibold">Cadastrar Purchase Order</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="p-2 hover:bg-accent rounded-md">
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>

              <form className="space-y-4" onSubmit={handleCreate}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm">Fornecedor *</label>
                    <select
                      required
                      value={formData.supplier_id}
                      onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                      disabled={loadingSuppliers}
                    >
                      <option value="">Selecione</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.code ? `(${s.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Produto *</label>
                    <input
                      required
                      value={formData.product}
                      onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                      placeholder="Billets, T-bars..."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm">Quantidade *</label>
                    <input
                      type="number"
                      required
                      value={formData.total_quantity_mt}
                      onChange={(e) => setFormData({ ...formData, total_quantity_mt: Number(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Unidade</label>
                    <input
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Preço Unitário</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm">Tipo de Precificação</label>
                    <select
                      value={formData.pricing_type}
                      onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value as PricingType })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                    >
                      <option value={PricingType.FIXED}>Fixo</option>
                      <option value={PricingType.TBF}>TBF</option>
                      <option value={PricingType.MONTHLY_AVERAGE}>Média mensal</option>
                      <option value={PricingType.LME_PREMIUM}>LME + Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Período</label>
                    <input
                      value={formData.pricing_period}
                      onChange={(e) => setFormData({ ...formData, pricing_period: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                      placeholder="M+1"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">LME Premium</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.lme_premium}
                      onChange={(e) => setFormData({ ...formData, lme_premium: Number(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm">Premium</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.premium}
                      onChange={(e) => setFormData({ ...formData, premium: Number(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Preço de Referência</label>
                    <input
                      value={formData.reference_price}
                      onChange={(e) => setFormData({ ...formData, reference_price: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Data Limite Fixação</label>
                    <input
                      type="date"
                      value={formData.fixing_deadline}
                      onChange={(e) => setFormData({ ...formData, fixing_deadline: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm">Entrega Prevista</label>
                    <input
                      type="date"
                      value={formData.expected_delivery_date}
                      onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Localização</label>
                    <input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Custo Médio</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.avg_cost}
                      onChange={(e) => setFormData({ ...formData, avg_cost: Number(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm">Notas</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md bg-background"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-60"
                  >
                    {saving ? 'Salvando...' : 'Salvar PO'}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="space-y-4">
        {loadingPOs ? (
          <div className="text-muted-foreground">Carregando POs...</div>
        ) : sortedPOs.length === 0 ? (
          <div className="text-muted-foreground">Nenhuma Purchase Order cadastrada.</div>
        ) : (
          sortedPOs.map((po) => (
            <div key={po.id} className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3>
                    {po.po_number} - {po.supplier?.name}
                  </h3>
                  <p className="text-muted-foreground">{po.product || 'Produto não informado'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${statusColors[po.status] || 'bg-gray-100 text-gray-800'}`}>
                  {statusLabel(po.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Quantidade:</span>
                  <p>{po.total_quantity_mt.toLocaleString()} {po.unit || 'MT'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Preço Unitário:</span>
                  <p>{po.unit_price ? `US$ ${po.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <p className="font-medium">{po.unit_price ? `US$ ${(po.unit_price * po.total_quantity_mt).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Entrega:</span>
                  <p>{po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : '—'}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-4 border-t">
                <button
                  onClick={() => openDetails(po)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                >
                  <Eye className="w-4 h-4" />
                  Ver Detalhes Completos
                </button>

                {po.status === 'draft' && (
                  <button
                    onClick={() => purchaseOrdersService.update(po.id, { status: OrderStatus.ACTIVE }).then(fetchPurchaseOrders)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                    Enviar ao Financeiro
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog.Root open={detailsOpen} onOpenChange={setDetailsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
            {selectedPO && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <Dialog.Title className="text-xl font-medium">Detalhes da Purchase Order</Dialog.Title>
                    <p className="text-muted-foreground">{selectedPO.po_number}</p>
                  </div>
                  <Dialog.Close asChild>
                    <button className="p-2 hover:bg-accent rounded-md">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm ${statusColors[selectedPO.status] || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabel(selectedPO.status)}
                    </span>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <h3 className="text-muted-foreground">Informações do Fornecedor</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <Info label="Fornecedor" value={selectedPO.supplier?.name} />
                      <Info label="Produto" value={selectedPO.product} />
                      <Info label="Quantidade" value={`${selectedPO.total_quantity_mt} ${selectedPO.unit || ''}`} />
                      <Info label="Preço Unitário" value={selectedPO.unit_price ? `US$ ${selectedPO.unit_price}` : '—'} />
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
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm text-foreground">{value ?? '—'}</p>
  </div>
);
