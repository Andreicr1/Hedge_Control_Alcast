import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PO {
  id: string;
  fornecedor: string;
  produto: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
  status: 'draft' | 'pendente_financeiro' | 'aprovado' | 'rejeitado';
  dataEmissao: string;
  dataEntregaPrevista: string;
  localizacao: string;
  custoMedio: number;
}

export interface SO {
  id: string;
  cliente: string;
  produto: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
  status: 'draft' | 'pendente_financeiro' | 'aprovado' | 'rejeitado';
  dataEmissao: string;
  dataEntregaPrevista: string;
}

export interface RFQ {
  id: string;
  produto: string;
  quantidade: number;
  contrapartes: string[];
  status: 'criado' | 'enviado' | 'recebido' | 'fechado';
  dataCriacao: string;
  quotes: Quote[];
  vencedora?: string;
}

export interface Quote {
  id: string;
  rfqId: string;
  contraparte: string;
  preco: number;
  data: string;
}

export interface Contraparte {
  id: string;
  nome: string;
  tipo: 'banco' | 'corretora';
  cnpj: string;
  contatoPrincipal: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  limite: number;
  canais: string[];
  status: 'ativo' | 'inativo';
  observacoes?: string;
  dataCadastro: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual?: string;
  contatoPrincipal: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  produtos: string[];
  limiteCredito: number;
  status: 'ativo' | 'inativo' | 'bloqueado';
  kycStatus: 'pendente' | 'aprovado' | 'reprovado' | 'verificando';
  kycData?: {
    verificadoEm?: string;
    resultado?: string;
    observacoes?: string;
  };
  observacoes?: string;
  dataCadastro: string;
}

export interface LoteEstoque {
  id: string;
  codigo: string;
  produto: string;
  disponivel: number;
  comprometido: number;
  custoMedio: number;
  mtm: number;
  dataChegada: string;
  localizacao: string;
}

