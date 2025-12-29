import React, { useState } from 'react';
import { useData, SO } from '../../../contexts/DataContext';
import { Plus, Send, Eye, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

const clientesMock = ['Cliente Beta', 'Cliente Gamma', 'Cliente Delta', 'Cliente Epsilon'];

export const VendasSOs = () => {
  const { sos, addSO, updateSO } = useData();
  const [selectedSO, setSelectedSO] = useState<SO | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    cliente: '',
    produto: '',
    quantidade: 0,
    unidade: 'MT' as 'MT' | 'kg' | 'lbs',
    precoUnitario: 0,
    dataEntregaPrevista: '',
    // Pricing Structure
    tipoPrecificacao: 'fixo' as 'fixo' | 'tbf' | 'lme_premium',
    // Para LME + Premium
    periodoFixacao: 'M+1' as 'M+1' | 'M+2' | 'M+3' | 'M+0',
    premium: 0,
    dataLimiteFixacao: '',
    // Para TBF
    precoReferencia: '',
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSO({
      ...formData,
      total: formData.quantidade * formData.precoUnitario,
      status: 'draft',
      dataEmissao: new Date().toISOString().split('T')[0],
    });
    setCreateOpen(false);
    setFormData({
      cliente: '',
      produto: '',
      quantidade: 0,
      unidade: 'MT' as 'MT' | 'kg' | 'lbs',
      precoUnitario: 0,
      dataEntregaPrevista: '',
      // Pricing Structure
      tipoPrecificacao: 'fixo' as 'fixo' | 'tbf' | 'lme_premium',
      // Para LME + Premium
      periodoFixacao: 'M+1' as 'M+1' | 'M+2' | 'M+3' | 'M+0',
      premium: 0,
      dataLimiteFixacao: '',
      // Para TBF
      precoReferencia: '',
    });
  };

  const openDetails = (so: SO) => {
    setSelectedSO(so);
    setDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-100 text-green-800';
      case 'pendente_financeiro':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejeitado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Rascunho';
      case 'pendente_financeiro':
        return 'Pendente Financeiro';
      case 'aprovado':
        return 'Aprovado';
      case 'rejeitado':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Sales Orders</h2>
          <p className="text-muted-foreground">Gestão de ordens de venda</p>
        </div>
        <button 
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Nova SO
        </button>
      </div>

      <div className="space-y-4">
        {sos.map((so) => (
          <div key={so.id} className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3>{so.id} - {so.cliente}</h3>
                <p className="text-muted-foreground">{so.produto}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(so.status)}`}>
                {getStatusLabel(so.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Quantidade:</span>
                <p>{so.quantidade.toLocaleString()} kg</p>
              </div>
              <div>
                <span className="text-muted-foreground">Preço Unitário:</span>
                <p>R$ {so.precoUnitario.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>
                <p className="font-medium">R$ {so.total.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Entrega:</span>
                <p>{new Date(so.dataEntregaPrevista).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 mt-4 border-t">
              <button
                onClick={() => openDetails(so)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
              >
                <Eye className="w-4 h-4" />
                Ver Detalhes Completos
              </button>

              {so.status === 'draft' && (
                <button
                  onClick={() => updateSO(so.id, { status: 'pendente_financeiro' })}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                  Enviar ao Financeiro
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {sos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card border rounded-lg">
          Nenhuma Sales Order cadastrada
        </div>
      )}

      {/* Dialog de Detalhes */}
      <Dialog.Root open={detailsOpen} onOpenChange={setDetailsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
            {selectedSO && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <Dialog.Title className="text-xl font-medium">
                      Detalhes da Sales Order
                    </Dialog.Title>
                    <p className="text-muted-foreground">{selectedSO.id}</p>
                  </div>
                  <Dialog.Close asChild>
                    <button className="p-2 hover:bg-accent rounded-md">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="space-y-6">
                  {/* Status */}
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedSO.status)}`}>
                      {getStatusLabel(selectedSO.status)}
                    </span>
                  </div>

                  {/* Informações do Cliente */}
                  <div className="space-y-3 border-t pt-4">
                    <h3 className="text-muted-foreground">Informações do Cliente</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Cliente:</span>
                        <p className="font-medium">{selectedSO.cliente}</p>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes do Produto */}
                  <div className="space-y-3 border-t pt-4">
                    <h3 className="text-muted-foreground">Detalhes do Produto</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Produto:</span>
                        <p className="font-medium">{selectedSO.produto}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantidade:</span>
                        <p className="font-medium">{selectedSO.quantidade.toLocaleString()} kg</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Preço Unitário:</span>
                        <p className="font-medium">R$ {selectedSO.precoUnitario.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Valores Totais */}
                  <div className="space-y-3 border-t pt-4">
                    <h3 className="text-muted-foreground">Valores</h3>
                    <div className="bg-accent/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg">Valor Total:</span>
                        <span className="text-2xl font-medium">R$ {selectedSO.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Datas */}
                  <div className="space-y-3 border-t pt-4">
                    <h3 className="text-muted-foreground">Datas</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Data de Emissão:</span>
                        <p className="font-medium">{new Date(selectedSO.dataEmissao).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Data de Entrega Prevista:</span>
                        <p className="font-medium">{new Date(selectedSO.dataEntregaPrevista).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-3 pt-4 border-t">
                    {selectedSO.status === 'draft' && (
                      <button
                        onClick={() => {
                          updateSO(selectedSO.id, { status: 'pendente_financeiro' });
                          setDetailsOpen(false);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4" />
                        Enviar ao Financeiro
                      </button>
                    )}
                    <Dialog.Close asChild>
                      <button className="px-6 py-2 border rounded-md hover:bg-accent">
                        Fechar
                      </button>
                    </Dialog.Close>
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog de Criação */}
      <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-medium">
                Nova Sales Order
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 hover:bg-accent rounded-md">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm text-muted-foreground">Cliente *</label>
                <select
                  required
                  value={formData.cliente}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione um cliente</option>
                  {clientesMock.map((cliente) => (
                    <option key={cliente} value={cliente}>
                      {cliente}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm text-muted-foreground">Produto *</label>
                <select
                  required
                  value={formData.produto}
                  onChange={(e) => setFormData({ ...formData, produto: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione um produto</option>
                  <option value="Cobre">Cobre</option>
                  <option value="Alumínio">Alumínio</option>
                  <option value="Zinco">Zinco</option>
                  <option value="Níquel">Níquel</option>
                  <option value="Estanho">Estanho</option>
                  <option value="Chumbo">Chumbo</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-sm text-muted-foreground">Quantidade *</label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.quantidade || ''}
                    onChange={(e) => setFormData({ ...formData, quantidade: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm text-muted-foreground">Unidade *</label>
                  <select
                    required
                    value={formData.unidade}
                    onChange={(e) => setFormData({ ...formData, unidade: e.target.value as 'MT' | 'kg' | 'lbs' })}
                    className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="MT">MT (Metric Tons)</option>
                    <option value="kg">kg (Quilogramas)</option>
                    <option value="lbs">lbs (Libras)</option>
                  </select>
                </div>
              </div>

              {/* Estrutura de Precificação */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-sky-900">Precificação</h3>
                
                <div className="space-y-3">
                  <label className="text-sm text-muted-foreground">Tipo de Preço *</label>
                  <select
                    required
                    value={formData.tipoPrecificacao}
                    onChange={(e) => setFormData({ ...formData, tipoPrecificacao: e.target.value as 'fixo' | 'tbf' | 'lme_premium' })}
                    className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="fixo">Preço Fixo</option>
                    <option value="tbf">TBF (To Be Fixed)</option>
                    <option value="lme_premium">Monthly Average + Premium</option>
                  </select>
                </div>

                {/* Preço Fixo */}
                {formData.tipoPrecificacao === 'fixo' && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <div className="space-y-3">
                      <label className="text-sm text-muted-foreground">Preço Fixo (USD/{formData.unidade}) *</label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.precoUnitario || ''}
                        onChange={(e) => setFormData({ ...formData, precoUnitario: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}

                {/* To Be Fixed (TBF) */}
                {formData.tipoPrecificacao === 'tbf' && (
                  <div className="bg-amber-50 p-4 rounded-lg space-y-3">
                    <div className="space-y-3">
                      <label className="text-sm text-muted-foreground">Referência</label>
                      <input
                        type="text"
                        value={formData.precoReferencia}
                        onChange={(e) => setFormData({ ...formData, precoReferencia: e.target.value })}
                        placeholder="Monthly Average M+2"
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm text-muted-foreground">Data Limite Fixação *</label>
                      <input
                        required
                        type="date"
                        value={formData.dataLimiteFixacao}
                        onChange={(e) => setFormData({ ...formData, dataLimiteFixacao: e.target.value })}
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm text-muted-foreground">Preço Estimado (USD/{formData.unidade})</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.precoUnitario || ''}
                        onChange={(e) => setFormData({ ...formData, precoUnitario: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}

                {/* LME + Premium */}
                {formData.tipoPrecificacao === 'lme_premium' && (
                  <div className="bg-green-50 p-4 rounded-lg space-y-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="text-sm text-muted-foreground">Período (Monthly Average) *</label>
                        <select
                          required
                          value={formData.periodoFixacao}
                          onChange={(e) => setFormData({ ...formData, periodoFixacao: e.target.value as any })}
                          className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="M+0">M+0</option>
                          <option value="M+1">M+1</option>
                          <option value="M+2">M+2</option>
                          <option value="M+3">M+3</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm text-muted-foreground">Premium/Discount (USD/{formData.unidade}) *</label>
                        <input
                          required
                          type="number"
                          step="0.01"
                          value={formData.premium || ''}
                          onChange={(e) => setFormData({ ...formData, premium: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm text-muted-foreground">LME Estimado (USD/{formData.unidade})</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.precoUnitario || ''}
                        onChange={(e) => setFormData({ ...formData, precoUnitario: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm text-muted-foreground">Data de Entrega Prevista *</label>
                <input
                  required
                  type="date"
                  value={formData.dataEntregaPrevista}
                  onChange={(e) => setFormData({ ...formData, dataEntregaPrevista: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Resumo do Total */}
              {formData.quantidade > 0 && formData.precoUnitario > 0 && (
                <div className="bg-accent/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Valor Total:</span>
                    <span className="text-xl font-medium">
                      R$ {(formData.quantidade * formData.precoUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Criar Sales Order
                </button>
                <Dialog.Close asChild>
                  <button type="button" className="px-6 py-2 border rounded-md hover:bg-accent">
                    Cancelar
                  </button>
                </Dialog.Close>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};