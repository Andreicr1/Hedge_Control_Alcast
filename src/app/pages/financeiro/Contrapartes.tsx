import React, { useEffect, useState } from 'react';
import { Plus, X, Building2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useData } from '../../../contexts/DataContextAPI';
import { counterpartiesService } from '../../../services/counterpartiesService';
import { Counterparty, CounterpartyType } from '../../../types/api';

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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Contrapartes</h2>
          <p className="text-muted-foreground text-sm">Cadastro internacional de bancos, brokers e parceiros.</p>
        </div>

        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              <Plus className="w-4 h-4" />
              Nova contraparte
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto z-50">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-lg font-semibold">Cadastrar contraparte</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="p-2 hover:bg-accent rounded-md">
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome legal *</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="Instituição / empresa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome fantasia</label>
                    <input
                      value={formData.trade_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, trade_name: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as CounterpartyType }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    >
                      <option value={CounterpartyType.BANK}>Banco</option>
                      <option value={CounterpartyType.BROKER}>Corretora</option>
                      <option value={CounterpartyType.COMPANY}>Empresa</option>
                      <option value={CounterpartyType.TRADING}>Trading</option>
                      <option value={CounterpartyType.INDIVIDUAL}>Pessoa física</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contato</label>
                    <input
                      value={formData.contact_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contact_name: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="Responsável"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contact_email: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="E-mail"
                    />
                    <input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="Telefone"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Identificação fiscal</label>
                    <input
                      value={formData.tax_id_type}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tax_id_type: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="CNPJ / VAT / EIN / TIN"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Número</label>
                    <input
                      value={formData.tax_id_value}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tax_id_value: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">País emissor</label>
                    <input
                      value={formData.tax_id_country}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tax_id_country: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="País"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Endereço</label>
                    <input
                      value={formData.address_line}
                      onChange={(e) => setFormData((prev) => ({ ...prev, address_line: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="Linha principal"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={formData.city}
                      onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="Cidade"
                    />
                    <input
                      value={formData.state}
                      onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="Região/Estado"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={formData.country}
                      onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="País"
                    />
                    <input
                      value={formData.postal_code}
                      onChange={(e) => setFormData((prev) => ({ ...prev, postal_code: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="Código postal"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Moeda base</label>
                    <input
                      value={formData.base_currency}
                      onChange={(e) => setFormData((prev) => ({ ...prev, base_currency: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="USD, EUR..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Condições de pagamento</label>
                    <input
                      value={formData.payment_terms}
                      onChange={(e) => setFormData((prev) => ({ ...prev, payment_terms: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="30/45/60"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={formData.country_incorporation}
                      onChange={(e) => setFormData((prev) => ({ ...prev, country_incorporation: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="País incorp."
                    />
                    <input
                      value={formData.country_operation}
                      onChange={(e) => setFormData((prev) => ({ ...prev, country_operation: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="País operação"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Rating / risco</label>
                    <input
                      value={formData.risk_rating}
                      onChange={(e) => setFormData((prev) => ({ ...prev, risk_rating: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="ex: BBB-"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="sanctions_flag"
                      type="checkbox"
                      checked={formData.sanctions_flag}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sanctions_flag: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <label htmlFor="sanctions_flag" className="text-sm">Flag de sanções</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status KYC/KYP</label>
                    <input
                      value={formData.kyc_status}
                      onChange={(e) => setFormData((prev) => ({ ...prev, kyc_status: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="pending / approved"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Notas internas</label>
                    <textarea
                      value={formData.internal_notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, internal_notes: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Observações KYC</label>
                    <textarea
                      value={formData.kyc_notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, kyc_notes: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Dialog.Close asChild>
                    <button className="px-4 py-2 text-sm rounded-md border hover:bg-muted">Cancelar</button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="bg-card border rounded-lg p-4">
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
                  <span className={`text-[11px] px-2 py-1 rounded-full ${itemBadge(cp)}`}>{cp.type}</span>
                </div>
                <p className="text-xs text-muted-foreground">{cp.country || 'País não informado'} • {cp.base_currency || 'Moeda não definida'}</p>
                <p className="text-xs text-muted-foreground">{cp.contact_name || 'Contato não informado'} • {cp.contact_email || 'sem e-mail'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
