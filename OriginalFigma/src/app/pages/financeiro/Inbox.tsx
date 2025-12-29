import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../contexts/DataContextAPI';
import type { PurchaseOrder, SalesOrder } from '../../../types/api';
import { OrderStatus } from '../../../types/api';
import { Eye, TrendingUp } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../../components/ui/button';
import { X } from 'lucide-react';

export const FinanceiroInbox = () => {
  const { pos, sos, loadingPOs, loadingSOs } = useData();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('pos');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const pendentesPO = pos.filter(po => po.status === OrderStatus.SUBMITTED);
  const pendentesSO = sos.filter(so => so.status === OrderStatus.SUBMITTED);

  const openPODetails = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setSelectedSO(null);
    setDetailsOpen(true);
  };

  const openSODetails = (so: SalesOrder) => {
    setSelectedSO(so);
    setSelectedPO(null);
    setDetailsOpen(true);
  };

  const handleHedge = () => {
    setDetailsOpen(false);
    navigate('/financeiro/novorfq');
  };

  if (loadingPOs || loadingSOs) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando operações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2>Inbox - Operações Pendentes</h2>
        <p className="text-muted-foreground">Revise operações de compra e venda para análise de hedge</p>
      </div>

      <Tabs.Root value={selectedTab} onValueChange={setSelectedTab}>
        <Tabs.List className="flex gap-2 border-b pb-2">
          <Tabs.Trigger
            value="pos"
            className={`px-4 py-2 rounded-t-md transition-colors ${
              selectedTab === 'pos' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            Purchase Orders ({pendentesPO.length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="sos"
            className={`px-4 py-2 rounded-t-md transition-colors ${
              selectedTab === 'sos' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            Sales Orders ({pendentesSO.length})
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="pos" className="mt-4 space-y-4">
          {pendentesPO.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhuma PO pendente</div>
          ) : (
            pendentesPO.map((po) => (
              <div key={po.id} className="bg-card border rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3>{po.code} - {po.supplier?.name || 'N/A'}</h3>
                    <p className="text-muted-foreground">{po.aluminum_type}</p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                    Pendente
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Quantidade:</span>
                    <p>{po.quantity_tons.toLocaleString()} MT</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Custo Médio:</span>
                    <p>{po.avg_cost ? `USD ${po.avg_cost.toFixed(2)}` : 'TBF'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span>
                    <p>USD {po.avg_cost ? (po.quantity_tons * po.avg_cost).toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'TBF'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entrega:</span>
                    <p>{po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => openPODetails(po)}
                    className="flex items-center gap-2 text-sky-900 px-3 py-1.5 text-sm rounded-md hover:bg-sky-50 transition-colors border border-slate-300"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))
          )}
        </Tabs.Content>

        <Tabs.Content value="sos" className="mt-4 space-y-4">
          {pendentesSO.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhuma SO pendente</div>
          ) : (
            pendentesSO.map((so) => (
              <div key={so.id} className="bg-card border rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3>{so.code} - {so.customer?.name || 'N/A'}</h3>
                    <p className="text-muted-foreground">{so.aluminum_type}</p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                    Pendente
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Quantidade:</span>
                    <p>{so.quantity.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Preço Unit.:</span>
                    <p>US$ {so.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span>
                    <p>US$ {so.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entrega:</span>
                    <p>{new Date(so.expected_delivery_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => openSODetails(so)}
                    className="flex items-center gap-2 text-sky-900 px-3 py-1.5 text-sm rounded-md hover:bg-sky-50 transition-colors border border-slate-300"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))
          )}
        </Tabs.Content>
      </Tabs.Root>

      {/* Dialog de Detalhes */}
      <Dialog.Root open={detailsOpen} onOpenChange={setDetailsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <Dialog.Title className="text-xl font-semibold text-sky-900">
                    {selectedPO ? 'Detalhes da Purchase Order' : 'Detalhes da Sales Order'}
                  </Dialog.Title>
                  <Dialog.Description className="text-muted-foreground mt-1">
                    Informações completas da operação
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>

              {/* PO Details */}
              {selectedPO && (
                <div className="space-y-6">
                  {/* Identificação */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-sky-900 mb-3">Identificação</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">ID da PO:</span>
                        <p className="font-medium">{selectedPO.id}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Fornecedor:</span>
                        <p className="font-medium">{selectedPO.supplier?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Data de Emissão:</span>
                        <p className="font-medium">{new Date(selectedPO.issue_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <p className="font-medium">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                            Pendente Financeiro
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Produto */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-semibold text-sky-900 mb-3">Produto</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Descrição:</span>
                        <p className="font-medium">{selectedPO.aluminum_type}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Quantidade:</span>
                        <p className="font-medium">{selectedPO.quantity.toLocaleString()} kg</p>
                      </div>
                    </div>
                  </div>

                  {/* Valores */}
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                    <h4 className="font-semibold text-sky-900 mb-3">Valores</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Preço Unitário:</span>
                        <p className="font-medium">US$ {selectedPO.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Valor Total:</span>
                        <p className="font-medium text-lg text-emerald-700">US$ {selectedPO.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      </div>
                      {selectedPO.average_cost > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">Custo Médio:</span>
                          <p className="font-medium">US$ {selectedPO.average_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logística */}
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <h4 className="font-semibold text-sky-900 mb-3">Logística</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Data de Entrega Prevista:</span>
                        <p className="font-medium">{new Date(selectedPO.expected_delivery_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Localização:</span>
                        <p className="font-medium">{selectedPO.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SO Details */}
              {selectedSO && (
                <div className="space-y-6">
                  {/* Identificação */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-sky-900 mb-3">Identificação</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">ID da SO:</span>
                        <p className="font-medium">{selectedSO.id}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Cliente:</span>
                        <p className="font-medium">{selectedSO.customer?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Data de Emissão:</span>
                        <p className="font-medium">{new Date(selectedSO.issue_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <p className="font-medium">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                            Pendente Financeiro
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Produto */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-semibold text-sky-900 mb-3">Produto</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Descrição:</span>
                        <p className="font-medium">{selectedSO.aluminum_type}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Quantidade:</span>
                        <p className="font-medium">{selectedSO.quantity.toLocaleString()} kg</p>
                      </div>
                    </div>
                  </div>

                  {/* Valores */}
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                    <h4 className="font-semibold text-sky-900 mb-3">Valores</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Preço Unitário:</span>
                        <p className="font-medium">US$ {selectedSO.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Valor Total:</span>
                        <p className="font-medium text-lg text-emerald-700">US$ {selectedSO.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      </div>
                      {selectedSO.gross_revenue > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">Receita Bruta:</span>
                          <p className="font-medium">US$ {selectedSO.gross_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logística */}
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <h4 className="font-semibold text-sky-900 mb-3">Logística</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Data de Entrega Prevista:</span>
                        <p className="font-medium">{new Date(selectedSO.expected_delivery_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Localização:</span>
                        <p className="font-medium">{selectedSO.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer com botão Hedge */}
              <div className="border-t pt-4 flex justify-end gap-3">
                <Dialog.Close asChild>
                  <Button variant="outline">
                    Fechar
                  </Button>
                </Dialog.Close>
                <Button 
                  onClick={handleHedge}
                  className="bg-sky-900 hover:bg-sky-800 text-white"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Criar Hedge
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};