import React, { useEffect, useState } from "react";
import { ChevronDown, Copy, Mail, Plus, Send, Trash2 } from "lucide-react";
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { useLocation } from 'react-router-dom';
import { rfqsService } from '../../../services/rfqsService';
import {
  RfqInvitation,
  RfqInvitationStatus,
  RfqOrderType,
  RfqPreviewLeg,
  RfqPreviewRequest,
  RfqPriceType,
  RfqStatus,
  RfqSide,
} from '../../../types/api';
import { useData } from '../../../contexts/DataContextAPI';
import { Page, PageHeader } from "../../components/ui/page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

interface Trade {
  id: number;
  quantity: number;
  tradeType: 'Swap' | 'Forward';
  syncPpt: boolean;
  leg1: TradeLeg;
  leg2: TradeLeg;
  output: string;
}

interface TradeLeg {
  side: 'buy' | 'sell';
  priceType: '' | RfqPriceType;
  month: string;
  year: string;
  startDate: string;
  endDate: string;
  fixingDate: string;
  orderType: RfqOrderType;
  orderValidity: '' | 'Day' | 'GTC' | '3 Hours' | '6 Hours' | '12 Hours' | 'Until Further Notice';
  limitPrice: number;
}

type InvitationStatus = RfqInvitation['status'];
type Invitation = RfqInvitation & { quote_price?: number };

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getCurrentYears = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 10 }, (_, i) => (currentYear + i).toString());
};

