#!/usr/bin/env python3
"""
Alcast Frontend Refactor - Profissional
Refatora TODOS os arquivos do frontend usando Anthropic API
"""

import anthropic
import os
import sys
from pathlib import Path
from datetime import datetime

API_KEY = os.environ.get("ANTHROPIC_API_KEY")
client = anthropic.Anthropic(api_key=API_KEY)

PROJECT_ROOT = Path(r"D:\Hedge_Control_Alcast")
PAGES_DIR = PROJECT_ROOT / "src" / "app" / "pages"

class AlcastRefactor:
    def __init__(self):
        self.client = client
        self.results = {"success": [], "failed": [], "skipped": []}
    
    def read_file(self, filepath):
        """Lê arquivo com encoding UTF-8"""
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    
    def write_file(self, filepath, content):
        """Escreve arquivo com backup automático"""
        backup_dir = filepath.parent / "backups"
        backup_dir.mkdir(exist_ok=True)
        
        if filepath.exists():
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = backup_dir / f"{filepath.stem}_{timestamp}.tsx.backup"
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(self.read_file(filepath))
            print(f"   📦 Backup: {backup_path.name}")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   ✅ Salvo: {filepath.name}")
    
    def refactor_file(self, filepath, instructions):
        """Refatora um arquivo usando Claude API"""
        print(f"\n{'='*70}")
        print(f"🔄 REFATORANDO: {filepath.relative_to(PAGES_DIR)}")
        print(f"{'='*70}")
        
        original = self.read_file(filepath)
        
        # System prompt usando o skill
        system_prompt = """You are an expert React/TypeScript developer specializing in frontend refactoring.

You have access to complete knowledge about the Alcast Hedge Control platform through the alcast-knowledge skill.

Your task is to refactor React components to use shadcn/ui professionally while maintaining 100% of existing logic."""

        # User prompt
        user_prompt = f"""Refactor this React component to use shadcn/ui professionally.

ORIGINAL CODE:
```tsx
{original}
```

SPECIFIC INSTRUCTIONS FOR THIS FILE:
{instructions}

CRITICAL RULES - NEVER CHANGE:
1. ALL imports from contexts (DataContextAPI, AuthContext)
2. ALL hooks (useState, useEffect, useData, useMemo, useNavigate, useParams)
3. ALL service calls (mtmSnapshotsService, rfqsService, etc)
4. ALL business logic functions
5. ALL calculations and data transformations
6. Navigation logic

ALWAYS CHANGE (UI ONLY):
1. <div> → <Card> with CardHeader/CardContent structure
2. <table> → <Table> with TableHeader/TableBody/TableRow/TableCell
3. <input> → <Input> with <Label>
4. <select> → <Select> with SelectTrigger/SelectValue/SelectContent/SelectItem
5. <button> → <Button>
6. Plain text status → <Badge>
7. Error messages → <Alert> with AlertDescription
8. Add loading states with proper skeletons
9. Add empty states with icons and helpful messages

IMPORT PATHS (use relative imports):
- From pages/financeiro/: '../../components/ui/card'
- From pages/compras/: '../../components/ui/card'
- From pages/vendas/: '../../components/ui/card'

AVAILABLE COMPONENTS (already installed):
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Table, TableHeader, TableHead, TableRow, TableBody, TableCell
- Button, Input, Label, Textarea
- Select, SelectTrigger, SelectValue, SelectContent, SelectItem
- Badge, Alert, AlertDescription, Separator
- Tabs, TabsList, TabsTrigger, TabsContent

ICONS (lucide-react):
- Plus, Edit, Trash, Eye, Send, Download, Upload
- TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw
- AlertCircle, CheckCircle, X, Building2, Users, FileText, Inbox

RESPONSE FORMAT:
Return ONLY the refactored TypeScript/TSX code.
NO markdown code blocks (```tsx).
NO explanations before or after.
Code must be ready to save directly to file.
Must compile without TypeScript errors.
"""

        print("   ⏳ Calling Claude API...")
        
        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8000,
                system=system_prompt,
                messages=[{
                    "role": "user",
                    "content": user_prompt
                }]
            )
            
            code = message.content[0].text.strip()
            
            # Remove markdown if present
            if code.startswith("```"):
                lines = code.split('\n')
                code = '\n'.join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
            
            # Show token usage
            usage = message.usage
            print(f"   💰 Tokens: Input={usage.input_tokens}, Output={usage.output_tokens}")
            
            return code
            
        except Exception as e:
            raise Exception(f"API Error: {str(e)}")
    
    def refactor_all(self, files_config):
        """Refatora todos os arquivos"""
        print("🚀 ALCAST FRONTEND REFACTOR - PROFISSIONAL")
        print("=" * 70)
        print(f"API: Anthropic Claude Sonnet 4")
        print(f"Project: {PROJECT_ROOT}")
        print(f"Files to refactor: {len(files_config)}")
        print("=" * 70)
        
        if not API_KEY:
            print("\n❌ ERRO: Configure ANTHROPIC_API_KEY")
            print("   PowerShell: $env:ANTHROPIC_API_KEY = 'sk-ant-...'")
            return
        
        for i, config in enumerate(files_config, 1):
            filepath = config["path"]
            
            print(f"\n[{i}/{len(files_config)}] {filepath.relative_to(PAGES_DIR)}")
            
            if not filepath.exists():
                print(f"   ⚠️  Arquivo não encontrado")
                self.results["skipped"].append(str(filepath.relative_to(PAGES_DIR)))
                continue
            
            try:
                refactored = self.refactor_file(filepath, config["instructions"])
                self.write_file(filepath, refactored)
                self.results["success"].append(str(filepath.relative_to(PAGES_DIR)))
                print(f"   ✅ SUCESSO!")
                
            except Exception as e:
                print(f"   ❌ ERRO: {e}")
                self.results["failed"].append(str(filepath.relative_to(PAGES_DIR)))
                continue
        
        self.print_summary()
    
    def print_summary(self):
        """Imprime resumo final"""
        print("\n" + "=" * 70)
        print("📊 RESUMO FINAL")
        print("=" * 70)
        
        if self.results['success']:
            print(f"\n✅ SUCESSO ({len(self.results['success'])} arquivos):")
            for f in self.results['success']:
                print(f"   ✓ {f}")
        
        if self.results['skipped']:
            print(f"\n⚠️  IGNORADOS ({len(self.results['skipped'])} arquivos):")
            for f in self.results['skipped']:
                print(f"   - {f}")
        
        if self.results['failed']:
            print(f"\n❌ FALHAS ({len(self.results['failed'])} arquivos):")
            for f in self.results['failed']:
                print(f"   ✗ {f}")
        
        total = len(self.results['success'])
        cost = total * 0.08
        print(f"\n💰 Custo estimado: ${cost:.2f}")
        
        print("\n" + "=" * 70)
        print("🎉 REFATORAÇÃO COMPLETA!")
        print("=" * 70)
        print("\n📝 Próximos passos:")
        print("1. cd D:\\Hedge_Control_Alcast")
        print("2. npm run dev")
        print("3. Teste cada página refatorada")
        print(f"\n💾 Backups salvos em: src/app/pages/*/backups/")
        print("\n⚠️  Se algo der errado, restaure do backup mais recente")

