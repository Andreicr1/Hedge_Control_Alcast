import {
  CheckCircle2,
  FileUp,
  Files,
  Loader2,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useData } from '../../../contexts/DataContextAPI';
import { customersService } from '../../../services/customersService';
import { KycDocument } from '../../../types/api';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Page, PageHeader, SectionCard } from '../../components/ui/page';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';

const entityTypes = [
  'company',
  'financial_institution',
  'trading_house',
  'individual',
];
const entityTypeLabels: Record<string, string> = {
  company: 'Empresa',
  financial_institution: 'Instituição financeira',
  trading_house: 'Trading',
  individual: 'Pessoa física',
};

type FormState = {
  name: string;
  legal_name: string;
  entity_type: string;
  country_incorporation: string;
  country_operation: string;
  country_residence: string;
  tax_id_type: string;
  tax_id_value: string;
  tax_id_country: string;
  state_registration: string;
  contact_email: string;
  contact_phone: string;
  address_line: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  credit_limit: number;
  base_currency: string;
  payment_terms: string;
  risk_rating: string;
  sanctions_flag: boolean;
  kyc_status: string;
  kyc_notes: string;
};

const initialForm: FormState = {
  name: '',
  legal_name: '',
  entity_type: 'company',
  country_incorporation: '',
  country_operation: '',
  country_residence: '',
  tax_id_type: 'VAT',
  tax_id_value: '',
  tax_id_country: '',
  state_registration: '',
  contact_email: '',
  contact_phone: '',
  address_line: '',
  city: '',
  state: '',
  country: '',
  postal_code: '',
  credit_limit: 0,
  base_currency: 'USD',
  payment_terms: '',
  risk_rating: '',
  sanctions_flag: false,
  kyc_status: 'pending',
  kyc_notes: '',
};

