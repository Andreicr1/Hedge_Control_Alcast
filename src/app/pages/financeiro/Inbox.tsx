import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Eye, X } from 'lucide-react';
import { useData } from '../../../contexts/DataContextAPI';
import { Exposure } from '../../../types/api';

export const FinanceiroInbox = () => {
  const { exposures, loadingExposures } = useData();
  const [selectedExposure, setSelectedExposure] = useState<Exposure | null>(null);

  const pendingExposures = exposures;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Financeiro</p>
          <h2 className="text-xl font-semibold">Inbox Financeiro</h2>
          <p className="text-muted-foreground text-sm">Exposições prontas para decisão.</p>
        </div>
      </div>
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Exposições e Tarefas</h3>
          <span className="text-sm text-muted-foreground">{pendingExposures.length} abertas</span>
        </div>
        {loadingExposures ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : pendingExposures.length === 0 ? (
          <div className="text-muted-foreground text-sm">Nenhuma exposição pendente.</div>
        ) : (
          <div className="space-y-2">
            {pendingExposures.map((exp) => (
              <div key={exp.id} className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {exp.exposure_type === 'active' ? 'Exposição Ativa (Vendas)' : 'Exposição Passiva (Compras)'} • {exp.product || 'N/D'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fonte: {exp.source_type.toUpperCase()} {exp.source_id} • {exp.quantity_mt} MT
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 capitalize">{exp.status}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setSelectedExposure(exp)}
                    className="text-xs flex items-center gap-1 px-2 py-1 border rounded-md"
                  >
                    <Eye className="w-3 h-3" />
                    Ver detalhes
                  </button>
                </div>
                {exp.tasks?.length ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Tarefas: {exp.tasks.map((t) => t.status).join(', ')}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog.Root open={!!selectedExposure} onOpenChange={() => setSelectedExposure(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
            {selectedExposure && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <Dialog.Title className="text-lg font-semibold">Exposição</Dialog.Title>
                    <p className="text-sm text-muted-foreground">
                      {selectedExposure.exposure_type === 'active' ? 'Ativa' : 'Passiva'} • Fonte {selectedExposure.source_type.toUpperCase()} {selectedExposure.source_id}
                    </p>
                  </div>
                  <Dialog.Close asChild>
                    <button className="p-2 hover:bg-accent rounded-md">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <Info label="Produto" value={selectedExposure.product} />
                  <Info label="Quantidade" value={`${selectedExposure.quantity_mt} MT`} />
                  <Info label="Pagamento" value={selectedExposure.payment_date} />
                  <Info label="Entrega" value={selectedExposure.delivery_date} />
                  <Info label="Venda" value={selectedExposure.sale_date} />
                  <Info label="Status" value={selectedExposure.status} />
                </div>
                {selectedExposure.tasks?.length ? (
                  <div className="mt-4">
                    <p className="text-sm font-semibold">Tarefas</p>
                    <ul className="text-sm text-muted-foreground list-disc ml-5">
                      {selectedExposure.tasks.map((t) => (
                        <li key={t.id}>Tarefa {t.id}: {t.status}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm text-foreground">{value ?? '—'}</p>
  </div>
);