def get_files_config():
    """Retorna configuração de todos os arquivos para refatorar"""
    return [
        # FINANCEIRO (8 arquivos)
        {
            "path": PAGES_DIR / "financeiro" / "Inbox.tsx",
            "instructions": """
            - Use Cards para cada exposição/tarefa pendente
            - Ícones: TrendingUp (ativa), TrendingDown (passiva), Eye (detalhar)
            - Badge para status
            - Dialog shadcn para detalhes
            - Empty state: CheckCircle + "Nenhuma tarefa pendente"
            - Loading: Skeleton cards
            """
        },
        {
            "path": PAGES_DIR / "financeiro" / "NetExposure.tsx",
            "instructions": """
            - 4 Cards de métricas: Líquida, Hedge, Ativa, Passiva
            - Table shadcn para buckets
            - Cores: net > 0 = red (risco), net < 0 = green (coberto)
            - Ícones: BarChart3, TrendingUp, TrendingDown
            - Loading e empty states
            """
        },
        {
            "path": PAGES_DIR / "financeiro" / "RFQs.tsx",
            "instructions": """
            - Table shadcn com todas as colunas
            - Badge para status (open, awarded, failed)
            - Botão "Novo RFQ" destacado (Plus icon)
            - Ranking inline compacto
            - Botão "Detalhar" (Send icon)
            - Loading e empty states
            """
        },
        {
            "path": PAGES_DIR / "financeiro" / "RFQDetalhe.tsx",
            "instructions": """
            - 3 Cards métricas: Melhor Preço, Média, Respostas
            - Table para ranking com sort
            - Badge para tier e status
            - Destaque visual para melhor (bg-green-50)
            - Dialog para decisão final
            - Ícones: CheckCircle, MessageSquare, Clock
            """
        },
        {
            "path": PAGES_DIR / "financeiro" / "NovoRFQ.tsx",
            "instructions": """
            - Form com Labels para cada campo
            - Select shadcn para dropdowns
            - Input shadcn com validação
            - Textarea para notas
            - Button submit destacado
            - Alert para erros
            - Separators entre seções
            """
        },
        {
            "path": PAGES_DIR / "financeiro" / "Contrapartes.tsx",
            "instructions": """
            - Table shadcn
            - Botões Edit/Delete (ícones)
            - Badge para tier
            - Dialog para CRUD
            - Botão "Nova Contraparte" (Plus + Building2)
            - Loading e empty states
            """
        },
        {
            "path": PAGES_DIR / "financeiro" / "Relatorios.tsx",
            "instructions": """
            - Cards para tipos de relatórios
            - Botões Download (icon)
            - Botões Gerar (FileText icon)
            - Select para filtros
            - Ícones: FileText, Download, Calendar, BarChart3
            """
        },
        {
            "path": PAGES_DIR / "financeiro" / "MTM.tsx",
            "instructions": """
            - 4 Cards métricas: Total, Snapshots, Positivos, Negativos
            - Tabs: Exposição, Histórico, Hedges, Registrar, Preços
            - Tables shadcn em todas as seções
            - Select shadcn para todos os filtros
            - Input shadcn com Labels
            - Ícones: DollarSign, TrendingUp/Down, RefreshCw, Calendar
            - Cores: MTM positivo=green, negativo=red
            """
        },
        
        # COMPRAS (2 arquivos)
        {
            "path": PAGES_DIR / "compras" / "POs.tsx",
            "instructions": """
            - Table shadcn
            - Badge para status
            - Botão "Novo PO" (Plus icon)
            - Filtros com Select shadcn
            - Botões Eye/Edit
            - Loading e empty states
            """
        },
        {
            "path": PAGES_DIR / "compras" / "Fornecedores.tsx",
            "instructions": """
            - Table shadcn
            - Badge para status
            - Dialog para CRUD
            - Botão "Novo Fornecedor" (Plus + Building2)
            - Botões Edit/Delete
            - Loading e empty states
            """
        },
        
        # VENDAS (2 arquivos)
        {
            "path": PAGES_DIR / "vendas" / "SOs.tsx",
            "instructions": """
            - Table shadcn
            - Badge para status
            - Botão "Novo SO" (Plus icon)
            - Filtros com Select shadcn
            - Botões Eye/Edit
            - Loading e empty states
            """
        },
        {
            "path": PAGES_DIR / "vendas" / "Clientes.tsx",
            "instructions": """
            - Table shadcn
            - Badge para status
            - Dialog para CRUD
            - Botão "Novo Cliente" (Plus + Users)
            - Botões Edit/Delete
            - Loading e empty states
            """
        },
        
        # RAIZ (1 arquivo)
        {
            "path": PAGES_DIR / "Estoque.tsx",
            "instructions": """
            - Cards para resumo
            - Table se houver listagem
            - Badge para status
            - Ícones: BarChart3, TrendingUp, AlertCircle
            - Loading e empty states
            """
        },
    ]

