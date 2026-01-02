import React, { useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";

import { useData } from "../../../contexts/DataContextAPI";
import { counterpartiesService } from "../../../services/counterpartiesService";
import { Counterparty, CounterpartyType } from "../../../types/api";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
  name: string;
  trade_name: string;
  legal_name: string;
  type: CounterpartyType;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address_line: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  country_incorporation: string;
  country_operation: string;
  tax_id_type: string;
  tax_id_value: string;
  tax_id_country: string;
  base_currency: string;
  payment_terms: string;
  risk_rating: string;
  sanctions_flag: boolean;
  kyc_status: string;
  kyc_notes: string;
  internal_notes: string;
};

const initialForm: FormState = {
  name: '',
  trade_name: '',
  legal_name: '',
  type: CounterpartyType.BANK,
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  address_line: '',
  city: '',
  state: '',
  country: '',
  postal_code: '',
  country_incorporation: '',
  country_operation: '',
  tax_id_type: '',
  tax_id_value: '',
  tax_id_country: '',
  base_currency: 'USD',
  payment_terms: '',
  risk_rating: '',
  sanctions_flag: false,
  kyc_status: '',
  kyc_notes: '',
  internal_notes: '',
};

export const FinanceiroContrapartes = () => {
  const { counterparties, fetchCounterparties, loadingCounterparties } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormState>(initialForm);

  useEffect(() => {
    fetchCounterparties();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await counterpartiesService.create({
        name: formData.name,
        trade_name: formData.trade_name || formData.name,
        legal_name: formData.legal_name || formData.name,
        type: formData.type,
        contact_name: formData.contact_name || undefined,
        contact_email: formData.contact_email || undefined,
        contact_phone: formData.contact_phone || undefined,
        address_line: formData.address_line || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        country: formData.country || undefined,
        postal_code: formData.postal_code || undefined,
        country_incorporation: formData.country_incorporation || undefined,
        country_operation: formData.country_operation || undefined,
        tax_id: formData.tax_id_value || undefined,
        tax_id_type: formData.tax_id_type || undefined,
        tax_id_country: formData.tax_id_country || undefined,
        base_currency: formData.base_currency || undefined,
        payment_terms: formData.payment_terms || undefined,
        risk_rating: formData.risk_rating || undefined,
        sanctions_flag: formData.sanctions_flag,
        kyc_status: formData.kyc_status || undefined,
        kyc_notes: formData.kyc_notes || undefined,
        internal_notes: formData.internal_notes || undefined,
      });
      await fetchCounterparties();
      setDialogOpen(false);
      setFormData(initialForm);
    } finally {
      setSaving(false);
    }
  };

  const itemBadge = (cp: Counterparty) => (cp.active ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100');

  return (
    <Page>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <PageHeader
          title="Contrapartes"
          description="Cadastro internacional de bancos, brokers e parceiros."
          actions={
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4" />
                Nova contraparte
              </Button>
            </DialogTrigger>
          }
        />

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar contraparte</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nome legal *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Instituição / empresa"
                />
              </div>
              <div className="space-y-1">
                <Label>Nome fantasia</Label>
                <Input
                  value={formData.trade_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, trade_name: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, type: value as CounterpartyType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CounterpartyType.BANK}>Banco</SelectItem>
                    <SelectItem value={CounterpartyType.BROKER}>Corretora</SelectItem>
                    <SelectItem value={CounterpartyType.COMPANY}>Empresa</SelectItem>
                    <SelectItem value={CounterpartyType.TRADING}>Trading</SelectItem>
                    <SelectItem value={CounterpartyType.INDIVIDUAL}>Pessoa física</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Contato</Label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contact_name: e.target.value }))}
                  placeholder="Responsável"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="email@empresa.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))}
                    placeholder="+1 202 555 0100"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Identificação fiscal</Label>
                <Input
                  value={formData.tax_id_type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tax_id_type: e.target.value }))}
                  placeholder="CNPJ / VAT / EIN / TIN"
                />
              </div>
              <div className="space-y-1">
                <Label>Número</Label>
                <Input
                  value={formData.tax_id_value}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tax_id_value: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>País emissor</Label>
                <Input
                  value={formData.tax_id_country}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tax_id_country: e.target.value }))}
                  placeholder="País"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Endereço</Label>
                <Input
                  value={formData.address_line}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address_line: e.target.value }))}
                  placeholder="Linha principal"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Cidade</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Região/Estado</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                    placeholder="UF/Estado"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>País</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                    placeholder="País"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Código postal</Label>
                  <Input
                    value={formData.postal_code}
                    onChange={(e) => setFormData((prev) => ({ ...prev, postal_code: e.target.value }))}
                    placeholder="Código postal"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Moeda base</Label>
                <Input
                  value={formData.base_currency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, base_currency: e.target.value }))}
                  placeholder="USD, EUR..."
                />
              </div>
              <div className="space-y-1">
                <Label>Condições de pagamento</Label>
                <Input
                  value={formData.payment_terms}
                  onChange={(e) => setFormData((prev) => ({ ...prev, payment_terms: e.target.value }))}
                  placeholder="30/45/60"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>País incorp.</Label>
                  <Input
                    value={formData.country_incorporation}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, country_incorporation: e.target.value }))
                    }
                    placeholder="País incorp."
                  />
                </div>
                <div className="space-y-1">
                  <Label>País operação</Label>
                  <Input
                    value={formData.country_operation}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, country_operation: e.target.value }))
                    }
                    placeholder="País operação"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Rating / risco</Label>
                <Input
                  value={formData.risk_rating}
                  onChange={(e) => setFormData((prev) => ({ ...prev, risk_rating: e.target.value }))}
                  placeholder="ex: BBB-"
                />
              </div>
              <div className="space-y-1">
                <Label>Status KYC/KYP</Label>
                <Input
                  value={formData.kyc_status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, kyc_status: e.target.value }))}
                  placeholder="pending / approved"
                />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Checkbox
                  id="sanctions_flag"
                  checked={formData.sanctions_flag}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, sanctions_flag: !!checked }))
                  }
                />
                <Label htmlFor="sanctions_flag" className="cursor-pointer">
                  Flag de sanções
                </Label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Notas internas</Label>
                <Textarea
                  value={formData.internal_notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, internal_notes: e.target.value }))
                  }
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-1">
                <Label>Observações KYC</Label>
                <Textarea
                  value={formData.kyc_notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, kyc_notes: e.target.value }))
                  }
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SectionCard>
        {loadingCounterparties ? (
          <div className="text-sm text-muted-foreground">Carregando contrapartes...</div>
        ) : counterparties.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/40">Nenhuma contraparte cadastrada.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {counterparties.map((cp) => (
              <div key={cp.id} className="border rounded-md p-3 bg-muted/30 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{cp.name}</p>
                      <p className="text-xs text-muted-foreground">{cp.trade_name || cp.legal_name || '—'}</p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[11px] capitalize ${itemBadge(cp)}`}
                  >
                    {cp.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {cp.country_operation || cp.country_incorporation || 'País não informado'} •{' '}
                  {cp.base_currency || 'Moeda não definida'}
                </p>
                <p className="text-xs text-muted-foreground">{cp.contact_name || 'Contato não informado'} • {cp.contact_email || 'sem e-mail'}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </Page>
  );
};