export const VendasClientes = () => {
  const { customers, fetchCustomers, loadingCustomers } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [docsMap, setDocsMap] = useState<Record<number, KycDocument[]>>({});
  const [checkingId, setCheckingId] = useState<number | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || Number(formData.credit_limit) < 0) {
      setSaving(false);
      return toast.error('Dados inválidos. Verifique os campos obrigatórios.');
    }
    setSaving(true);
    try {
      await customersService.create({
        name: formData.name,
        legal_name: formData.legal_name || undefined,
        trade_name: formData.name,
        entity_type: formData.entity_type,
        country_incorporation: formData.country_incorporation,
        country_operation: formData.country_operation,
        country_residence: formData.country_residence || undefined,
        tax_id: formData.tax_id_value || undefined,
        tax_id_type: formData.tax_id_type,
        tax_id_country:
          formData.tax_id_country ||
          formData.country_incorporation ||
          formData.country_operation ||
          undefined,
        state_registration: formData.state_registration || undefined,
        contact_email: formData.contact_email || undefined,
        contact_phone: formData.contact_phone || undefined,
        address_line: formData.address_line || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        country: formData.country || formData.country_operation || undefined,
        postal_code: formData.postal_code || undefined,
        credit_limit: formData.credit_limit || undefined,
        base_currency: formData.base_currency || undefined,
        payment_terms: formData.payment_terms || undefined,
        risk_rating: formData.risk_rating || undefined,
        sanctions_flag: formData.sanctions_flag,
        kyc_status: formData.kyc_status || undefined,
        kyc_notes: formData.kyc_notes || undefined,
        operational_role: 'customer',
      });
      await fetchCustomers();
      setFormData(initialForm);
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (customerId: number, file?: File | null) => {
    if (!file) return;
    setUploading(customerId);
    try {
      await customersService.uploadDocument(customerId, file);
      const list = await customersService.listDocuments(customerId);
      setDocsMap(prev => ({ ...prev, [customerId]: list }));
    } finally {
      setUploading(null);
    }
  };

  const handleFetchDocs = async (customerId: number) => {
    const list = await customersService.listDocuments(customerId);
    setDocsMap(prev => ({ ...prev, [customerId]: list }));
  };

  const handleCreditCheck = async (customerId: number) => {
    setCheckingId(customerId);
    try {
      await customersService.runCreditCheck(customerId);
      await fetchCustomers();
    } finally {
      setCheckingId(null);
    }
  };

  const kycBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'manual_review':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const sortedCustomers = useMemo(
    () =>
      [...customers].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [customers]
  );

  return (
    <Page>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <PageHeader
          title="Clientes"
          description="Cadastro global com crédito e KYC"
          actions={
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
          }
        />

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar cliente</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Nome fantasia *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Global Buyer"
                />
              </div>
              <div className="space-y-1">
                <Label>Nome legal</Label>
                <Input
                  value={formData.legal_name}
                  onChange={e =>
                    setFormData({ ...formData, legal_name: e.target.value })
                  }
                  placeholder="Razão social"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="entity-type">Tipo de entidade</Label>
                <Select
                  value={formData.entity_type}
                  onValueChange={value =>
                    setFormData({ ...formData, entity_type: value })
                  }
                >
                  <SelectTrigger id="entity-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {entityTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {entityTypeLabels[type] || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>País de incorporação *</Label>
                <Input
                  required
                  value={formData.country_incorporation}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      country_incorporation: e.target.value,
                    })
                  }
                  placeholder="Informe o país"
                />
              </div>
              <div className="space-y-1">
                <Label>País de operação *</Label>
                <Input
                  required
                  value={formData.country_operation}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      country_operation: e.target.value,
                      country: e.target.value,
                    })
                  }
                  placeholder="Onde opera"
                />
              </div>
              <div className="space-y-1">
                <Label>País de residência</Label>
                <Input
                  value={formData.country_residence}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      country_residence: e.target.value,
                    })
                  }
                  placeholder="Residência (opcional)"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Moeda base</Label>
                <Input
                  value={formData.base_currency}
                  onChange={e =>
                    setFormData({ ...formData, base_currency: e.target.value })
                  }
                  placeholder="USD"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label>Tipo de identificador fiscal</Label>
                <Input
                  value={formData.tax_id_type}
                  onChange={e =>
                    setFormData({ ...formData, tax_id_type: e.target.value })
                  }
                  placeholder="Ex: VAT, EIN, CNPJ"
                />
              </div>
              <div className="space-y-1">
                <Label>Número</Label>
                <Input
                  value={formData.tax_id_value}
                  onChange={e =>
                    setFormData({ ...formData, tax_id_value: e.target.value })
                  }
                  placeholder="Número fiscal"
                />
              </div>
              <div className="space-y-1">
                <Label>País emissor</Label>
                <Input
                  value={formData.tax_id_country}
                  onChange={e =>
                    setFormData({ ...formData, tax_id_country: e.target.value })
                  }
                  placeholder="Ex: BR, US"
                />
              </div>
              <div className="space-y-1">
                <Label>Termos de pagamento</Label>
                <Input
                  value={formData.payment_terms}
                  onChange={e =>
                    setFormData({ ...formData, payment_terms: e.target.value })
                  }
                  placeholder="ex: 30d, 15d"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <Label>Endereço completo</Label>
                <Input
                  value={formData.address_line}
                  onChange={e =>
                    setFormData({ ...formData, address_line: e.target.value })
                  }
                  placeholder="Rua, número, complemento, cidade"
                />
              </div>
              <div className="space-y-1">
                <Label>Código postal</Label>
                <Input
                  value={formData.postal_code}
                  onChange={e =>
                    setFormData({ ...formData, postal_code: e.target.value })
                  }
                  placeholder="ZIP/Postal"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Limite de crédito</Label>
                <Input
                  type="number"
                  value={formData.credit_limit || ''}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      credit_limit: Number(e.target.value),
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label>Classificação de risco</Label>
                <Input
                  value={formData.risk_rating}
                  onChange={e =>
                    setFormData({ ...formData, risk_rating: e.target.value })
                  }
                  placeholder="ex: BBB"
                />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Checkbox
                  id="sanctions-customer"
                  checked={formData.sanctions_flag}
                  onCheckedChange={checked =>
                    setFormData({ ...formData, sanctions_flag: !!checked })
                  }
                />
                <Label htmlFor="sanctions-customer" className="cursor-pointer">
                  Flag de sanções
                </Label>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>E-mail de contato</Label>
                <Input
                  value={formData.contact_email}
                  onChange={e =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  placeholder="financeiro@cliente.com"
                />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input
                  value={formData.contact_phone}
                  onChange={e =>
                    setFormData({ ...formData, contact_phone: e.target.value })
                  }
                  placeholder="+1 202 555 0100"
                />
              </div>
              <div className="space-y-1">
                <Label>Registro/ID estadual</Label>
                <Input
                  value={formData.state_registration}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      state_registration: e.target.value,
                    })
                  }
                  placeholder="ID"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="kyc-status">Status KYC</Label>
                <Select
                  value={formData.kyc_status}
                  onValueChange={value =>
                    setFormData({ ...formData, kyc_status: value })
                  }
                >
                  <SelectTrigger id="kyc-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="manual_review">
                      Revisão manual
                    </SelectItem>
                    <SelectItem value="rejected">Reprovado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label>Observações internas</Label>
                <Textarea
                  value={formData.kyc_notes}
                  onChange={e =>
                    setFormData({ ...formData, kyc_notes: e.target.value })
                  }
                  className="min-h-[70px]"
                  placeholder="Compliance / onboarding"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {loadingCustomers ? (
        <div className="text-muted-foreground">Carregando clientes...</div>
      ) : sortedCustomers.length === 0 ? (
        <div className="text-muted-foreground">Nenhum cliente cadastrado.</div>
      ) : (
        <SectionCard className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedCustomers.map(cust => (
            <div
              key={cust.id}
              className="bg-card border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{cust.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {cust.legal_name || 'Legal name não informado'}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs capitalize ${kycBadge(cust.kyc_status)}`}
                >
                  {cust.kyc_status || 'pending'}
                </Badge>
              </div>

              <div className="text-sm space-y-1 text-foreground">
                <div>
                  <strong>Identificador:</strong>{' '}
                  {cust.tax_id_type ? `${cust.tax_id_type}:` : ''}{' '}
                  {cust.tax_id || '—'}
                </div>
                <div>
                  <strong>País:</strong>{' '}
                  {cust.country_operation ||
                    cust.country ||
                    cust.country_incorporation ||
                    '—'}
                </div>
                <div>
                  <strong>Contato:</strong> {cust.contact_email || '—'}{' '}
                  {cust.contact_phone ? `• ${cust.contact_phone}` : ''}
                </div>
                <div>
                  <strong>Endereço:</strong> {cust.address_line || '—'}{' '}
                  {cust.postal_code ? `• ${cust.postal_code}` : ''}
                </div>
                <div>
                  <strong>Limite crédito:</strong>{' '}
                  {cust.base_currency || 'Moeda'}{' '}
                  {cust.credit_limit?.toLocaleString() || '—'}
                </div>
                <div>
                  <strong>Classificação:</strong> {cust.risk_rating || '—'}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleCreditCheck(cust.id)}
                  disabled={checkingId === cust.id}
                  size="sm"
                >
                  {checkingId === cust.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  Consultar crédito
                </Button>

                <Button asChild variant="outline" size="sm">
                  <label className="cursor-pointer">
                    <FileUp className="w-4 h-4" />
                    Upload Doc
                    <input
                      type="file"
                      className="hidden"
                      onChange={e => handleUpload(cust.id, e.target.files?.[0])}
                    />
                  </label>
                </Button>

                <Button
                  onClick={() => handleFetchDocs(cust.id)}
                  variant="outline"
                  size="sm"
                >
                  <Files className="w-4 h-4" />
                  Ver docs ({docsMap[cust.id]?.length || 0})
                </Button>
              </div>

              {uploading === cust.id && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Enviando...
                </div>
              )}

              {docsMap[cust.id]?.length ? (
                <div className="border rounded-md p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-2">
                    Documentos
                  </div>
                  <ul className="space-y-1 text-sm">
                    {docsMap[cust.id].map(doc => (
                      <li key={doc.id} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        {doc.filename}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </SectionCard>
      )}
    </Page>
  );
};
