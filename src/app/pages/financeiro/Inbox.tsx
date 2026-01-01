import React, { useState } from 'react';
import { Eye, X, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { useData } from '../../../contexts/DataContextAPI';
import { Exposure } from '../../../types/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';

export const FinanceiroInbox = () => {
  const { exposures, loadingExposures } = useData();
  const [selectedExposure, setSelectedExposure] = useState<Exposure | null>(null);

  const pendingExposures = exposures;

  return (
    <div className="p-5 space-y-5">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Inbox Financeiro</p>
              <h2 className="text-xl font-semibold">Pendências imediatas</h2>
            </div>
            <Badge variant="secondary">
              {pendingExposures.length} itens
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Fila operacional</CardTitle>
            <span className="text-xs text-muted-foreground">Exposições aguardando decisão</span>
          </div>
        </CardHeader>
        <CardContent>
          {loadingExposures ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-6 w-20 mt-3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pendingExposures.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <p className="text-sm text-muted-foreground">
                Nenhuma tarefa pendente
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Novas tarefas aparecerão aqui quando criadas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingExposures.map((exp) => (
                <Card key={exp.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          {exp.exposure_type === 'active' ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <p className="text-sm font-medium leading-tight">
                            {exp.exposure_type === 'active' ? 'Exposição ativa' : 'Exposição passiva'} • {exp.product || 'N/D'}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Fonte {exp.source_type.toUpperCase()} {exp.source_id} • {exp.quantity_mt} MT
                        </p>
                        {exp.tasks?.length ? (
                          <div className="text-[11px] text-muted-foreground">
                            {exp.tasks.map((t) => t.status).join(', ')}
                          </div>
                        ) : null}
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {exp.status}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedExposure(exp)}
                      className="mt-3 h-6 px-2 text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Detalhar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedExposure} onOpenChange={() => setSelectedExposure(null)}>
        <DialogContent className="max-w-2xl">
          {selectedExposure && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <DialogTitle>Exposição</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedExposure.exposure_type === 'active' ? 'Ativa' : 'Passiva'} • {selectedExposure.source_type.toUpperCase()} {selectedExposure.source_id}
                    </p>
                  </div>
                  <DialogClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="w-4 h-4" />
                    </Button>
                  </DialogClose>
                </div>
              </DialogHeader>
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
                  <p className="text-sm font-semibold mb-2">Tarefas</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {selectedExposure.tasks.map((t) => (
                      <li key={t.id} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        Tarefa {t.id}: {t.status}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm text-foreground">{value ?? '—'}</p>
  </div>
);