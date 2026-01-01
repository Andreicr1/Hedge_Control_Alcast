#!/usr/bin/env python3
"""
Script COMPLETO - Refatora TODOS os arquivos do frontend
Inclui: Compras, Vendas, Financeiro, e páginas raiz
"""

import anthropic
import os
import subprocess
from pathlib import Path

API_KEY = os.environ.get("ANTHROPIC_API_KEY")
client = anthropic.Anthropic(api_key=API_KEY)

PROJECT_ROOT = Path(r"D:\Hedge_Control_Alcast")
PAGES_DIR = PROJECT_ROOT / "src" / "app" / "pages"

class FrontendRefactor:
    def __init__(self):
        self.client = client
    
    def read_file(self, filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    
    def write_file(self, filepath, content):
        backup = filepath.with_suffix('.tsx.backup')
        if filepath.exists():
            with open(backup, 'w', encoding='utf-8') as f:
                f.write(self.read_file(filepath))
            print(f"📦 Backup: {backup.name}")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Salvo: {filepath.name}")
    
    def refactor_file(self, filepath, instructions):
        print(f"\n{'='*60}")
        print(f"🔄 Refatorando: {filepath.relative_to(PAGES_DIR)}")
        print(f"{'='*60}")
        
        original = self.read_file(filepath)
        
        prompt = f"""Você é um expert React/TypeScript developer.

TAREFA: Refatore este componente mantendo 100% da lógica, apenas melhorando UI/UX.

CÓDIGO ORIGINAL:
```tsx
{original}
```

INSTRUÇÕES ESPECÍFICAS:
{instructions}

REGRAS CRÍTICAS - NÃO MUDE:
1. Mantenha TODAS as importações existentes
2. Mantenha TODOS os hooks (useState, useEffect, useData, useMemo, etc)
3. Mantenha TODAS as chamadas de API (services)
4. Mantenha TODA a lógica de negócio
5. Mantenha TODOS os cálculos e funções
6. Mantenha navegação (useNavigate, navigate)

APENAS MELHORE:
- Substitua HTML puro (<div>, <table>, <input>, <select>) por componentes shadcn/ui
- Use <Card>, <Table>, <Button>, <Input>, <Select>, <Label>, <Badge>, <Alert>
- Adicione ícones do lucide-react onde fizer sentido
- Melhore loading states (spinner bonito)
- Melhore empty states (mensagem + ícone)
- Use cores semânticas (verde para positivo, vermelho para negativo)
- Adicione <Separator> entre seções
- Use <Tabs> se houver múltiplas seções

COMPONENTES DISPONÍVEIS (já instalados):
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Table, TableHeader, TableHead, TableRow, TableBody, TableCell
- Button, Input, Label, Textarea
- Select, SelectTrigger, SelectValue, SelectContent, SelectItem
- Badge, Alert, AlertDescription
- Separator, Tabs, TabsList, TabsTrigger, TabsContent
- Dialog (Radix UI já está instalado)

ÍCONES (lucide-react):
- Plus, Edit, Trash, Eye, Send, Download, Upload
- TrendingUp, TrendingDown, DollarSign, Calendar
- RefreshCw, AlertCircle, CheckCircle, X
- Building2, Users, FileText, Inbox, BarChart3

IMPORTANTE:
- Imports relativos: '../../components/ui/card' ou '../../../components/ui/card'
- Retorne APENAS código TSX válido
- SEM markdown (```tsx), SEM explicações
- Código deve estar pronto para salvar direto no arquivo
- Mantenha encoding UTF-8 (não use caracteres especiais em comentários)
"""

        print("⏳ Chamando Claude API...")
        
        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        code = message.content[0].text.strip()
        
        # Remover markdown se presente
        if code.startswith("```"):
            lines = code.split('\n')
            # Remove primeira linha (```tsx) e última (```)
            code = '\n'.join(lines[1:-1])
        
        return code
    
    def refactor_all(self):
        print("🚀 REFATORAÇÃO COMPLETA - Todos os Arquivos")
        print("=" * 60)
        
        if not API_KEY:
            print("❌ Configure: export ANTHROPIC_API_KEY='sk-ant-...'")
            return
        
        # TODOS OS ARQUIVOS COM INSTRUÇÕES ESPECÍFICAS
        files = [
            # ==================== FINANCEIRO ====================
            {
                "path": PAGES_DIR / "financeiro" / "MTM.tsx",
                "instructions": """
                - Adicione 4 Cards de métricas no topo: MTM Total, Snapshots, Hedges Positivos, Hedges Negativos
                - Use Tabs para organizar: Exposição, Histórico MTM, Hedges, Registrar MTM, Preços de Mercado
                - Substitua TODAS as <table> por <Table> shadcn
                - Substitua TODOS os <select> por <Select> shadcn
                - Substitua TODOS os <input> por <Input> shadcn com <Label>
                - Adicione ícones: DollarSign, TrendingUp, TrendingDown, RefreshCw, Calendar
                - Loading state bonito (spinner)
                - Empty states profissionais
                - Use Badge para status de hedges
                - Cores verde/vermelho para MTM positivo/negativo
                """
            },
            {
                "path": PAGES_DIR / "financeiro" / "Inbox.tsx",
                "instructions": """
                - Use Cards para cada tarefa/exposição
                - Adicione ícones TrendingUp (exposição ativa) e TrendingDown (exposição passiva)
                - Use Badge para status
                - Melhore Dialog com componentes shadcn
                - Empty state bonito quando não houver tarefas: ícone CheckCircle + mensagem
                - Cards com hover effect
                - Botão "Detalhar" mais visível
                """
            },
            {
                "path": PAGES_DIR / "financeiro" / "NetExposure.tsx",
                "instructions": """
                - Cards de métricas: Exposição Líquida, Hedge Aplicado, Exp. Ativa, Exp. Passiva
                - <Table> shadcn em vez de HTML
                - Cores verde/vermelho para net exposure (positivo = risco, vermelho)
                - Loading state bonito
                - Empty state profissional
                - Ícones: BarChart3, TrendingUp, TrendingDown
                """
            },
            {
                "path": PAGES_DIR / "financeiro" / "RFQs.tsx",
                "instructions": """
                - <Table> shadcn
                - Badge para status de RFQ (open, awarded, failed)
                - Botão "Novo RFQ" destacado com ícone Plus
                - Ranking de cotações mais visual (badges para trades)
                - Loading e empty states bonitos
                - Ícone Send no botão Detalhar
                """
            },
            {
                "path": PAGES_DIR / "financeiro" / "RFQDetalhe.tsx",
                "instructions": """
                - Cards de métricas: Melhor Preço, Preço Médio, Respostas Recebidas
                - <Table> shadcn para ranking de cotações
                - Badge para tier de contrapartes
                - Badge para status de convites
                - Destaque visual para melhor cotação (background verde claro)
                - Botão "Selecionar" mais visível
                - Dialog shadcn para decisão final
                - Ícones: CheckCircle, TrendingUp, MessageSquare, Clock
                """
            },
            {
                "path": PAGES_DIR / "financeiro" / "NovoRFQ.tsx",
                "instructions": """
                - Formulário com <Label> para cada campo
                - <Select> shadcn em vez de HTML
                - <Input> shadcn
                - <Textarea> shadcn para notas
                - Botão submit destacado
                - Loading state no botão (disabled + spinner)
                - Alert para erros
                - Separadores entre seções
                """
            },
            {
                "path": PAGES_DIR / "financeiro" / "Contrapartes.tsx",
                "instructions": """
                - <Table> shadcn
                - Botões Edit e Delete com ícones
                - Botão "Nova Contraparte" destacado
                - Badge para tier
                - Dialog para edição/criação
                - Loading e empty states
                - Ícones: Building2, Edit, Trash, Plus
                """
            },
            {
                "path": PAGES_DIR / "financeiro" / "Relatorios.tsx",
                "instructions": """
                - Cards para diferentes tipos de relatórios
                - Botões de download com ícone Download
                - Botões de geração com ícone FileText
                - Loading states
                - <Select> para filtros
                - Ícones: FileText, Download, Calendar, BarChart3
                """
            },
            
            # ==================== COMPRAS ====================
            {
                "path": PAGES_DIR / "compras" / "POs.tsx",
                "instructions": """
                - <Table> shadcn
                - Badge para status de PO
                - Botão "Novo PO" destacado com ícone Plus
                - Filtros com <Select> shadcn
                - Loading e empty states bonitos
                - Botões de ação: Eye (ver), Edit (editar)
                - Cores para pricing_type
                """
            },
            {
                "path": PAGES_DIR / "compras" / "Fornecedores.tsx",
                "instructions": """
                - <Table> shadcn
                - Badge para status
                - Botão "Novo Fornecedor" com ícone Plus
                - Dialog para edição/criação
                - Ícones: Building2, Edit, Trash, Plus
                - Loading e empty states
                """
            },
            
            # ==================== VENDAS ====================
            {
                "path": PAGES_DIR / "vendas" / "SOs.tsx",
                "instructions": """
                - <Table> shadcn
                - Badge para status de SO
                - Botão "Novo SO" destacado com ícone Plus
                - Filtros com <Select> shadcn
                - Loading e empty states bonitos
                - Botões de ação: Eye (ver), Edit (editar)
                - Cores para pricing_type
                """
            },
            {
                "path": PAGES_DIR / "vendas" / "Clientes.tsx",
                "instructions": """
                - <Table> shadcn
                - Badge para status
                - Botão "Novo Cliente" com ícone Plus
                - Dialog para edição/criação
                - Ícones: Users, Edit, Trash, Plus
                - Loading e empty states
                """
            },
            
            # ==================== RAIZ ====================
            {
                "path": PAGES_DIR / "Estoque.tsx",
                "instructions": """
                - <Table> shadcn se houver tabela
                - Cards para resumo de estoque
                - Badge para status
                - Ícones: BarChart3, TrendingUp, AlertCircle
                - Loading e empty states
                """
            },
        ]
        
        results = {"success": [], "failed": [], "skipped": []}
        
        for config in files:
            filepath = config["path"]
            
            if not filepath.exists():
                print(f"⚠️  Não encontrado: {filepath.relative_to(PAGES_DIR)}")
                results["skipped"].append(str(filepath.relative_to(PAGES_DIR)))
                continue
            
            try:
                refactored = self.refactor_file(filepath, config["instructions"])
                self.write_file(filepath, refactored)
                results["success"].append(str(filepath.relative_to(PAGES_DIR)))
                print(f"✅ {filepath.name} refatorado!")
                
            except Exception as e:
                print(f"❌ Erro: {e}")
                results["failed"].append(str(filepath.relative_to(PAGES_DIR)))
        
        # Resumo
        print("\n" + "=" * 60)
        print("📊 RESUMO FINAL")
        print("=" * 60)
        
        if results['success']:
            print(f"\n✅ SUCESSO ({len(results['success'])} arquivos):")
            for f in results['success']:
                print(f"   ✓ {f}")
        
        if results['skipped']:
            print(f"\n⚠️  IGNORADOS ({len(results['skipped'])} arquivos):")
            for f in results['skipped']:
                print(f"   - {f}")
        
        if results['failed']:
            print(f"\n❌ FALHAS ({len(results['failed'])} arquivos):")
            for f in results['failed']:
                print(f"   ✗ {f}")
        
        total_cost = len(results['success']) * 0.08
        print(f"\n💰 Custo estimado: ${total_cost:.2f}")
        
        print("\n" + "=" * 60)
        print("🎉 REFATORAÇÃO COMPLETA!")
        print("=" * 60)
        print("\nPróximos passos:")
        print("1. cd D:\\Hedge_Control_Alcast")
        print("2. npm run dev")
        print("3. Teste cada página refatorada")
        print("\n⚠️  Se algo der errado, restaure do backup:")
        print("   Copy-Item *.backup -Destination (sem .backup)")

def main():
    refactor = FrontendRefactor()
    refactor.refactor_all()

if __name__ == "__main__":
    main()
