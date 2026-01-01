import React, { useEffect, useMemo, useState } from 'react';
import { Plus, X, FileUp, ShieldCheck, Loader2, Files, CheckCircle2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useData } from '../../../contexts/DataContextAPI';
import { customersService } from '../../../services/customersService';
import { Customer, KycDocument } from '../../../types/api';

const entityTypes = ['company', 'financial_institution', 'trading_house', 'individual'];
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
        tax_id_country: formData.tax_id_country || formData.country_incorporation || formData.country_operation || undefined,
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
      setDocsMap((prev) => ({ ...prev, [customerId]: list }));
    } finally {
      setUploading(null);
    }
  };

  const handleFetchDocs = async (customerId: number) => {
    const list = await customersService.listDocuments(customerId);
    setDocsMap((prev) => ({ ...prev, [customerId]: list }));
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
        return 'bg-green-100 text-green-800';
      case 'manual_review':
        return 'bg-amber-100 text-amber-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const sortedCustomers = useMemo(
    () => [...customers].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [customers]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Clientes</h2>
          <p className="text-muted-foreground">Cadastro global com crédito e KYC</p>
        </div>

        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto z-50">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-lg font-semibold">Cadastrar cliente</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="p-2 hover:bg-accent rounded-md">
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Nome fantasia *</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="Ex: Global Buyer"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Nome legal</label>
                    <input
                      value={formData.legal_name}
                      onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="Razão social"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Tipo de entidade</label>
                    <select
                      value={formData.entity_type}
                      onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                    >
                      {entityTypes.map((type) => (
                        <option key={type} value={type}>{entityTypeLabels[type] || type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">País de incorporação *</label>
                    <input
                      required
                      value={formData.country_incorporation}
                      onChange={(e) => setFormData({ ...formData, country_incorporation: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="Informe o país"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">País de operação *</label>
                    <input
                      required
                      value={formData.country_operation}
                      onChange={(e) => setFormData({ ...formData, country_operation: e.target.value, country: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="Onde opera"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">País de residência</label>
                    <input
                      value={formData.country_residence}
                      onChange={(e) => setFormData({ ...formData, country_residence: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="Residência (opcional)"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Moeda base</label>
                    <input
                      value={formData.base_currency}
                      onChange={(e) => setFormData({ ...formData, base_currency: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="USD"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Tipo de identificador fiscal</label>
                    <input
                      value={formData.tax_id_type}
                      onChange={(e) => setFormData({ ...formData, tax_id_type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="Ex: VAT, EIN, CNPJ"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Número</label>
                    <input
                      value={formData.tax_id_value}
                      onChange={(e) => setFormData({ ...formData, tax_id_value: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="Número fiscal"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">País emissor</label>
                    <input
                      value={formData.tax_id_country}
                      onChange={(e) => setFormData({ ...formData, tax_id_country: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="Ex: BR, US"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Termos de pagamento</label>
                    <input
                      value={formData.payment_terms}
                      onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="ex: 30d, 15d"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Endereço completo</label>
                    <input
                      value={formData.address_line}
                      onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="Rua, número, complemento, cidade"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Código postal</label>
                    <input
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="ZIP/Postal"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Limite de crédito</label>
                    <input
                      type="number"
                      value={formData.credit_limit || ''}
                      onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Classificação de risco</label>
                    <input
                      value={formData.risk_rating}
                      onChange={(e) => setFormData({ ...formData, risk_rating: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="ex: BBB"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      id="sanctions-customer"
                      type="checkbox"
                      checked={formData.sanctions_flag}
                      onChange={(e) => setFormData({ ...formData, sanctions_flag: e.target.checked })}
                    />
                    <label htmlFor="sanctions-customer" className="text-sm">Flag de sanções</label>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">E-mail de contato</label>
                    <input
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="financeiro@cliente.com"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Telefone</label>
                    <input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="+1 202 555 0100"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Registro/ID estadual</label>
                    <input
                      value={formData.state_registration}
                      onChange={(e) => setFormData({ ...formData, state_registration: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="ID"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Status KYC</label>
                    <select
                      value={formData.kyc_status}
                      onChange={(e) => setFormData({ ...formData, kyc_status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-900 placeholder:text-gray-400"
                    >
                      <option value="pending">Pendente</option>
                      <option value="approved">Aprovado</option>
                      <option value="manual_review">Revisão manual</option>
                      <option value="rejected">Reprovado</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Observações internas</label>
                    <textarea
                      value={formData.kyc_notes}
                      onChange={(e) => setFormData({ ...formData, kyc_notes: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background min-h-[70px]"
                      placeholder="Compliance / onboarding"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-60"
                  >
                    {saving ? 'Salvando...' : 'Salvar cliente'}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {loadingCustomers ? (
        <div className="text-muted-foreground">Carregando clientes...</div>
      ) : sortedCustomers.length === 0 ? (
        <div className="text-muted-foreground">Nenhum cliente cadastrado.</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedCustomers.map((cust) => (
            <div key={cust.id} className="bg-card border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{cust.name}</h3>
                  <p className="text-sm text-muted-foreground">{cust.legal_name || 'Legal name não informado'}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${kycBadge(cust.kyc_status)}`}>
                  {cust.kyc_status || 'pending'}
                </span>
              </div>

              <div className="text-sm space-y-1 text-foreground">
                <div><strong>Identificador:</strong> {cust.tax_id_type ? `${cust.tax_id_type}:` : ''} {cust.tax_id || '—'}</div>
                <div><strong>País:</strong> {cust.country_operation || cust.country || cust.country_incorporation || '—'}</div>
                <div><strong>Contato:</strong> {cust.contact_email || '—'} {cust.contact_phone ? `• ${cust.contact_phone}` : ''}</div>
                <div><strong>Endereço:</strong> {cust.address_line || '—'} {cust.postal_code ? `• ${cust.postal_code}` : ''}</div>
                <div><strong>Limite crédito:</strong> {cust.base_currency || 'Moeda'} {cust.credit_limit?.toLocaleString() || '—'}</div>
                <div><strong>Classificação:</strong> {cust.risk_rating || '—'}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCreditCheck(cust.id)}
                  disabled={checkingId === cust.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-900 text-white text-sm disabled:opacity-60"
                >
                  {checkingId === cust.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Consultar crédito
                </button>

                <label className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer">
                  <FileUp className="w-4 h-4" />
                  Upload Doc
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleUpload(cust.id, e.target.files?.[0])}
                  />
                </label>

                <button
                  onClick={() => handleFetchDocs(cust.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm"
                >
                  <Files className="w-4 h-4" />
                  Ver docs ({docsMap[cust.id]?.length || 0})
                </button>
              </div>

              {uploading === cust.id && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Enviando...
                </div>
              )}

              {docsMap[cust.id]?.length ? (
                <div className="border rounded-md p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-2">Documentos</div>
                  <ul className="space-y-1 text-sm">
                    {docsMap[cust.id].map((doc) => (
                      <li key={doc.id} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {doc.filename}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
