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
    <div className="p-5 space-y-5">
      <section className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Inbox Financeiro</p>
            <h2 className="text-xl font-semibold">Pendências imediatas</h2>
          </div>
          <div className="px-3 py-2 rounded-md border text-sm text-muted-foreground">
            {pendingExposures.length} itens
          </div>
        </div>
      </section>

      <section className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Fila operacional</h3>
          <span className="text-xs text-muted-foreground">Exposições aguardando decisão</span>
        </div>
        {loadingExposures ? (
          <div className="text-muted-foreground text-sm">Carregando...</div>
        ) : pendingExposures.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-md p-4 bg-muted/40">
            Nenhuma exposição pendente. Novas tarefas aparecerão aqui.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingExposures.map((exp) => (
              <div key={exp.id} className="border rounded-md px-3 py-2.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-tight">
                      {exp.exposure_type === 'active' ? 'Exposição ativa' : 'Exposição passiva'} • {exp.product || 'N/D'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fonte {exp.source_type.toUpperCase()} {exp.source_id} • {exp.quantity_mt} MT
                    </p>
                    {exp.tasks?.length ? (
                      <div className="text-[11px] text-muted-foreground">
                        {exp.tasks.map((t) => t.status).join(', ')}
                      </div>
                    ) : null}
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-muted capitalize">{exp.status}</span>
                </div>
                <button
                  onClick={() => setSelectedExposure(exp)}
                  className="mt-2 text-xs flex items-center gap-1 text-primary hover:underline"
                >
                  <Eye className="w-3 h-3" />
                  Detalhar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog.Root open={!!selectedExposure} onOpenChange={() => setSelectedExposure(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-lg p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
            {selectedExposure && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <Dialog.Title className="text-lg font-semibold">Exposição</Dialog.Title>
                    <p className="text-sm text-muted-foreground">
                      {selectedExposure.exposure_type === 'active' ? 'Ativa' : 'Passiva'} • {selectedExposure.source_type.toUpperCase()} {selectedExposure.source_id}
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
