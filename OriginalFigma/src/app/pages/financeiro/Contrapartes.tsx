import React, { useState } from 'react';
import { useData, Contraparte } from '../../../contexts/DataContext';
import { Plus, X, Building2, CheckCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Checkbox from '@radix-ui/react-checkbox';

const canaisDisponiveis = ['Email', 'Telefone', 'WhatsApp', 'Bloomberg', 'Telegram'];
const estadosBrasil = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export const FinanceiroContrapartes = () => {
  const { contrapartes, addContraparte } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'banco' as 'banco' | 'corretora',
    cnpj: '',
    contatoPrincipal: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: 'SP',
    cep: '',
    limite: 0,
    canais: [] as string[],
    status: 'ativo' as 'ativo' | 'inativo',
    observacoes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addContraparte({
      ...formData,
      dataCadastro: new Date().toISOString().split('T')[0],
    });
    setDialogOpen(false);
    // Reset form
    setFormData({
      nome: '',
      tipo: 'banco',
      cnpj: '',
      contatoPrincipal: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: 'SP',
      cep: '',
      limite: 0,
      canais: [],
      status: 'ativo',
      observacoes: '',
    });
  };

  const toggleCanal = (canal: string) => {
    setFormData(prev => ({
      ...prev,
      canais: prev.canais.includes(canal)
        ? prev.canais.filter(c => c !== canal)
        : [...prev.canais, canal]
    }));
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return value;
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d)/, '$1-$2');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Contrapartes</h2>
          <p className="text-muted-foreground">Bancos e Corretoras para operações de hedge</p>
        </div>

        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              <Plus className="w-4 h-4" />
              Nova Contraparte
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto z-50">
              <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-xl font-medium">
                  Cadastrar Nova Contraparte
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="p-2 hover:bg-accent rounded-md">
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-muted-foreground border-b pb-2">Informações Básicas</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block mb-2">Nome da Instituição *</label>
                      <input
                        type="text"
                        required
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Banco Itaú BBA"
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block mb-2">Tipo *</label>
                      <select
                        required
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'banco' | 'corretora' })}
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="banco">Banco</option>
                        <option value="corretora">Corretora</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2">CNPJ *</label>
                      <input
                        type="text"
                        required
                        value={formData.cnpj}
                        onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ativo' | 'inativo' })}
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2">Limite de Crédito (R$) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1000000"
                        value={formData.limite || ''}
                        onChange={(e) => setFormData({ ...formData, limite: Number(e.target.value) })}
                        placeholder="0"
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Dados de Contato */}
                <div className="space-y-4">
                  <h3 className="text-muted-foreground border-b pb-2">Dados de Contato</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2">Contato Principal *</label>
                      <input
                        type="text"
                        required
                        value={formData.contatoPrincipal}
                        onChange={(e) => setFormData({ ...formData, contatoPrincipal: e.target.value })}
                        placeholder="Nome do responsável"
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block mb-2">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contato@instituicao.com.br"
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block mb-2">Telefone *</label>
                      <input
                        type="tel"
                        required
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="(11) 0000-0000"
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block mb-3">Canais de Comunicação *</label>
                      <div className="flex flex-wrap gap-4">
                        {canaisDisponiveis.map((canal) => (
                          <label key={canal} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox.Root
                              checked={formData.canais.includes(canal)}
                              onCheckedChange={() => toggleCanal(canal)}
                              className="w-5 h-5 border-2 rounded flex items-center justify-center bg-background hover:bg-accent"
                            >
                              <Checkbox.Indicator>
                                <CheckCircle className="w-4 h-4 text-primary" />
                              </Checkbox.Indicator>
                            </Checkbox.Root>
                            <span>{canal}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-4">
                  <h3 className="text-muted-foreground border-b pb-2">Endereço</h3>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block mb-2">Endereço *</label>
                      <input
                        type="text"
                        required
                        value={formData.endereco}
                        onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                        placeholder="Logradouro, número"
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block mb-2">CEP *</label>
                      <input
                        type="text"
                        required
                        value={formData.cep}
                        onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                        placeholder="00000-000"
                        maxLength={9}
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block mb-2">Cidade *</label>
                      <input
                        type="text"
                        required
                        value={formData.cidade}
                        onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                        placeholder="São Paulo"
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block mb-2">Estado *</label>
                      <select
                        required
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {estadosBrasil.map(estado => (
                          <option key={estado} value={estado}>{estado}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block mb-2">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Informações adicionais sobre a contraparte..."
                    rows={3}
                    className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90"
                  >
                    Cadastrar Contraparte
                  </button>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="px-6 py-2 border rounded-md hover:bg-accent"
                    >
                      Cancelar
                    </button>
                  </Dialog.Close>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Lista de Contrapartes */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contrapartes.map((cp) => (
          <div key={cp.id} className="bg-card border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3>{cp.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                      {cp.tipo}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      cp.status === 'ativo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {cp.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm border-t pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">CNPJ:</span>
                <span className="text-right">{cp.cnpj}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contato:</span>
                <span className="text-right">{cp.contatoPrincipal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="text-right truncate max-w-[180px]" title={cp.email}>{cp.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefone:</span>
                <span className="text-right">{cp.telefone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Limite:</span>
                <span className="text-right font-medium">R$ {cp.limite.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Canais:</span>
                <span className="text-right text-xs">{cp.canais.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cadastro:</span>
                <span className="text-right">{new Date(cp.dataCadastro).toLocaleDateString()}</span>
              </div>
            </div>

            {cp.observacoes && (
              <div className="text-sm text-muted-foreground border-t pt-3">
                <span className="font-medium">Obs:</span> {cp.observacoes}
              </div>
            )}
          </div>
        ))}
      </div>

      {contrapartes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card border rounded-lg">
          Nenhuma contraparte cadastrada
        </div>
      )}
    </div>
  );
};
