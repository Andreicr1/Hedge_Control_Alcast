import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Send,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useData } from '../../../contexts/DataContextAPI';
import { purchaseOrdersService } from '../../../services/purchaseOrdersService';
import { OrderStatus, PricingType } from '../../../types/api';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  FigmaButton,
  FigmaSurface,
  FigmaTabs,
} from '../../components/ui/figma';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Page } from '../../components/ui/page';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Textarea } from '../../components/ui/textarea';
import { cn } from '../../components/ui/utils';

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
  draft: 'bg-muted text-muted-foreground border-border',
  pendente_financeiro: 'bg-warning/10 text-warning border-warning/20',
  aprovado: 'bg-success/10 text-success border-success/20',
  rejeitado: 'bg-destructive/10 text-destructive border-destructive/20',
  active: 'bg-primary/10 text-primary border-primary/20',
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
  const {
    purchaseOrders,
    suppliers,
    fetchPurchaseOrders,
    loadingPOs,
    loadingSuppliers,
  } = useData();
  const [selectedPO, setSelectedPO] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [filterConcluded, setFilterConcluded] = useState(false);
  const [filterPending, setFilterPending] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'related'>('main');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const sortedPOs = useMemo(
    () =>
      [...purchaseOrders].sort((a, b) =>
        b.created_at.localeCompare(a.created_at)
      ),
    [purchaseOrders]
  );

  const filteredPOs = useMemo(() => {
    if (!filterConcluded && !filterPending) return sortedPOs;

    return sortedPOs.filter(po => {
      const status = String(po.status);
      const isConcluded =
        status === OrderStatus.COMPLETED ||
        status === 'aprovado' ||
        status === 'concluido';
      const isPending =
        status === OrderStatus.DRAFT ||
        status === OrderStatus.ACTIVE ||
        status === 'pendente_financeiro' ||
        status === 'pending';
      return (filterConcluded && isConcluded) || (filterPending && isPending);
    });
  }, [sortedPOs, filterConcluded, filterPending]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredPOs.length / pageSize)),
    [filteredPOs.length, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [pageSize, filterConcluded, filterPending]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPOs.slice(start, start + pageSize);
  }, [filteredPOs, page, pageSize]);

  const pageRangeLabel = useMemo(() => {
    if (filteredPOs.length === 0) return '0-0 de 0';
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, filteredPOs.length);
    return `${start}-${end} de ${filteredPOs.length}`;
  }, [filteredPOs.length, page, pageSize]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.supplier_id ||
      Number(formData.total_quantity_mt) <= 0 ||
      Number(formData.unit_price) <= 0
    ) {
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
        {/* Title bar (Figma BUTTONS 2) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="text-[24px] font-normal leading-[normal] text-foreground truncate">
                Ordens de compra
              </h1>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-[6px] bg-[var(--ui-neutral,#6592b7)] text-white hover:bg-[var(--ui-neutral,#6592b7)]/90"
                aria-label="Calendário"
                title="Calendário"
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={filterConcluded}
                    onCheckedChange={v => setFilterConcluded(Boolean(v))}
                    className="rounded-[6px] data-[state=checked]:bg-[var(--ui-neutral,#6592b7)] data-[state=checked]:border-[var(--ui-neutral,#6592b7)]"
                  />
                  <span className="text-[12px] text-foreground">
                    Concluídas
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={filterPending}
                    onCheckedChange={v => setFilterPending(Boolean(v))}
                    className="rounded-[6px] data-[state=checked]:bg-[var(--ui-neutral,#6592b7)] data-[state=checked]:border-[var(--ui-neutral,#6592b7)]"
                  />
                  <span className="text-[12px] text-foreground">Pendentes</span>
                </label>
              </div>

              <DialogTrigger asChild>
                <Button className="h-8 rounded-[6px] bg-[var(--primary-orange,#ffa548)] text-white hover:bg-[var(--primary-orange,#ffa548)]/90">
                  <span>Nova</span>
                  <ChevronDown className="h-4 w-4 opacity-90" />
                </Button>
              </DialogTrigger>
            </div>
          </div>
        </div>

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
                  onValueChange={value =>
                    setFormData({ ...formData, supplier_id: value })
                  }
                  disabled={loadingSuppliers}
                >
                  <SelectTrigger id="supplier-select">
                    <SelectValue
                      placeholder={
                        loadingSuppliers ? 'Carregando...' : 'Selecione'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name} {s.code ? `(${s.code})` : ''}
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
                  onChange={e =>
                    setFormData({ ...formData, product: e.target.value })
                  }
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
                  onChange={e =>
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
                  onChange={e =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  placeholder="MT"
                />
              </div>
              <div className="space-y-1">
                <Label>Preço Unitário</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      unit_price: Number(e.target.value),
                    })
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
                  onValueChange={value =>
                    setFormData({
                      ...formData,
                      pricing_type: value as PricingType,
                    })
                  }
                >
                  <SelectTrigger id="pricing-type">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PricingType.FIXED}>Fixo</SelectItem>
                    <SelectItem value={PricingType.TBF}>TBF</SelectItem>
                    <SelectItem value={PricingType.MONTHLY_AVERAGE}>
                      Média mensal
                    </SelectItem>
                    <SelectItem value={PricingType.LME_PREMIUM}>
                      LME + Premium
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Período</Label>
                <Input
                  value={formData.pricing_period}
                  onChange={e =>
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
                  onChange={e =>
                    setFormData({
                      ...formData,
                      lme_premium: Number(e.target.value),
                    })
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
                  onChange={e =>
                    setFormData({
                      ...formData,
                      premium: Number(e.target.value),
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <Label>Preço de Referência</Label>
                <Input
                  value={formData.reference_price}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      reference_price: e.target.value,
                    })
                  }
                  placeholder="Referência de preço"
                />
              </div>
              <div className="space-y-1">
                <Label>Data Limite Fixação</Label>
                <Input
                  type="date"
                  value={formData.fixing_deadline}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      fixing_deadline: e.target.value,
                    })
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
                  onChange={e =>
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
                  onChange={e =>
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
                  onChange={e =>
                    setFormData({
                      ...formData,
                      avg_cost: Number(e.target.value),
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={e =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                placeholder="Observações adicionais"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar PO'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Table shell (Figma TABLE) */}
      <div>
        <FigmaTabs
          items={[
            { value: 'main', label: 'Main' },
            { value: 'related', label: 'Related documents' },
          ]}
          value={activeTab}
          onValueChange={v => setActiveTab(v as 'main' | 'related')}
          className="mb-0"
        />

        <FigmaSurface className="rounded-tl-none">
          <div className="p-4">
            {loadingPOs ? (
              <div className="text-muted-foreground">Carregando POs...</div>
            ) : filteredPOs.length === 0 ? (
              <div className="text-muted-foreground">
                Nenhuma Purchase Order encontrada.
              </div>
            ) : (
              <Table className="text-[14px]">
                <TableHeader className="bg-card">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 px-2">
                      <Checkbox aria-label="Selecionar todos" />
                    </TableHead>
                    <TableHead className="text-[12px] font-normal text-foreground">
                      PO
                    </TableHead>
                    <TableHead className="text-[12px] font-normal text-foreground">
                      Fornecedor
                    </TableHead>
                    <TableHead className="text-[12px] font-normal text-foreground">
                      Produto
                    </TableHead>
                    <TableHead className="text-[12px] font-normal text-foreground text-right">
                      Quantidade
                    </TableHead>
                    <TableHead className="text-[12px] font-normal text-foreground text-right">
                      Total
                    </TableHead>
                    <TableHead className="text-[12px] font-normal text-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-[12px] font-normal text-foreground">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((po, idx) => {
                    const total =
                      po.unit_price && po.total_quantity_mt
                        ? po.unit_price * po.total_quantity_mt
                        : null;
                    return (
                      <TableRow
                        key={po.id}
                        className={cn(
                          'h-10',
                          idx % 2 === 1
                            ? 'bg-[var(--white-secondary,#f1f2f5)]'
                            : 'bg-card'
                        )}
                      >
                        <TableCell className="px-2">
                          <Checkbox aria-label={`Selecionar ${po.po_number}`} />
                        </TableCell>
                        <TableCell className="font-medium">
                          {po.po_number}
                        </TableCell>
                        <TableCell className="max-w-[260px] truncate">
                          {po.supplier?.name ?? '—'}
                        </TableCell>
                        <TableCell className="max-w-[420px] truncate">
                          {po.product || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {po.total_quantity_mt?.toLocaleString()}{' '}
                          {po.unit || 'MT'}
                        </TableCell>
                        <TableCell className="text-right">
                          {total != null
                            ? `US$ ${total.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                              })}`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              statusBadgeClass[po.status] ||
                              statusBadgeClass.draft
                            }
                          >
                            {statusLabel(po.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FigmaButton
                              tone="outline"
                              className="px-3"
                              onClick={() => openDetails(po)}
                            >
                              <Eye className="h-4 w-4" />
                              <span>Ver</span>
                            </FigmaButton>
                            {po.status === 'draft' && (
                              <FigmaButton
                                tone="primary"
                                className="px-3"
                                onClick={() =>
                                  purchaseOrdersService
                                    .update(po.id, {
                                      status: OrderStatus.ACTIVE,
                                    })
                                    .then(fetchPurchaseOrders)
                                }
                              >
                                <Send className="h-4 w-4" />
                                <span>Enviar</span>
                              </FigmaButton>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Footer (Figma TABLE footer / pagination) */}
          <div className="flex items-center justify-between gap-4 px-4 pb-4 pt-2">
            <div className="text-[14px] font-medium text-foreground">
              {pageRangeLabel}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-[6px]"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                aria-label="Primeira página"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-[6px]"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-[6px]"
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount}
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-[6px]"
                onClick={() => setPage(pageCount)}
                disabled={page >= pageCount}
                aria-label="Última página"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-foreground">
                Linhas por página
              </span>
              <Select
                value={String(pageSize)}
                onValueChange={v => setPageSize(Number(v))}
              >
                <SelectTrigger className="h-8 w-[90px] rounded-[6px] shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50].map(n => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FigmaSurface>
      </div>

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
                      statusBadgeClass[selectedPO.status] ||
                      statusBadgeClass.draft
                    }
                  >
                    {statusLabel(selectedPO.status)}
                  </Badge>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-muted-foreground">
                    Informações do Fornecedor
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <Info
                      label="Fornecedor"
                      value={selectedPO.supplier?.name}
                    />
                    <Info label="Produto" value={selectedPO.product} />
                    <Info
                      label="Quantidade"
                      value={`${selectedPO.total_quantity_mt} ${
                        selectedPO.unit || ''
                      }`}
                    />
                    <Info
                      label="Preço Unitário"
                      value={
                        selectedPO.unit_price
                          ? `US$ ${selectedPO.unit_price}`
                          : '—'
                      }
                    />
                    <Info label="Tipo" value={selectedPO.pricing_type} />
                    <Info label="Período" value={selectedPO.pricing_period} />
                    <Info
                      label="Premium"
                      value={selectedPO.premium ?? selectedPO.lme_premium}
                    />
                    <Info
                      label="Ref. preço"
                      value={selectedPO.reference_price}
                    />
                    <Info
                      label="Fixing até"
                      value={selectedPO.fixing_deadline}
                    />
                    <Info
                      label="Entrega prevista"
                      value={selectedPO.expected_delivery_date}
                    />
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

const Info = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm text-foreground">{value ?? '—'}</p>
  </div>
);