export const NovoRFQ = () => {
  const { counterparties, salesOrders, fetchRfqs } = useData();
  const [company, setCompany] = useState<'Alcast Brasil' | 'Alcast Trading'>('Alcast Brasil');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [finalOutput, setFinalOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [savingRfq, setSavingRfq] = useState(false);
  const [rfqSide, setRfqSide] = useState<RfqSide>('buy');
  const [rfqMessage, setRfqMessage] = useState('');
  const [rfqPeriod, setRfqPeriod] = useState('');
  const [rfqQuantity, setRfqQuantity] = useState<number>(0);
  const [selectedSO, setSelectedSO] = useState<string>('');
  const [selectedCounterparties, setSelectedCounterparties] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [createdRfqId, setCreatedRfqId] = useState<number | null>(null);
  const location = useLocation();
  const sourceInfo = (location.state as any) || {};

  const createEmptyTrade = (id: number): Trade => ({
    id,
    quantity: 0,
    tradeType: 'Swap',
    syncPpt: false,
    leg1: createEmptyLeg('buy'),
    leg2: createEmptyLeg('sell'),
    output: '',
  });

  const createEmptyLeg = (side: 'buy' | 'sell'): TradeLeg => ({
    side,
    priceType: '',
    month: MONTHS[new Date().getMonth()],
  year: new Date().getFullYear().toString(),
  startDate: '',
  endDate: '',
  fixingDate: '',
  orderType: 'At Market',
  orderValidity: '',
  limitPrice: 0,
});

  useEffect(() => {
    if (trades.length === 0) {
      addTrade();
    }
  }, []);

  useEffect(() => {
    if (sourceInfo?.sourceNumber) {
      setFinalOutput(`Source: ${sourceInfo.sourceType?.toUpperCase()} ${sourceInfo.sourceNumber}\n`);
    }
  }, [sourceInfo]);

  const addTrade = () => {
    const newId = trades.length > 0 ? Math.max(...trades.map(t => t.id)) + 1 : 1;
    setTrades([...trades, createEmptyTrade(newId)]);
  };

  const removeTrade = (id: number) => {
    if (trades.length === 1) return;
    setTrades(trades.filter(t => t.id !== id));
  };

  const updateTrade = (id: number, updates: Partial<Trade>) => {
    setTrades(trades.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const updateLeg = (tradeId: number, leg: 'leg1' | 'leg2', updates: Partial<TradeLeg>) => {
    setTrades(trades.map(t => {
      if (t.id === tradeId) {
        const updatedLeg = { ...t[leg], ...updates };

        // Sincronizar Buy/Sell entre legs
        if ('side' in updates) {
          const otherLeg = leg === 'leg1' ? 'leg2' : 'leg1';
          const otherSide = updates.side === 'buy' ? 'sell' : 'buy';
          return {
            ...t,
            [leg]: updatedLeg,
            [otherLeg]: { ...t[otherLeg], side: otherSide }
          };
        }

        return { ...t, [leg]: updatedLeg };
      }
      return t;
    }));
  };

  const applyTemplate = (tradeId: number, template: 'queda' | 'alta') => {
    const trade = trades.find(t => t.id === tradeId);
    if (!trade) return;

    if (template === 'queda') {
      // Proteção de Queda: Buy AVG, Sell Fix
      updateTrade(tradeId, {
        tradeType: 'Swap',
        leg1: { ...trade.leg1, side: 'buy', priceType: 'AVG' },
        leg2: { ...trade.leg2, side: 'sell', priceType: 'Fix' },
      });
    } else {
      // Proteção de Alta: Sell AVG, Buy Fix
      updateTrade(tradeId, {
        tradeType: 'Swap',
        leg1: { ...trade.leg1, side: 'sell', priceType: 'AVG' },
        leg2: { ...trade.leg2, side: 'buy', priceType: 'Fix' },
      });
    }
  };

  const buildLegPayload = (trade: Trade, leg: TradeLeg): RfqPreviewLeg => {
    if (!leg.priceType) {
      throw new Error('Selecione o Price Type em todas as legs.');
    }

    const priceType = leg.priceType;
    const base: RfqPreviewLeg = {
      side: leg.side,
      price_type: priceType,
      quantity_mt: trade.quantity,
    };

    if (priceType === 'AVG') {
      if (!leg.month || !leg.year) {
        throw new Error('Informe mês e ano para AVG.');
      }
      base.month_name = leg.month;
      base.year = Number(leg.year);
    }

    if (priceType === 'AVGInter') {
      if (!leg.startDate || !leg.endDate) {
        throw new Error('Informe start/end date para AVG Period.');
      }
      base.start_date = leg.startDate;
      base.end_date = leg.endDate;
    }

    if ((priceType === 'Fix' || priceType === 'C2R') && !leg.fixingDate) {
      throw new Error('Informe Fixing Date para Fix ou C2R.');
    }

    if (priceType === 'Fix' || priceType === 'C2R') {
      const needsOrder = leg.orderType && leg.orderType !== 'At Market';
      if (needsOrder) {
        base.order = {
          order_type: leg.orderType,
          validity: leg.orderValidity || undefined,
          limit_price: leg.orderType === 'Limit' && leg.limitPrice ? String(leg.limitPrice) : undefined,
        };
      }
      base.fixing_date = leg.fixingDate || undefined;
    }

    return base;
  };

  const handleGeneratePreview = async () => {
    setError(null);
    setFinalOutput('');

    if (!trades.length) {
      setError('Adicione pelo menos um trade.');
      return;
    }

    try {
      setIsGenerating(true);
      const outputs: string[] = [];

      for (let i = 0; i < trades.length; i++) {
        const trade = trades[i];
        if (!trade.quantity || trade.quantity <= 0) {
          throw new Error('Informe quantidade (>0) em todos os trades.');
        }

        const leg1Payload = buildLegPayload(trade, trade.leg1);
        let leg2Payload: RfqPreviewLeg | undefined;

        if (trade.tradeType === 'Swap') {
          leg2Payload = buildLegPayload(trade, trade.leg2);
        } else if (trade.tradeType === 'Forward' && trade.leg2.priceType) {
          leg2Payload = buildLegPayload(trade, trade.leg2);
        }

        const payload: RfqPreviewRequest = {
          trade_type: trade.tradeType,
          leg1: leg1Payload,
          leg2: leg2Payload,
          sync_ppt: trade.syncPpt,
          company_header: i === 0 ? company : undefined,
          company_label_for_payoff: company,
        };

        const response = await rfqsService.preview(payload);
        outputs.push(response.text);
      }

      setFinalOutput(outputs.join('\n\n'));
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || err.message || 'Erro ao gerar RFQ');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!finalOutput) return;
    navigator.clipboard.writeText(finalOutput);
  };

  const shareWhatsApp = () => {
    if (!finalOutput) return;
    const url = `https://wa.me/?text=${encodeURIComponent(finalOutput)}`;
    window.open(url, '_blank');
  };

  const sendEmail = () => {
    if (!finalOutput) return;
    const subject = `RFQ - ${company}`;
    const body = encodeURIComponent(finalOutput);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  useEffect(() => {
    if (salesOrders.length && !selectedSO) {
      const first = salesOrders[0];
      setSelectedSO(String(first.id));
      setRfqQuantity(first.total_quantity_mt || 0);
      setRfqPeriod(first.pricing_period || '');
    }
  }, [salesOrders, selectedSO]);

  useEffect(() => {
    if (selectAll) {
      setSelectedCounterparties(counterparties.map((c) => c.id));
    }
  }, [selectAll, counterparties]);

  const toggleCounterparty = (id: number) => {
    setSelectAll(false);
    setSelectedCounterparties((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const buildInvitations = (): Invitation[] => {
    const ids = selectAll ? counterparties.map((c) => c.id) : selectedCounterparties;
    const unique = Array.from(new Set(ids));
    return unique.map((id) => ({
      counterparty_id: id,
      counterparty_name: counterparties.find((c) => c.id === id)?.name || 'Contraparte',
      status: 'sent',
    }));
  };

  const handleCreateRfq = async () => {
    setError(null);
    setStatusMessage(null);
    if (!selectedSO || !rfqPeriod || !rfqQuantity) {
      setError('Preencha SO, período e quantidade antes de enviar.');
      return;
    }
    const invitePayload = buildInvitations();
    if (!invitePayload.length) {
      setError('Selecione ao menos uma contraparte.');
      return;
    }

    const rfqNumber = `RFQ-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    setSavingRfq(true);
    try {
      const invitePayload = buildInvitations();
      const created = await rfqsService.create({
        rfq_number: rfqNumber,
        so_id: Number(selectedSO),
        quantity_mt: rfqQuantity,
        period: rfqPeriod,
        side: rfqSide,
        status: RfqStatus.PENDING,
        message_text: rfqMessage || undefined,
        invitations: invitePayload.map((inv) => ({
          counterparty_id: inv.counterparty_id,
          counterparty_name: inv.counterparty_name,
          status: 'sent',
        })),
        counterparty_quotes: [],
      });
      setInvitations(created.invitations || invitePayload);
      setCreatedRfqId(created.id);
      setStatusMessage('Convites enviados. Registre as respostas conforme chegarem.');
      fetchRfqs();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || 'Falha ao criar o RFQ.');
    } finally {
      setSavingRfq(false);
    }
  };

  const handleQuoteCapture = async (invitation: Invitation, quoteValue?: number, nextStatus?: InvitationStatus) => {
    setInvitations((prev) =>
      prev.map((inv) =>
        inv.counterparty_id === invitation.counterparty_id
          ? { ...inv, quote_price: quoteValue, status: nextStatus || inv.status }
          : inv,
      ),
    );

    if (!createdRfqId || !quoteValue) return;
    try {
      await rfqsService.addQuote(createdRfqId, {
        counterparty_id: invitation.counterparty_id,
        counterparty_name: invitation.counterparty_name || 'Contraparte',
        quote_price: quoteValue,
        status: nextStatus || 'answered',
      });
      setStatusMessage('Resposta registrada e ranking atualizado.');
      fetchRfqs();
    } catch (err) {
      setError('Resposta salva localmente. Não foi possível persistir no backend.');
    }
  };

  const sortedInvitations = invitations
    .filter((inv) => inv.quote_price !== undefined)
    .sort((a, b) =>
      rfqSide === 'buy'
        ? (a.quote_price || 0) - (b.quote_price || 0)
        : (b.quote_price || 0) - (a.quote_price || 0),
    );

  return (
    <Page>
      <PageHeader
        title="Novo RFQ"
        description="Convite único para múltiplas contrapartes"
        meta={
          sourceInfo?.sourceNumber ? (
            <span className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-foreground">
              Origem: {sourceInfo.sourceType?.toUpperCase()} {sourceInfo.sourceNumber}
            </span>
          ) : undefined
        }
      />

      {(error || statusMessage) && (
        <div className={`text-sm px-3 py-2 rounded-md border ${error ? 'border-destructive text-destructive bg-destructive/10' : 'border-emerald-200 text-emerald-700 bg-emerald-50'}`}>
          {error || statusMessage}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4 bg-card border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">Configuração</h3>
            <span className="text-xs text-muted-foreground">Defina o pedido</span>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm">Sales Order</Label>
              <Select value={selectedSO} onValueChange={(value) => setSelectedSO(value)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione um SO" />
                </SelectTrigger>
                <SelectContent>
                  {salesOrders.map((so) => (
                    <SelectItem key={so.id} value={String(so.id)}>
                      {so.so_number} • {so.product || 'Produto'} • {so.total_quantity_mt} MT
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">Quantidade (MT)</Label>
                <Input
                  type="number"
                  value={rfqQuantity || ''}
                  onChange={(e) => setRfqQuantity(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Período</Label>
                <Input
                  value={rfqPeriod}
                  onChange={(e) => setRfqPeriod(e.target.value)}
                  placeholder="YYYY-MM"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Lado</Label>
              <RadioGroup value={rfqSide} onValueChange={(value: any) => setRfqSide(value)}>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="buy" id="side-buy" />
                    <Label htmlFor="side-buy" className="cursor-pointer text-sm">Comprar (hedge passivo)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sell" id="side-sell" />
                    <Label htmlFor="side-sell" className="cursor-pointer text-sm">Vender (hedge ativo)</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Mensagem breve</Label>
              <Textarea
                value={rfqMessage}
                onChange={(e) => setRfqMessage(e.target.value)}
                placeholder="Observações aos participantes"
                className="min-h-[80px]"
              />
            </div>

            <Button onClick={handleCreateRfq} size="sm" disabled={savingRfq} className="w-full">
              {savingRfq ? 'Enviando...' : 'Criar RFQ e disparar convites'}
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-card border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">Contrapartes</h3>
            <div className="flex items-center gap-2 text-xs">
              <Checkbox id="select-all-cp" checked={selectAll} onCheckedChange={(checked) => setSelectAll(!!checked)} />
              <Label htmlFor="select-all-cp" className="cursor-pointer">Selecionar todas</Label>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {counterparties.map((cp) => (
              <label key={cp.id} className="flex items-center gap-2 text-sm px-3 py-2 border rounded-md bg-background cursor-pointer">
                <Checkbox
                  checked={selectAll || selectedCounterparties.includes(cp.id)}
                  onCheckedChange={() => toggleCounterparty(cp.id)}
                />
                <div className="flex flex-col">
                  <span className="font-medium">{cp.name}</span>
                  <span className="text-[11px] text-muted-foreground">{cp.contact_email || cp.contact_phone || 'Contato não informado'}</span>
                </div>
              </label>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-card border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Convites e respostas</h3>
            <p className="text-xs text-muted-foreground">Status: enviado, respondido, expirado, recusado</p>
          </div>
          <span className="text-xs text-muted-foreground">{invitations.length || 0} convites</span>
        </div>

        {invitations.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/40">
            Nenhuma contraparte selecionada ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contraparte</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cotação</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.counterparty_id}>
                    <TableCell>{inv.counterparty_name}</TableCell>
                    <TableCell>
                      <Select
                        value={inv.status}
                        onValueChange={(value: InvitationStatus) =>
                          setInvitations((prev) =>
                            prev.map((item) =>
                              item.counterparty_id === inv.counterparty_id ? { ...item, status: value } : item,
                            ),
                          )
                        }
                      >
                        <SelectTrigger size="sm" className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sent">Enviado</SelectItem>
                          <SelectItem value="answered">Respondido</SelectItem>
                          <SelectItem value="expired">Expirado</SelectItem>
                          <SelectItem value="refused">Recusado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="Preço"
                        value={inv.quote_price ?? ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          setInvitations((prev) =>
                            prev.map((item) =>
                              item.counterparty_id === inv.counterparty_id ? { ...item, quote_price: value } : item,
                            ),
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuoteCapture(inv, inv.quote_price, inv.status)}
                        disabled={!inv.quote_price}
                      >
                        Registrar resposta
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {sortedInvitations.length > 0 && (
          <div className="border rounded-md">
            <div className="flex justify-between items-center px-3 py-2 bg-muted">
              <p className="text-sm font-semibold">Ranking</p>
              <span className="text-xs text-muted-foreground">{rfqSide === 'buy' ? 'Menor preço vence' : 'Maior preço vence'}</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Contraparte</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInvitations.map((inv, idx) => (
                  <TableRow key={inv.counterparty_id}>
                    <TableCell className="font-semibold">{idx + 1}</TableCell>
                    <TableCell>{inv.counterparty_name}</TableCell>
                    <TableCell>{inv.quote_price?.toFixed(2)}</TableCell>
                    <TableCell className="capitalize text-xs">{inv.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Company Selection */}
      <Card className="p-4 bg-card border">
        <Label className="mb-2 block font-semibold">Empresa</Label>
        <RadioGroup value={company} onValueChange={(value: any) => setCompany(value)}>
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Alcast Brasil" id="brasil" />
              <Label htmlFor="brasil" className="cursor-pointer text-sm">Alcast Brasil</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Alcast Trading" id="trading" />
              <Label htmlFor="trading" className="cursor-pointer text-sm">Alcast Trading</Label>
            </div>
          </div>
        </RadioGroup>
      </Card>

      {/* Trades */}
      <div className="space-y-4">
        {trades.map((trade, index) => (
          <TradeCard
            key={trade.id}
            trade={trade}
            tradeNumber={index + 1}
            onUpdate={updateTrade}
            onUpdateLeg={updateLeg}
            onRemove={removeTrade}
            onApplyTemplate={applyTemplate}
            canRemove={trades.length > 1}
          />
        ))}
      </div>

      {/* Output Section */}
      <Card className="p-5 space-y-4 bg-card border">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-foreground">Pré-visualização</h3>
          <Button
            onClick={handleGeneratePreview}
            disabled={isGenerating}
            variant="outline"
            size="sm"
          >
            {isGenerating ? 'Gerando...' : 'Gerar output'}
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <Textarea
          value={finalOutput}
          readOnly
          placeholder="O texto gerado aparecerá aqui..."
          className="min-h-[200px] font-mono text-sm bg-muted border"
        />

        <div className="flex flex-wrap gap-2">
          <Button onClick={addTrade} variant="outline" size="sm">
            <Plus className="w-4 h-4" />
            Adicionar trade
          </Button>
          <Button onClick={copyToClipboard} variant="ghost" size="sm" disabled={!finalOutput}>
            <Copy className="w-4 h-4" />
            Copiar
          </Button>
          <Button onClick={shareWhatsApp} variant="ghost" size="sm" disabled={!finalOutput}>
            <Send className="w-4 h-4" />
            WhatsApp
          </Button>
          <Button onClick={sendEmail} variant="ghost" size="sm" disabled={!finalOutput}>
            <Mail className="w-4 h-4" />
            E-mail
          </Button>
        </div>
      </Card>
    </Page>
  );
};

interface TradeCardProps {
  trade: Trade;
  tradeNumber: number;
  onUpdate: (id: number, updates: Partial<Trade>) => void;
  onUpdateLeg: (tradeId: number, leg: 'leg1' | 'leg2', updates: Partial<TradeLeg>) => void;
  onRemove: (id: number) => void;
  onApplyTemplate: (tradeId: number, template: 'queda' | 'alta') => void;
  canRemove: boolean;
}

const TradeCard: React.FC<TradeCardProps> = ({
  trade,
  tradeNumber,
  onUpdate,
  onUpdateLeg,
  onRemove,
  onApplyTemplate,
  canRemove,
}) => {
  return (
    <Card className="p-5 space-y-5 bg-card border">
      {/* Trade Header */}
      <div className="flex justify-between items-center pb-3 border-b border-muted">
        <h3 className="font-semibold text-foreground">Trade {tradeNumber}</h3>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Templates <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onApplyTemplate(trade.id, 'queda')}>
                Proteção de Queda
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onApplyTemplate(trade.id, 'alta')}>
                Proteção de Alta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canRemove && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemove(trade.id)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Trade Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg border bg-muted/30">
        <div className="space-y-2">
          <Label htmlFor={`qty-${trade.id}`} className="font-medium text-sm">Quantidade (mt)</Label>
          <Input
            id={`qty-${trade.id}`}
            type="number"
            min="0"
            step="1"
            value={trade.quantity || ''}
            onChange={(e) => onUpdate(trade.id, { quantity: parseFloat(e.target.value) || 0 })}
            className="border-slate-300 bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`type-${trade.id}`} className="font-medium text-sm">Trade Type</Label>
          <Select
            value={trade.tradeType}
            onValueChange={(value: 'Swap' | 'Forward') => onUpdate(trade.id, { tradeType: value })}
          >
            <SelectTrigger id={`type-${trade.id}`} className="border-slate-300 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Swap">Swap</SelectItem>
              <SelectItem value="Forward">Forward</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`sync-${trade.id}`}
              checked={trade.syncPpt}
              onCheckedChange={(checked) => onUpdate(trade.id, { syncPpt: checked as boolean })}
            />
            <Label htmlFor={`sync-${trade.id}`} className="cursor-pointer text-sm font-medium">Sync PPT</Label>
          </div>
        </div>
      </div>

      {/* Legs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LegSection
          leg={trade.leg1}
          legNumber={1}
          tradeId={trade.id}
          onUpdate={(updates) => onUpdateLeg(trade.id, 'leg1', updates)}
        />
        <LegSection
          leg={trade.leg2}
          legNumber={2}
          tradeId={trade.id}
          onUpdate={(updates) => onUpdateLeg(trade.id, 'leg2', updates)}
        />
      </div>
    </Card>
  );
};

interface LegSectionProps {
  leg: TradeLeg;
  legNumber: number;
  tradeId: number;
  onUpdate: (updates: Partial<TradeLeg>) => void;
}

const LegSection: React.FC<LegSectionProps> = ({ leg, legNumber, tradeId, onUpdate }) => {
  const showAvgFields = leg.priceType === 'AVG';
  const showAvgInterFields = leg.priceType === 'AVGInter';
  const showFixingDate = leg.priceType === 'Fix' || leg.priceType === 'C2R';
  const showOrderFields = leg.priceType === 'Fix' || leg.priceType === 'C2R';

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h4 className="font-semibold text-base pb-2 border-b border-muted">Leg {legNumber}</h4>

      {/* Buy/Sell */}
      <div className="space-y-2">
        <Label className="font-medium text-sm text-foreground">Operação</Label>
        <RadioGroup value={leg.side} onValueChange={(value: any) => onUpdate({ side: value })}>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="buy" id={`buy-${tradeId}-${legNumber}`} />
              <Label htmlFor={`buy-${tradeId}-${legNumber}`} className="cursor-pointer">Buy</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sell" id={`sell-${tradeId}-${legNumber}`} />
              <Label htmlFor={`sell-${tradeId}-${legNumber}`} className="cursor-pointer">Sell</Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Price Type */}
      <div className="space-y-2">
        <Label htmlFor={`priceType-${tradeId}-${legNumber}`} className="font-medium text-sm text-foreground">Price Type</Label>
        <Select
          value={leg.priceType}
          onValueChange={(value: any) => onUpdate({ priceType: value })}
        >
          <SelectTrigger id={`priceType-${tradeId}-${legNumber}`} className="border-slate-300 bg-white">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AVG">AVG</SelectItem>
            <SelectItem value="AVGInter">AVG Period</SelectItem>
            <SelectItem value="Fix">Fix</SelectItem>
            <SelectItem value="C2R">C2R (Cash)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* AVG Fields */}
      {showAvgFields && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-md border">
          <div className="space-y-2">
            <Label htmlFor={`month-${tradeId}-${legNumber}`} className="text-sm text-foreground">Mês</Label>
            <Select
              value={leg.month}
              onValueChange={(value) => onUpdate({ month: value })}
            >
              <SelectTrigger id={`month-${tradeId}-${legNumber}`} className="border-slate-300 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`year-${tradeId}-${legNumber}`} className="text-sm text-foreground">Ano</Label>
            <Select
              value={leg.year}
              onValueChange={(value) => onUpdate({ year: value })}
            >
              <SelectTrigger id={`year-${tradeId}-${legNumber}`} className="border-slate-300 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getCurrentYears().map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* AVG Period Fields */}
      {showAvgInterFields && (
        <div className="space-y-3 p-3 bg-muted/40 rounded-md border">
          <div className="space-y-2">
            <Label htmlFor={`startDate-${tradeId}-${legNumber}`} className="text-sm text-foreground">Start Date</Label>
            <Input
              id={`startDate-${tradeId}-${legNumber}`}
              type="date"
              value={leg.startDate}
              onChange={(e) => onUpdate({ startDate: e.target.value })}
              className="border-slate-300 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`endDate-${tradeId}-${legNumber}`} className="text-sm text-foreground">End Date</Label>
            <Input
              id={`endDate-${tradeId}-${legNumber}`}
              type="date"
              value={leg.endDate}
              onChange={(e) => onUpdate({ endDate: e.target.value })}
              className="border-slate-300 bg-white"
            />
          </div>
        </div>
      )}

      {/* Fixing Date */}
      {showFixingDate && (
        <div className="space-y-2 p-3 bg-muted/40 rounded-md border">
          <Label htmlFor={`fixDate-${tradeId}-${legNumber}`} className="text-sm text-foreground">Fixing Date</Label>
          <Input
            id={`fixDate-${tradeId}-${legNumber}`}
            type="date"
            value={leg.fixingDate}
            onChange={(e) => onUpdate({ fixingDate: e.target.value })}
            className="border-slate-300 bg-white"
          />
        </div>
      )}

      {/* Order Fields */}
      {showOrderFields && (
        <div className="space-y-3 p-3 bg-muted/40 rounded-md border">
          <div className="space-y-2">
            <Label htmlFor={`orderType-${tradeId}-${legNumber}`} className="font-medium text-sm text-foreground">Order Type</Label>
            <Select
              value={leg.orderType}
              onValueChange={(value: RfqOrderType) => onUpdate({ orderType: value })}
            >
              <SelectTrigger id={`orderType-${tradeId}-${legNumber}`} className="border-slate-300 bg-white">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="At Market">At Market</SelectItem>
                <SelectItem value="Limit">Limit</SelectItem>
                <SelectItem value="Resting">Resting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {leg.orderType !== 'At Market' && (
            <div className="space-y-2">
              <Label htmlFor={`orderValidity-${tradeId}-${legNumber}`} className="text-sm text-foreground">Order Validity</Label>
              <Select
                value={leg.orderValidity}
                onValueChange={(value: any) => onUpdate({ orderValidity: value })}
              >
                <SelectTrigger id={`orderValidity-${tradeId}-${legNumber}`} className="border-slate-300 bg-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Day">Day</SelectItem>
                  <SelectItem value="GTC">GTC</SelectItem>
                  <SelectItem value="3 Hours">3 Hours</SelectItem>
                  <SelectItem value="6 Hours">6 Hours</SelectItem>
                  <SelectItem value="12 Hours">12 Hours</SelectItem>
                  <SelectItem value="Until Further Notice">Until Further Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {leg.orderType === 'Limit' && (
            <div className="space-y-2">
              <Label htmlFor={`limitPrice-${tradeId}-${legNumber}`} className="text-sm text-foreground">Limit Price</Label>
              <Input
                id={`limitPrice-${tradeId}-${legNumber}`}
                type="number"
                step="0.01"
                value={leg.limitPrice || ''}
                onChange={(e) => onUpdate({ limitPrice: parseFloat(e.target.value) || 0 })}
                className="border-slate-300 bg-white"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
