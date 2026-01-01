import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card } from '../../components/ui/card';
import { useData } from '../../../contexts/DataContextAPI';
import { rfqsService } from '../../../services/rfqsService';
import { Rfq, RfqInvitationAnyStatus, RfqInvitationStatus, WhatsAppMessage, Contract } from '../../../types/api';
import { whatsappService } from '../../../services/whatsappService';
import { rankRfq } from '../../../utils/rfqRanking';
import { contractsService } from '../../../services/contractsService';

const statusLabel: Record<RfqInvitationStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  answered: 'Respondido',
  expired: 'Expirado',
  refused: 'Recusado',
};

const asInvitationStatus = (status?: string): RfqInvitationStatus => {
  if (status === 'expired') return 'expired';
  if (status === 'answered' || status === 'quoted') return 'answered';
  if (status === 'refused') return 'refused';
  if (status === 'sent') return 'sent';
  return 'draft';
};

export const RFQDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { rfqs, fetchRfqs, counterparties } = useData();
  const [selectedCounterparty, setSelectedCounterparty] = useState<string>('');
  const [price, setPrice] = useState('');
  const [volume, setVolume] = useState('');
  const [priceType, setPriceType] = useState('');
  const [notes, setNotes] = useState('');
  const [quotedAt, setQuotedAt] = useState(new Date().toISOString().slice(0, 16));
  const [validUntil, setValidUntil] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [awardLoading, setAwardLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [showRanking, setShowRanking] = useState(false);
  const [sortBy, setSortBy] = useState<'pos' | 'cp' | 'score'>('pos');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const rfq = useMemo(() => rfqs.find((item) => String(item.id) === String(id)), [rfqs, id]);
  const isClosed = rfq?.status === 'awarded' || rfq?.status === 'failed';

  useEffect(() => {
    if (!rfqs.length) {
      fetchRfqs();
    }
  }, [rfqs, fetchRfqs]);

  const loadMessages = async () => {
    if (!rfq) return;
    try {
      const list = await whatsappService.listByRfq(rfq.id);
      setMessages(list);
    } catch (err) {
      // silent fallback
    }
  };

  const loadContracts = async () => {
    if (!rfq) return;
    try {
      const list = await contractsService.listByRfq(rfq.id);
      setContracts(list);
    } catch {
      setContracts([]);
    }
  };

  useEffect(() => {
    if (rfq) {
      loadMessages();
      loadContracts();
    }
  }, [rfq?.id]);

  const sortedEntries = React.useMemo(() => {
    const arr = [...ranking.entries];
    arr.sort((a, b) => {
      if (sortBy === 'cp') {
        return sortDir === 'asc'
          ? (a.counterparty_name || '').localeCompare(b.counterparty_name || '')
          : (b.counterparty_name || '').localeCompare(a.counterparty_name || '');
      }
      if (sortBy === 'score') {
        return sortDir === 'asc' ? a.score - b.score : b.score - a.score;
      }
      // posição
      return sortDir === 'asc' ? ranking.entries.indexOf(a) - ranking.entries.indexOf(b) : ranking.entries.indexOf(b) - ranking.entries.indexOf(a);
    });
    return arr;
  }, [ranking.entries, sortBy, sortDir]);

  useEffect(() => {
    if (rfq && rfq.counterparty_quotes.length && !selectedCounterparty) {
      const first = rfq.counterparty_quotes[0];
      if (first.counterparty_id) setSelectedCounterparty(String(first.counterparty_id));
    }
  }, [rfq, selectedCounterparty]);

  if (!rfq) {
    return (
      <div className="p-5">
        <div className="text-sm text-muted-foreground border rounded-md p-4 bg-muted/40">
          RFQ não encontrado. Volte para a lista.
        </div>
        <Button variant="outline" className="mt-3" onClick={() => navigate('/financeiro/rfqs')}>
          Voltar
        </Button>
      </div>
    );
  }

  const invitations = useMemo(() => {
    const map = new Map<number, RfqInvitationStatus>();
    rfq.invitations?.forEach((inv) => {
      map.set(inv.counterparty_id, asInvitationStatus(inv.status));
    });
    rfq.counterparty_quotes.forEach((q) => {
      const cpId = q.counterparty_id || 0;
      const status = asInvitationStatus(q.status);
      map.set(cpId, status);
    });

    const baseList: Array<{
      counterparty_id: number;
      counterparty_name: string;
      status: RfqInvitationStatus;
      responded_at?: string;
      message_text?: string;
    }> = rfq.invitations?.length
      ? rfq.invitations.map((inv) => ({
          counterparty_id: inv.counterparty_id,
          counterparty_name: inv.counterparty_name || 'Contraparte',
          status: asInvitationStatus(inv.status),
          responded_at: inv.responded_at,
          message_text: inv.message_text,
        }))
      : rfq.counterparty_quotes.map((q) => ({
          counterparty_id: q.counterparty_id || 0,
          counterparty_name: q.counterparty_name || 'Contraparte',
          status: asInvitationStatus(q.status),
          responded_at: q.quoted_at,
          message_text: undefined,
        }));

    return baseList.map((inv) => ({
      ...inv,
      status: map.get(inv.counterparty_id) || inv.status,
    }));
  }, [rfq.counterparty_quotes, rfq.invitations]);

  const pendingInvites = invitations.filter((inv) => inv.status === 'sent' || inv.status === 'draft').length;
  const ranking = rankRfq(rfq);
  const best = ranking.entries[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!selectedCounterparty || !price) {
      setError('Selecione a contraparte e informe o preço.');
      return;
    }
    setSaving(true);
    try {
      const counterpartyId = Number(selectedCounterparty);
      const cpName =
        rfq.counterparty_quotes.find((q) => q.counterparty_id === counterpartyId)?.counterparty_name ||
        counterparties.find((c) => c.id === counterpartyId)?.name ||
        'Contraparte';

      await rfqsService.addQuote(rfq.id, {
        counterparty_id: counterpartyId,
        counterparty_name: cpName,
        quote_price: Number(price),
        volume_mt: volume ? Number(volume) : undefined,
        valid_until: validUntil || undefined,
        price_type: priceType || undefined,
        notes: notes || undefined,
        quoted_at: new Date(quotedAt).toISOString(),
        status: 'answered',
      });
      await fetchRfqs();
      await loadMessages();
      setPrice('');
      setVolume('');
      setPriceType('');
      setNotes('');
      setValidUntil('');
      setMessage('Resposta registrada.');
    } catch {
      setError('Não foi possível registrar a resposta agora.');
    } finally {
      setSaving(false);
    }
  };

  const handleAward = async (quoteId: number) => {
    const reason = prompt('Informe o motivo da decisão');
    if (!reason || !reason.trim()) return;
    setAwardLoading(true);
    setError(null);
    setMessage(null);
    try {
      await rfqsService.award(rfq!.id, { quote_id: quoteId, motivo: reason.trim() });
      await fetchRfqs();
      await loadMessages();
      setMessage('RFQ encerrado com cotação vencedora.');
    } catch (err: any) {
      setError('Não foi possível registrar a decisão.');
    } finally {
      setAwardLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const blob = await rfqsService.downloadQuotes(rfq.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rfq_${rfq.id}_cotas.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch {
      setError('Não foi possível gerar o histórico agora.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">RFQ</p>
          <h1 className="text-xl font-semibold">{rfq.rfq_number}</h1>
          <p className="text-sm text-muted-foreground">SO {rfq.so_id} • {rfq.quantity_mt} MT • Período {rfq.period}</p>
          {rfq.decided_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Decisão em {new Date(rfq.decided_at).toLocaleString()} {rfq.decision_reason ? `• ${rfq.decision_reason}` : ''}
            </p>
          )}
          {isClosed && <p className="text-xs text-emerald-700 font-semibold mt-1">RFQ encerrado</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowRanking(true)}>
            Ver ranking
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading || !rfq.counterparty_quotes.length}>
            {downloading ? 'Gerando...' : 'Exportar histórico'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/financeiro/rfqs')}>
            Voltar
          </Button>
        </div>
      </div>

      {(message || error) && (
        <div className={`text-sm px-3 py-2 rounded-md border ${error ? 'border-destructive text-destructive bg-destructive/10' : 'border-emerald-200 text-emerald-700 bg-emerald-50'}`}>
          {error || message}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-3">
        <Card className="p-4 bg-card border">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Lado</p>
          <p className="text-lg font-semibold capitalize">{(rfq.side || 'buy')}</p>
        </Card>
        <Card className="p-4 bg-card border">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Convites pendentes</p>
          <p className="text-lg font-semibold">{pendingInvites}</p>
        </Card>
        <Card className="p-4 bg-card border">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Cotações recebidas</p>
          <p className="text-lg font-semibold">{rfq.counterparty_quotes.length}</p>
        </Card>
        <Card className="p-4 bg-card border">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Deal</p>
          <p className="text-lg font-semibold">{rfq.deal_id || '—'}</p>
          <p className="text-xs text-muted-foreground">{contracts.length} contract(s)</p>
        </Card>
        {rfq.winner_quote_id && (
          <Card className="p-4 bg-emerald-50 border border-emerald-200">
            <p className="text-[11px] text-emerald-800 uppercase tracking-wide">Cotação vencedora</p>
            <p className="text-sm text-emerald-900 font-semibold mt-1">
              {rfq.counterparty_quotes.find((q) => q.id === rfq.winner_quote_id)?.counterparty_name || 'Contraparte'} • USD {rfq.counterparty_quotes.find((q) => q.id === rfq.winner_quote_id)?.quote_price.toFixed(2)}
            </p>
            {rfq.winner_rank && <p className="text-xs text-emerald-800">Ranking: #{rfq.winner_rank}</p>}
            {rfq.decided_at && <p className="text-xs text-emerald-800">Decisão em {new Date(rfq.decided_at).toLocaleString()}</p>}
            {rfq.decision_reason && <p className="text-xs text-emerald-800 mt-1">Motivo: {rfq.decision_reason}</p>}
          </Card>
        )}
      </div>

      <section className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Convites</h3>
          <span className="text-xs text-muted-foreground">Status por contraparte</span>
        </div>
        {invitations.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/40">Nenhuma contraparte vinculada.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {invitations.map((inv) => (
              <div key={`${inv.counterparty_id}-${inv.counterparty_name}`} className="border rounded-md p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{inv.counterparty_name}</p>
                  <p className="text-xs text-muted-foreground">{inv.responded_at ? `Resposta em ${inv.responded_at}` : 'Aguardando resposta'}</p>
                  {inv.message_text && <p className="text-xs text-muted-foreground mt-1">Mensagem enviada: {inv.message_text}</p>}
                </div>
                <span className="px-2 py-1 rounded-full bg-muted text-[11px] capitalize">
                  {statusLabel[inv.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Mensagens WhatsApp</h3>
          <span className="text-xs text-muted-foreground">{messages.length} registradas</span>
        </div>
        {messages.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/40">Nenhuma mensagem vinculada.</div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className="border rounded-md p-2 bg-muted/30">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{msg.direction === 'inbound' ? 'Recebida' : 'Enviada'} • {new Date(msg.created_at).toLocaleString()}</span>
                  <span>{msg.phone || 'Telefone não informado'}</span>
                </div>
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{msg.content_text || '—'}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={async () => { await whatsappService.export(rfq.id); }} disabled={!messages.length}>
            Exportar CSV
          </Button>
        </div>
      </section>

      <section className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Contracts gerados</h3>
          <span className="text-xs text-muted-foreground">{contracts.length} registrados</span>
        </div>
        {contracts.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/40">Nenhum contract criado.</div>
        ) : (
          <div className="space-y-2">
            {contracts.map((c) => (
              <div key={c.contract_id} className="border rounded-md p-3 bg-muted/20 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Contract {c.contract_id}</span>
                  <span className="text-xs text-muted-foreground">{c.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">Deal {c.deal_id} • RFQ {c.rfq_id}</p>
                <p className="text-xs text-muted-foreground">Trade #{c.trade_index ?? 0} • Grupo {c.quote_group_id || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {!isClosed && (
      <section className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Registrar cotação</h3>
          <span className="text-xs text-muted-foreground">Imutável após envio</span>
        </div>
        <form className="grid md:grid-cols-6 gap-3" onSubmit={handleSubmit}>
          <div className="md:col-span-2 space-y-1">
            <Label className="text-xs text-muted-foreground">Contraparte</Label>
            <Select value={selectedCounterparty} onValueChange={setSelectedCounterparty}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {invitations.map((inv) => (
                  <SelectItem key={inv.counterparty_id} value={String(inv.counterparty_id)}>
                    {inv.counterparty_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Preço</Label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Volume</Label>
            <Input value={volume} onChange={(e) => setVolume(e.target.value)} type="number" min="0" step="0.01" placeholder="MT" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tipo de preço</Label>
            <Input value={priceType} onChange={(e) => setPriceType(e.target.value)} placeholder="Fixo, LME + prêmio..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Timestamp</Label>
            <Input value={quotedAt} onChange={(e) => setQuotedAt(e.target.value)} type="datetime-local" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Validade (opcional)</Label>
            <Input value={validUntil} onChange={(e) => setValidUntil(e.target.value)} type="datetime-local" />
          </div>
          <div className="md:col-span-6 space-y-1">
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes fornecidos pela contraparte" />
          </div>
          <Button type="submit" className="md:col-span-6" disabled={saving}>
            {saving ? 'Registrando...' : 'Registrar resposta'}
          </Button>
        </form>
      </section>
      )}

      {showRanking && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[520px] bg-card border-l shadow-xl p-4 space-y-3 z-50 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Ranking de cotações</h3>
              <p className="text-xs text-muted-foreground">{ranking.side === 'buy' ? 'Menor preço (compra) → melhor' : 'Maior preço (venda) → melhor'}{ranking.entries.length > 1 && ' | pacotes multi-trade: maior spread é melhor'}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowRanking(false)}>Fechar</Button>
          </div>
          {rfq.counterparty_quotes.length === 0 ? (
            <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/40">Sem cotações recebidas.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-3 py-2 border-b cursor-pointer" onClick={() => { setSortBy('pos'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Pos</th>
                    <th className="text-left px-3 py-2 border-b cursor-pointer" onClick={() => { setSortBy('cp'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Contraparte</th>
                    <th className="text-left px-3 py-2 border-b">Status</th>
                    <th className="text-left px-3 py-2 border-b cursor-pointer" onClick={() => { setSortBy('score'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Score</th>
                    <th className="text-left px-3 py-2 border-b">Detalhe</th>
                    <th className="text-left px-3 py-2 border-b">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((entry, idx) => {
                    const isWinner = !!rfq.winner_quote_id && entry.trades.some((t) =>
                      rfq.counterparty_quotes.find((q) => q.id === rfq.winner_quote_id && (q.quote_group_id || `q-${q.id}`) === t.groupId)
                    );
                    const firstTrade = entry.trades[0];
                    const isSpread = entry.trades.length > 1;
                    const [buyLeg, sellLeg] = entry.trades;
                    const spread = isSpread && sellLeg ? (sellLeg.sellPrice ?? sellLeg.buyPrice) - buyLeg.buyPrice : undefined;
                    const spreadClass = spread !== undefined ? (spread >= 0 ? 'text-emerald-700' : 'text-rose-700') : '';
                    return (
                      <tr key={`${entry.counterparty_name}-${idx}`} className={`border-b last:border-none ${idx === 0 ? 'bg-muted/30' : ''}`}>
                        <td className="px-3 py-2 font-semibold">{idx + 1}{idx === 0 && <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Melhor</span>}</td>
                        <td className="px-3 py-2">{entry.counterparty_name || 'Contraparte'}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{isWinner ? 'Selecionada' : rfq.status}</td>
                        <td className={`px-3 py-2 font-semibold ${spreadClass}`}>{entry.display}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {isSpread ? (
                            <div className="space-y-1">
                              <div>Compra: {buyLeg ? `USD ${buyLeg.buyPrice.toFixed(2)}` : '—'}</div>
                              <div>Venda: {sellLeg ? `USD ${(sellLeg.sellPrice ?? sellLeg.buyPrice).toFixed(2)}` : '—'}</div>
                              <div className={spreadClass}>Spread: {spread !== undefined ? `USD ${spread.toFixed(2)}` : '—'}</div>
                            </div>
                          ) : (
                            <span>{entry.display}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 space-x-2">
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => {
                              const targetId = firstTrade ? rfq.counterparty_quotes.find((q) => (q.quote_group_id || `q-${q.id}`) === firstTrade.groupId)?.id : undefined;
                              if (targetId) handleAward(targetId);
                            }}
                            disabled={isClosed || awardLoading}
                          >
                            Contratar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={async () => {
                              if (!entry.counterparty_id) return;
                              await whatsappService.sendRfq({ rfq_id: rfq.id, counterparty_ids: [entry.counterparty_id], template_name: 'update_quote' });
                              setMessage('Solicitação de atualização enviada.');
                            }}
                            disabled={isClosed || !entry.counterparty_id}
                          >
                            Atualizar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={async () => {
                              if (!entry.counterparty_id) return;
                              await whatsappService.sendRfq({ rfq_id: rfq.id, counterparty_ids: [entry.counterparty_id], template_name: 'reject_quote' });
                              setMessage('Recusa enviada.');
                            }}
                            disabled={isClosed || !entry.counterparty_id}
                          >
                            Recusar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {best && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded">
              Melhor resposta: {best.counterparty_name || 'Contraparte'} • {best.display}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