interface DataContextType {
  pos: PO[];
  sos: SO[];
  rfqs: RFQ[];
  contrapartes: Contraparte[];
  fornecedores: Fornecedor[];
  estoque: LoteEstoque[];
  addPO: (po: Omit<PO, 'id'>) => void;
  updatePO: (id: string, po: Partial<PO>) => void;
  addSO: (so: Omit<SO, 'id'>) => void;
  updateSO: (id: string, so: Partial<SO>) => void;
  addRFQ: (rfq: Omit<RFQ, 'id'>) => void;
  updateRFQ: (id: string, rfq: Partial<RFQ>) => void;
  addContraparte: (contraparte: Omit<Contraparte, 'id'>) => void;
  addFornecedor: (fornecedor: Omit<Fornecedor, 'id'>) => void;
  updateFornecedor: (id: string, fornecedor: Partial<Fornecedor>) => void;
  updateEstoque: (id: string, lote: Partial<LoteEstoque>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [pos, setPOs] = useState<PO[]>([
    {
      id: 'PO001',
      fornecedor: 'Alcoa Brasil',
      produto: 'Alumínio',
      quantidade: 2500,
      precoUnitario: 2450,
      total: 6125000,
      status: 'pendente_financeiro',
      dataEmissao: '2025-01-15',
      dataEntregaPrevista: '2025-03-10',
      localizacao: 'Santos/SP',
      custoMedio: 2450,
    },
    {
      id: 'PO002',
      fornecedor: 'Hydro Alumínio',
      produto: 'Alumínio',
      quantidade: 1200,
      precoUnitario: 2380,
      total: 2856000,
      status: 'aprovado',
      dataEmissao: '2025-01-10',
      dataEntregaPrevista: '2025-02-25',
      localizacao: 'Paranaguá/PR',
      custoMedio: 2380,
    },
  ]);

  const [sos, setSOss] = useState<SO[]>([
    {
      id: 'SO001',
      cliente: 'Novelis do Brasil',
      produto: 'Alumínio',
      quantidade: 1800,
      precoUnitario: 2620,
      total: 4716000,
      status: 'pendente_financeiro',
      dataEmissao: '2025-01-16',
      dataEntregaPrevista: '2025-03-15',
    },
    {
      id: 'SO002',
      cliente: 'Embraer S.A.',
      produto: 'Alumínio',
      quantidade: 850,
      precoUnitario: 2580,
      total: 2193000,
      status: 'aprovado',
      dataEmissao: '2025-01-12',
      dataEntregaPrevista: '2025-02-28',
    },
  ]);

  const [rfqs, setRFQs] = useState<RFQ[]>([
    {
      id: 'RFQ001',
      produto: 'Alumínio - Futuro MAR/25',
      quantidade: 3500,
      contrapartes: ['Banco Itaú BBA', 'XP Investimentos'],
      status: 'recebido',
      dataCriacao: '2025-01-20',
      quotes: [
        { id: 'Q001', rfqId: 'RFQ001', contraparte: 'Banco Itaú BBA', preco: 2435, data: '2025-01-21' },
        { id: 'Q002', rfqId: 'RFQ001', contraparte: 'XP Investimentos', preco: 2428, data: '2025-01-21' },
      ],
    },
  ]);

  const [contrapartes, setContrapartes] = useState<Contraparte[]>([
    { 
      id: 'C001', 
      nome: 'Banco Itaú BBA', 
      tipo: 'banco', 
      cnpj: '17.298.092/0001-30',
      contatoPrincipal: 'João Silva',
      email: 'commodities@itaubba.com',
      telefone: '(11) 3708-8000',
      endereco: 'Av. Brigadeiro Faria Lima, 3400',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '04538-132',
      limite: 100000000, 
      canais: ['Email', 'Bloomberg', 'Telefone'], 
      status: 'ativo',
      observacoes: 'Principal parceiro para hedge de alumínio',
      dataCadastro: '2024-01-15',
    },
    { 
      id: 'C002', 
      nome: 'XP Investimentos', 
      tipo: 'corretora', 
      cnpj: '02.332.886/0001-04',
      contatoPrincipal: 'Maria Santos',
      email: 'derivativos@xpi.com.br',
      telefone: '(11) 3003-5465',
      endereco: 'Av. Presidente Juscelino Kubitschek, 1909',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '04543-907',
      limite: 75000000, 
      canais: ['Email', 'WhatsApp', 'Telefone'], 
      status: 'ativo',
      observacoes: 'Boa execução em contratos futuros',
      dataCadastro: '2024-02-20',
    },
    { 
      id: 'C003', 
      nome: 'Bradesco S.A.', 
      tipo: 'banco', 
      cnpj: '60.746.948/0001-12',
      contatoPrincipal: 'Carlos Costa',
      email: 'corporate@bradesco.com.br',
      telefone: '(11) 2178-0000',
      endereco: 'Av. Paulista, 1450',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-917',
      limite: 120000000, 
      canais: ['Email', 'Bloomberg'], 
      status: 'ativo',
      dataCadastro: '2023-11-10',
    },
  ]);

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([
    {
      id: 'F001',
      nome: 'Alcoa Brasil',
      razaoSocial: 'Alcoa Alumínio S.A.',
      cnpj: '33.196.975/0001-39',
      inscricaoEstadual: '645.141.741.116',
      contatoPrincipal: 'Roberto Andrade',
      email: 'vendas@alcoa.com.br',
      telefone: '(11) 3156-5000',
      endereco: 'Av. das Nações Unidas, 12.551',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '04578-903',
      produtos: ['Alumínio'],
      limiteCredito: 50000000,
      status: 'ativo',
      kycStatus: 'aprovado',
      kycData: {
        verificadoEm: '2024-11-15',
        resultado: 'Aprovado',
        observacoes: 'Maior produtora de alumínio do Brasil',
      },
      observacoes: 'Parceiro estratégico - volumes consistentes',
      dataCadastro: '2023-06-10',
    },
    {
      id: 'F002',
      nome: 'Hydro Alumínio',
      razaoSocial: 'Norsk Hydro Brasil Ltda.',
      cnpj: '33.868.679/0001-47',
      inscricaoEstadual: '082.670.583.114',
      contatoPrincipal: 'Patricia Moreira',
      email: 'comercial@hydro.com.br',
      telefone: '(41) 3319-8000',
      endereco: 'Rodovia PR-408, km 25',
      cidade: 'Curitiba',
      estado: 'PR',
      cep: '83820-000',
      produtos: ['Alumínio'],
      limiteCredito: 40000000,
      status: 'ativo',
      kycStatus: 'aprovado',
      kycData: {
        verificadoEm: '2024-10-20',
        resultado: 'Aprovado',
        observacoes: 'Fornecedor internacional confiável',
      },
      observacoes: 'Excelente qualidade - prazo respeitado',
      dataCadastro: '2023-08-22',
    },
    {
      id: 'F003',
      nome: 'CBA - Companhia Brasileira de Alumínio',
      razaoSocial: 'Companhia Brasileira de Alumínio',
      cnpj: '60.889.466/0001-91',
      inscricaoEstadual: '645.141.200.113',
      contatoPrincipal: 'Marcos Ferreira',
      email: 'vendas@cba.com.br',
      telefone: '(11) 3049-6000',
      endereco: 'Av. Paulista, 2300',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-300',
      produtos: ['Alumínio'],
      limiteCredito: 35000000,
      status: 'ativo',
      kycStatus: 'aprovado',
      kycData: {
        verificadoEm: '2024-09-05',
        resultado: 'Aprovado',
        observacoes: 'Grupo Votorantim',
      },
      observacoes: 'Boa relação custo-benefício',
      dataCadastro: '2023-07-15',
    },
  ]);

  const [estoque, setEstoque] = useState<LoteEstoque[]>([
    {
      id: 'L001',
      codigo: 'LOT-AL-2025-001',
      produto: 'Alumínio',
      disponivel: 2800,
      comprometido: 1800,
      custoMedio: 2420,
      mtm: 2465,
      dataChegada: '2025-01-08',
      localizacao: 'Santos/SP',
    },
    {
      id: 'L002',
      codigo: 'LOT-AL-2025-002',
      produto: 'Alumínio',
      disponivel: 1650,
      comprometido: 850,
      custoMedio: 2380,
      mtm: 2465,
      dataChegada: '2025-01-18',
      localizacao: 'Paranaguá/PR',
    },
    {
      id: 'L003',
      codigo: 'LOT-AL-2024-018',
      produto: 'Alumínio',
      disponivel: 920,
      comprometido: 0,
      custoMedio: 2295,
      mtm: 2465,
      dataChegada: '2024-12-20',
      localizacao: 'Santos/SP',
    },
  ]);

  const addPO = (po: Omit<PO, 'id'>) => {
    const newPO = { ...po, id: `PO${String(pos.length + 1).padStart(3, '0')}` };
    setPOs([...pos, newPO]);
  };

  const updatePO = (id: string, updates: Partial<PO>) => {
    setPOs(pos.map(po => (po.id === id ? { ...po, ...updates } : po)));
  };

  const addSO = (so: Omit<SO, 'id'>) => {
    const newSO = { ...so, id: `SO${String(sos.length + 1).padStart(3, '0')}` };
    setSOss([...sos, newSO]);
  };

  const updateSO = (id: string, updates: Partial<SO>) => {
    setSOss(sos.map(so => (so.id === id ? { ...so, ...updates } : so)));
  };

  const addRFQ = (rfq: Omit<RFQ, 'id'>) => {
    const newRFQ = { ...rfq, id: `RFQ${String(rfqs.length + 1).padStart(3, '0')}`, quotes: [] };
    setRFQs([...rfqs, newRFQ]);
  };

  const updateRFQ = (id: string, updates: Partial<RFQ>) => {
    setRFQs(rfqs.map(rfq => (rfq.id === id ? { ...rfq, ...updates } : rfq)));
  };

  const addContraparte = (contraparte: Omit<Contraparte, 'id'>) => {
    const newContraparte = { ...contraparte, id: `C${String(contrapartes.length + 1).padStart(3, '0')}` };
    setContrapartes([...contrapartes, newContraparte]);
  };

  const addFornecedor = (fornecedor: Omit<Fornecedor, 'id'>) => {
    const newFornecedor = { ...fornecedor, id: `F${String(fornecedores.length + 1).padStart(3, '0')}` };
    setFornecedores([...fornecedores, newFornecedor]);
  };

  const updateFornecedor = (id: string, updates: Partial<Fornecedor>) => {
    setFornecedores(fornecedores.map(fornecedor => (fornecedor.id === id ? { ...fornecedor, ...updates } : fornecedor)));
  };

  const updateEstoque = (id: string, updates: Partial<LoteEstoque>) => {
    setEstoque(estoque.map(lote => (lote.id === id ? { ...lote, ...updates } : lote)));
  };

  return (
    <DataContext.Provider
      value={{
        pos,
        sos,
        rfqs,
        contrapartes,
        fornecedores,
        estoque,
        addPO,
        updatePO,
        addSO,
        updateSO,
        addRFQ,
        updateRFQ,
        addContraparte,
        addFornecedor,
        updateFornecedor,
        updateEstoque,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};