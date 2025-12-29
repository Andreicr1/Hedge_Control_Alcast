import React, { useState } from 'react';
import { useData, Fornecedor } from '../../../contexts/DataContext';
import { Plus, X, Building2, CheckCircle, Shield, Loader2, AlertCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Checkbox from '@radix-ui/react-checkbox';

const produtosDisponiveis = ['Cobre', 'Alumínio', 'Zinco', 'Níquel', 'Estanho', 'Chumbo'];
const estadosBrasil = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export const ComprasFornecedores = () => {
  const { fornecedores, addFornecedor, updateFornecedor } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [kycChecking, setKycChecking] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    razaoSocial: '',
    cnpj: '',
    inscricaoEstadual: '',
    contatoPrincipal: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: 'SP',
    cep: '',
    produtos: [] as string[],
    limiteCredito: 0,
    status: 'ativo' as 'ativo' | 'inativo' | 'bloqueado',
    kycStatus: 'pendente' as 'pendente' | 'aprovado' | 'reprovado' | 'verificando',
    observacoes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addFornecedor({
      ...formData,
      dataCadastro: new Date().toISOString().split('T')[0],
    });
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      razaoSocial: '',
      cnpj: '',
      inscricaoEstadual: '',
      contatoPrincipal: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: 'SP',
      cep: '',
      produtos: [],
      limiteCredito: 0,
      status: 'ativo',
      kycStatus: 'pendente',
      observacoes: '',
    });
  };

  const toggleProduto = (produto: string) => {
    setFormData(prev => ({
      ...prev,
      produtos: prev.produtos.includes(produto)
        ? prev.produtos.filter(p => p !== produto)
        : [...prev.produtos, produto]
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

  const handleKYPCheck = async (fornecedorId: string) => {
    setKycChecking(true);
    updateFornecedor(fornecedorId, { kycStatus: 'verificando' });

    // Simula verificação em sistemas externos (OFAC, ONU, etc.)
    setTimeout(() => {
      const randomResult = Math.random();
      const isApproved = randomResult > 0.15; // 85% de aprovação

      updateFornecedor(fornecedorId, {
        kycStatus: isApproved ? 'aprovado' : 'reprovado',
        kycData: {
          verificadoEm: new Date().toISOString().split('T')[0],
          resultado: isApproved ? 'Aprovado' : 'Reprovado - Encontrado em lista de sanções',
          observacoes: isApproved 
            ? 'Verificação concluída com sucesso. Nenhuma restrição encontrada nas listas: OFAC, ONU, UE.'
            : 'ATENÇÃO: Empresa encontrada em lista de sanções internacionais. Recomenda-se não realizar negócios.',
        },
      });
      setKycChecking(false);
    }, 3000);
  };

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-100 text-green-800';
      case 'reprovado':
        return 'bg-red-100 text-red-800';
      case 'verificando':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getKYCStatusLabel = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'KYP Aprovado';
      case 'reprovado':
        return 'KYP Reprovado';
      case 'verificando':
        return 'Verificando...';
      default:
        return 'KYP Pendente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'bloqueado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Fornecedores</h2>
          <p className="text-muted-foreground">Gestão e cadastro de fornecedores com verificação KYP</p>
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
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto z-50">
              <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-xl font-medium">
                  Cadastrar Novo Fornecedor
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
                      <label className="block mb-2">Nome Fantasia *</label>
                      <input
                        type="text"
                        required
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Fornecedor Alpha"
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block mb-2">Razão Social *</label>
                      <input
                        type="text"
                        required
                        value={formData.razaoSocial}
                        onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                        placeholder="Ex: Fornecedor Alpha Ltda."
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
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
                      <label className="block mb-2">Inscrição Estadual</label>
                      <input
                        type="text"
                        value={formData.inscricaoEstadual}
                        onChange={(e) => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
                        placeholder="000.000.000.000"
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ativo' | 'inativo' | 'bloqueado' })}
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                        <option value="bloqueado">Bloqueado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2">Limite de Crédito (R$) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="100000"
                        value={formData.limiteCredito || ''}
                        onChange={(e) => setFormData({ ...formData, limiteCredito: Number(e.target.value) })}
                        placeholder="0"
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Produtos Fornecidos */}
                <div className="space-y-4">
                  <h3 className="text-muted-foreground border-b pb-2">Produtos Fornecidos</h3>
                  <div className="flex flex-wrap gap-4">
                    {produtosDisponiveis.map((produto) => (
                      <label key={produto} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox.Root
                          checked={formData.produtos.includes(produto)}
                          onCheckedChange={() => toggleProduto(produto)}
                          className="w-5 h-5 border-2 rounded flex items-center justify-center bg-background hover:bg-accent"
                        >
                          <Checkbox.Indicator>
                            <CheckCircle className="w-4 h-4 text-primary" />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                        <span>{produto}</span>
                      </label>
                    ))}
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
                        placeholder="contato@fornecedor.com.br"
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
                    placeholder="Informações adicionais sobre o fornecedor..."
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
                    Cadastrar Fornecedor
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

      {/* Lista de Fornecedores */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fornecedores.map((forn) => (
          <div key={forn.id} className="bg-card border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3>{forn.nome}</h3>
                  <p className="text-sm text-muted-foreground">{forn.razaoSocial}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(forn.status)}`}>
                      {forn.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getKYCStatusColor(forn.kycStatus)}`}>
                      {getKYCStatusLabel(forn.kycStatus)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm border-t pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">CNPJ:</span>
                <span className="text-right">{forn.cnpj}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contato:</span>
                <span className="text-right">{forn.contatoPrincipal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="text-right truncate max-w-[180px]" title={forn.email}>{forn.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefone:</span>
                <span className="text-right">{forn.telefone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Limite Crédito:</span>
                <span className="text-right font-medium">R$ {forn.limiteCredito.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Produtos:</span>
                <span className="text-right text-xs">{forn.produtos.join(', ')}</span>
              </div>
            </div>

            {/* KYP Check Button */}
            <div className="border-t pt-4">
              {forn.kycStatus === 'pendente' && (
                <button
                  onClick={() => handleKYPCheck(forn.id)}
                  disabled={kycChecking}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {kycChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verificando KYP...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Verificar KYP
                    </>
                  )}
                </button>
              )}

              {forn.kycStatus === 'verificando' && (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Verificando em listas de sanções...</span>
                </div>
              )}

              {forn.kycStatus === 'aprovado' && forn.kycData && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">KYP Aprovado</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Verificado em: {new Date(forn.kycData.verificadoEm!).toLocaleDateString()}
                  </p>
                  <p className="text-xs">{forn.kycData.observacoes}</p>
                </div>
              )}

              {forn.kycStatus === 'reprovado' && forn.kycData && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">KYP Reprovado</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Verificado em: {new Date(forn.kycData.verificadoEm!).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-red-700">{forn.kycData.observacoes}</p>
                </div>
              )}
            </div>

            {forn.observacoes && (
              <div className="text-sm text-muted-foreground border-t pt-3">
                <span className="font-medium">Obs:</span> {forn.observacoes}
              </div>
            )}
          </div>
        ))}
      </div>

      {fornecedores.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card border rounded-lg">
          Nenhum fornecedor cadastrado
        </div>
      )}
    </div>
  );
};
