import React, { useEffect, useMemo, useState } from 'react';
import { Plus, X, FileUp, ShieldCheck, Loader2, Files, CheckCircle2, AlertTriangle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useData } from '../../../contexts/DataContextAPI';
import { suppliersService } from '../../../services/suppliersService';
import { Supplier, KycDocument } from '../../../types/api';

const estadosBrasil = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

type FormState = {
  name: string;
  legal_name: string;
  tax_id: string;
  state_registration: string;
  contact_email: string;
  contact_phone: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  credit_limit: number;
  kyc_status: string;
  kyc_notes: string;
};

const initialForm: FormState = {
  name: '',
  legal_name: '',
  tax_id: '',
  state_registration: '',
  contact_email: '',
  contact_phone: '',
  address_line: '',
  city: '',
  state: 'SP',
  postal_code: '',
  credit_limit: 0,
  kyc_status: 'pending',
  kyc_notes: '',
};

export const ComprasFornecedores = () => {
  const { suppliers, fetchSuppliers, loadingSuppliers } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [docsMap, setDocsMap] = useState<Record<number, KycDocument[]>>({});
  const [checkingId, setCheckingId] = useState<number | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await suppliersService.create({
        ...formData,
        credit_limit: formData.credit_limit || undefined,
      });
      await fetchSuppliers();
      setFormData(initialForm);
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (supplierId: number, file?: File | null) => {
    if (!file) return;
    setUploading(supplierId);
    try {
      await suppliersService.uploadDocument(supplierId, file);
      const list = await suppliersService.listDocuments(supplierId);
      setDocsMap((prev) => ({ ...prev, [supplierId]: list }));
    } finally {
      setUploading(null);
    }
  };

  const handleFetchDocs = async (supplierId: number) => {
    const list = await suppliersService.listDocuments(supplierId);
    setDocsMap((prev) => ({ ...prev, [supplierId]: list }));
  };

  const handleKyp = async (supplierId: number) => {
    setCheckingId(supplierId);
    try {
      await suppliersService.runKypCheck(supplierId);
      await fetchSuppliers();
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

  const sortedSuppliers = useMemo(
    () => [...suppliers].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [suppliers]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Fornecedores</h2>
          <p className="text-muted-foreground">Cadastro completo com KYP, documentos e crédito</p>
        </div>

        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              <Plus className="w-4 h-4" />
              Novo Fornecedor
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto z-50">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-lg font-semibold">Cadastrar fornecedor</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="p-2 hover:bg-accent rounded-md">
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm">Nome Fantasia *</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                      placeholder="Ex: Mineradora Alpha"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Razão Social</label>
                    <input
                      value={formData.legal_name}
                      onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                      placeholder="Razão Social"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block mb-2 text-sm">CNPJ</label>
                    <input
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Inscrição Estadual</label>
                    <input
                      value={formData.state_registration}
                      onChange={(e) => setFormData({ ...formData, state_registration: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">E-mail</label>
                    <input
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                      placeholder="contato@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Telefone</label>
                    <input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                      placeholder="+55 11 99999-9999"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm">Endereço</label>
                    <input
                      value={formData.address_line}
                      onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                      placeholder="Rua, número, complemento"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Cidade</label>
                    <input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Estado</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                    >
                      {estadosBrasil.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">CEP</label>
                    <input
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm">Limite de Crédito (R$)</label>
                    <input
                      type="number"
                      value={formData.credit_limit || ''}
                      onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Status KYP</label>
                    <select
                      value={formData.kyc_status}
                      onChange={(e) => setFormData({ ...formData, kyc_status: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background"
                    >
                      <option value="pending">Pendente</option>
                      <option value="approved">Aprovado</option>
                      <option value="manual_review">Em revisão</option>
                      <option value="rejected">Reprovado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Notas</label>
                    <textarea
                      value={formData.kyc_notes}
                      onChange={(e) => setFormData({ ...formData, kyc_notes: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md bg-background min-h-[70px]"
                      placeholder="Observações internas"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-60"
                  >
                    {saving ? 'Salvando...' : 'Salvar fornecedor'}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {loadingSuppliers ? (
        <div className="text-muted-foreground">Carregando fornecedores...</div>
      ) : sortedSuppliers.length === 0 ? (
        <div className="text-muted-foreground">Nenhum fornecedor cadastrado.</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedSuppliers.map((sup) => (
            <div key={sup.id} className="bg-card border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{sup.name}</h3>
                  <p className="text-sm text-muted-foreground">{sup.legal_name || 'Razão social não informada'}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${kycBadge(sup.kyc_status)}`}>
                  {sup.kyc_status || 'pending'}
                </span>
              </div>

              <div className="text-sm space-y-1 text-foreground">
                <div><strong>CNPJ:</strong> {sup.tax_id || '—'}</div>
                <div><strong>Contato:</strong> {sup.contact_email || '—'} {sup.contact_phone ? `• ${sup.contact_phone}` : ''}</div>
                <div><strong>Cidade/UF:</strong> {sup.city || '—'} / {sup.state || '—'}</div>
                <div><strong>Limite crédito:</strong> R$ {sup.credit_limit?.toLocaleString() || '—'}</div>
                <div><strong>Score:</strong> {sup.credit_score ?? '—'}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleKyp(sup.id)}
                  disabled={checkingId === sup.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-900 text-white text-sm disabled:opacity-60"
                >
                  {checkingId === sup.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Verificar KYP
                </button>

                <label className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer">
                  <FileUp className="w-4 h-4" />
                  Upload Doc
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleUpload(sup.id, e.target.files?.[0])}
                  />
                </label>

                <button
                  onClick={() => handleFetchDocs(sup.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm"
                >
                  <Files className="w-4 h-4" />
                  Ver docs ({docsMap[sup.id]?.length || 0})
                </button>
              </div>

              {uploading === sup.id && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Enviando...
                </div>
              )}

              {docsMap[sup.id]?.length ? (
                <div className="border rounded-md p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-2">Documentos</div>
                  <ul className="space-y-1 text-sm">
                    {docsMap[sup.id].map((doc) => (
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