def main():
    # Modo interativo ou batch
    if len(sys.argv) > 1:
        if sys.argv[1] == "--list":
            # Listar arquivos que serão refatorados
            print("📋 Arquivos que serão refatorados:\n")
            for i, config in enumerate(get_files_config(), 1):
                print(f"{i:2d}. {config['path'].relative_to(PAGES_DIR)}")
            return
        elif sys.argv[1] == "--single":
            # Refatorar apenas um arquivo
            if len(sys.argv) < 3:
                print("Uso: python refactor_pro.py --single <arquivo>")
                print("Exemplo: python refactor_pro.py --single Inbox.tsx")
                return
            
            filename = sys.argv[2]
            files_config = get_files_config()
            target = [f for f in files_config if f["path"].name == filename]
            
            if not target:
                print(f"❌ Arquivo não encontrado: {filename}")
                return
            
            refactor = AlcastRefactor()
            refactor.refactor_all(target)
            return
    
    # Confirmação
    print("\n⚠️  ATENÇÃO: Este script vai refatorar 13 arquivos!")
    print("\n📋 Arquivos:")
    for i, config in enumerate(get_files_config(), 1):
        print(f"   {i:2d}. {config['path'].relative_to(PAGES_DIR)}")
    
    print(f"\n💰 Custo estimado: ~$1.12")
    print(f"💾 Backups serão criados automaticamente\n")
    
    response = input("Deseja continuar? (s/N): ").strip().lower()
    
    if response != 's':
        print("\n❌ Cancelado pelo usuário")
        return
    
    # Executar refatoração
    refactor = AlcastRefactor()
    refactor.refactor_all(get_files_config())

if __name__ == "__main__":
    main()
