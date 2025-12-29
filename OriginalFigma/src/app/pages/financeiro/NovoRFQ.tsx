import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, Send, Mail, X, ChevronDown } from 'lucide-react';
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
import { Separator } from '../../components/ui/separator';
import * as Dialog from '@radix-ui/react-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

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
  priceType: '' | 'AVG' | 'AVGInter' | 'Fix' | 'C2R';
  month: string;
  year: string;
  startDate: string;
  endDate: string;
  fixingDate: string;
  orderType: '' | 'At Market' | 'Limit' | 'Resting';
  orderValidity: '' | 'Day' | 'GTC' | '3 Hours' | '6 Hours' | '12 Hours' | 'Until Further Notice';
  limitPrice: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getCurrentYears = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 10 }, (_, i) => (currentYear + i).toString());
};

export const NovoRFQ = () => {
  const [company, setCompany] = useState<'Alcast Brasil' | 'Alcast Trading'>('Alcast Brasil');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [finalOutput, setFinalOutput] = useState('');

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

  const generateTradeOutput = (trade: Trade): string => {
    if (!trade.quantity || trade.quantity <= 0) {
      return '';
    }

    const lines: string[] = [];
    
    // Linha 1: Tipo de trade e quantidade
    lines.push(`${trade.tradeType} ${trade.quantity}mt`);

    // Leg 1
    const leg1Text = formatLeg(trade.leg1, 1);
    if (leg1Text) lines.push(leg1Text);

    // Leg 2
    const leg2Text = formatLeg(trade.leg2, 2);
    if (leg2Text) lines.push(leg2Text);

    // Execution Instructions
    const execInst1 = formatExecutionInstruction(trade.leg1);
    if (execInst1) lines.push(`Execution Instruction Leg 1: ${execInst1}`);

    const execInst2 = formatExecutionInstruction(trade.leg2);
    if (execInst2) lines.push(`Execution Instruction Leg 2: ${execInst2}`);

    return lines.join('\n');
  };

  const formatLeg = (leg: TradeLeg, legNum: number): string => {
    if (!leg.priceType) return '';

    const parts: string[] = [];
    const side = leg.side.charAt(0).toUpperCase() + leg.side.slice(1);
    
    parts.push(`Leg ${legNum}:`);
    parts.push(side);

    if (leg.priceType === 'AVG') {
      parts.push(`${leg.month} ${leg.year} AVG`);
    } else if (leg.priceType === 'AVGInter') {
      if (leg.startDate && leg.endDate) {
        parts.push(`AVG from ${formatDate(leg.startDate)} to ${formatDate(leg.endDate)}`);
      }
    } else if (leg.priceType === 'Fix') {
      if (leg.fixingDate) {
        parts.push(`Fix ${formatDate(leg.fixingDate)}`);
      }
    } else if (leg.priceType === 'C2R') {
      parts.push('C2R (Cash)');
      if (leg.fixingDate) {
        parts.push(`Fix ${formatDate(leg.fixingDate)}`);
      }
    }

    return parts.join(' ');
  };

  const formatExecutionInstruction = (leg: TradeLeg): string => {
    if (!leg.priceType || leg.priceType === 'AVG' || leg.priceType === 'AVGInter') {
      return '';
    }

    const parts: string[] = [];

    if (leg.orderType === 'At Market') {
      parts.push('At Market');
    } else if (leg.orderType === 'Limit' && leg.limitPrice > 0) {
      parts.push(`Limit ${leg.limitPrice}`);
    } else if (leg.orderType === 'Resting') {
      parts.push('Resting');
    }

    if (leg.orderValidity) {
      parts.push(leg.orderValidity);
    }

    return parts.join(', ');
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const generateFinalOutput = () => {
    const header = `For ${company} Account:\n\n`;
    const tradesText = trades
      .map(trade => generateTradeOutput(trade))
      .filter(text => text.length > 0)
      .join('\n\n');
    
    setFinalOutput(header + tradesText);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalOutput);
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(finalOutput)}`;
    window.open(url, '_blank');
  };

  const sendEmail = () => {
    const subject = `RFQ - ${company}`;
    const body = encodeURIComponent(finalOutput);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-sky-900">Novo RFQ - Request for Quotation</h2>
          <p className="text-muted-foreground">Gerador de cotações LME (London Metal Exchange)</p>
        </div>
      </div>

      {/* Company Selection */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm">
        <Label className="mb-3 block font-semibold text-sky-900">Empresa</Label>
        <RadioGroup value={company} onValueChange={(value: any) => setCompany(value)}>
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Alcast Brasil" id="brasil" />
              <Label htmlFor="brasil" className="cursor-pointer">Alcast Brasil</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Alcast Trading" id="trading" />
              <Label htmlFor="trading" className="cursor-pointer">Alcast Trading</Label>
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
      <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="text-sky-900">Output - Trade Request Preview</h3>
          <Button onClick={generateFinalOutput} variant="default" className="bg-sky-900 hover:bg-sky-800">
            Gerar Output
          </Button>
        </div>

        <Textarea
          value={finalOutput}
          readOnly
          placeholder="O texto gerado aparecerá aqui..."
          className="min-h-[200px] font-mono text-sm bg-slate-50 border-slate-300"
        />

        <div className="flex flex-wrap gap-3">
          <Button onClick={addTrade} variant="outline" className="border-sky-900 text-sky-900 hover:bg-sky-50">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Trade
          </Button>
          <Button onClick={copyToClipboard} variant="outline" disabled={!finalOutput} className="border-slate-300 hover:bg-slate-50">
            <Copy className="w-4 h-4 mr-2" />
            Copiar Tudo
          </Button>
          <Button onClick={shareWhatsApp} variant="outline" disabled={!finalOutput} className="border-slate-300 hover:bg-slate-50">
            <Send className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button onClick={sendEmail} variant="outline" disabled={!finalOutput} className="border-slate-300 hover:bg-slate-50">
            <Mail className="w-4 h-4 mr-2" />
            E-mail
          </Button>
        </div>
      </Card>
    </div>
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
    <Card className="p-6 space-y-6 bg-white border-slate-200 shadow-md">
      {/* Trade Header */}
      <div className="flex justify-between items-center pb-4 border-b-2 border-sky-100">
        <h3 className="text-sky-900 font-semibold">Trade {tradeNumber}</h3>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-sky-700 text-sky-700 hover:bg-sky-50">
                Templates <ChevronDown className="w-4 h-4 ml-1" />
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
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Trade Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-sky-50/50 p-4 rounded-lg border border-sky-100">
        <div className="space-y-2">
          <Label htmlFor={`qty-${trade.id}`} className="text-sky-900 font-medium">Quantidade (mt)</Label>
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
          <Label htmlFor={`type-${trade.id}`} className="text-sky-900 font-medium">Trade Type</Label>
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
            <Label htmlFor={`sync-${trade.id}`} className="cursor-pointer font-medium">Sync PPT</Label>
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
    <div className="space-y-4 p-5 border-2 border-slate-200 rounded-lg bg-gradient-to-br from-slate-50 to-white shadow-sm">
      <h4 className="text-sky-900 font-semibold text-lg pb-2 border-b border-slate-200">Leg {legNumber}</h4>

      {/* Buy/Sell */}
      <div className="space-y-2">
        <Label className="font-medium text-slate-700">Operação</Label>
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
        <Label htmlFor={`priceType-${tradeId}-${legNumber}`} className="font-medium text-slate-700">Price Type</Label>
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
        <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 rounded-md border border-blue-100">
          <div className="space-y-2">
            <Label htmlFor={`month-${tradeId}-${legNumber}`} className="text-slate-700">Mês</Label>
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
            <Label htmlFor={`year-${tradeId}-${legNumber}`} className="text-slate-700">Ano</Label>
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
        <div className="space-y-3 p-3 bg-blue-50 rounded-md border border-blue-100">
          <div className="space-y-2">
            <Label htmlFor={`startDate-${tradeId}-${legNumber}`} className="text-slate-700">Start Date</Label>
            <Input
              id={`startDate-${tradeId}-${legNumber}`}
              type="date"
              value={leg.startDate}
              onChange={(e) => onUpdate({ startDate: e.target.value })}
              className="border-slate-300 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`endDate-${tradeId}-${legNumber}`} className="text-slate-700">End Date</Label>
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
        <div className="space-y-2 p-3 bg-amber-50 rounded-md border border-amber-100">
          <Label htmlFor={`fixDate-${tradeId}-${legNumber}`} className="text-slate-700">Fixing Date</Label>
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
        <div className="space-y-3 p-3 bg-emerald-50 rounded-md border border-emerald-100">
          <div className="space-y-2">
            <Label htmlFor={`orderType-${tradeId}-${legNumber}`} className="text-slate-700 font-medium">Order Type</Label>
            <Select
              value={leg.orderType}
              onValueChange={(value: any) => onUpdate({ orderType: value })}
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

          {leg.orderType !== 'At Market' && leg.orderType !== '' && (
            <div className="space-y-2">
              <Label htmlFor={`orderValidity-${tradeId}-${legNumber}`} className="text-slate-700">Order Validity</Label>
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
              <Label htmlFor={`limitPrice-${tradeId}-${legNumber}`} className="text-slate-700">Limit Price</Label>
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