# INDUSTRIA360 – Gestão Industrial Inteligente

Plataforma **EAM (Enterprise Asset Management)** para gestão de manutenção industrial — fábricas, refinarias,
plataformas de óleo e gás e grandes plantas industriais. MVP de demonstração (front-end completo) desenvolvido em
**Angular 19** com componentes standalone, sem back-end: os dados são **fictícios** e persistidos no `localStorage`.

> ⚠️ Não há conexão com máquinas, sensores ou CLPs. Todos os registros são dados de demonstração.

## Como executar

Pré-requisitos: **Node.js 18.19+** (recomendado 20 ou 22) e npm.

```bash
npm install
npm start            # http://localhost:4200
```

Build de produção (gera `dist/industria360/browser`, publicável em qualquer servidor estático):

```bash
npm run build
```

**Acesso de demonstração:** `admin` / `admin123` (Administrador) ou `planejador` / `plan123`.

## Funcionalidades

| Módulo | Destaques |
|---|---|
| Dashboard | 8 indicadores calculados, 5 gráficos (Chart.js), atividades recentes, próximas preventivas, alertas de estoque |
| Equipamentos | CRUD, código automático, busca em tempo real, filtros (categoria, setor, situação), detalhes com histórico |
| Ordens de Serviço | Número automático `OS-AAAA-0000`, histórico auditável (status, técnico, prioridade, prazo), prazo sugerido pelo SLA, marcação automática de atraso |
| Chamados | Protocolo automático `CH-AAAAMMDD-0000`, destaque de críticos, conversão em OS (chamado resolvido ao concluir a OS) |
| Preventiva | Status calculado (em dia / próxima do vencimento / atrasada), registro de execução que recalcula datas e atualiza o equipamento, geração de OS |
| Corretiva | Etapas com barra de progresso, linha do tempo, causa/solução, tempo de parada, MTTR |
| Estoque e Peças | Níveis Normal / Baixo / Zerado, entradas e saídas com saldo e validação, histórico de movimentações |
| Técnicos | Cards com carga de trabalho, máscara de telefone, validação de e-mail, bloqueio de exclusão com OS ativa |
| Relatórios | Filtros por período/setor/equipamento, disponibilidade, MTTR, MTBF, ranking de ocorrências, impressão/PDF, CSV e JSON |
| Configurações | Empresa/unidade, setores, categorias, especialidades, prioridades (cor + SLA), tema claro/escuro, backup/restauração |

## Arquitetura

```
src/app/
├── core/
│   ├── models/          Interfaces TypeScript (Equipamento, OrdemServico, Chamado, Tecnico, Peca, Preventiva, Corretiva, Configuracao)
│   ├── constants/       Listas de opções (status, tipos, frequências)
│   ├── data/            Dados de demonstração (seed) — fictícios
│   ├── services/        StorageService (único acesso ao localStorage), BaseCrudService e 1 serviço por módulo
│   ├── guards/          authGuard (login simulado)
│   └── layout/          Shell, Sidebar e Header
├── shared/
│   ├── components/      Icon, Logo, Badge, Modal, ConfirmDialog, Toasts, PageHeader, KpiCard, Chart, EmptyState, ListaEditavel
│   └── utils/           Datas, códigos/protocolos, cores de status, exportação CSV/JSON, validação de formulários
├── pages/               login, dashboard, equipamentos, ordens-servico, chamados, preventiva, corretiva, estoque, tecnicos, relatorios, configuracoes
├── app.routes.ts        Rotas com lazy loading
└── app.config.ts        Router (hash), locale pt-BR
```

* **Estado reativo com Signals:** cada serviço mantém sua coleção em um `signal`; tabelas, indicadores e gráficos
  são `computed` e se atualizam automaticamente após qualquer alteração.
* **Persistência centralizada:** nenhum componente acessa `localStorage`. Todos usam os serviços de domínio, que
  herdam de `BaseCrudService` e gravam via `StorageService` (chaves com prefixo `industria360:`).
* **Cores de estado centralizadas** em `shared/utils/status-tone.ts` (verde, azul, amarelo, laranja, vermelho, cinza, roxo).

## Migração futura para API REST + MySQL

1. Adicionar `provideHttpClient()` em `app.config.ts`.
2. Em cada serviço de `core/services`, trocar a carga inicial (`storage.get`) por `GET /api/<recurso>` e os métodos
   `inserir/substituir/excluir` de `BaseCrudService` por `POST`, `PUT` e `DELETE`.
3. Manter as assinaturas públicas (`itens`, `criar`, `atualizar`, `excluir`…) — os componentes não precisam mudar.
4. As interfaces em `core/models` servem de contrato para os DTOs e para o modelo relacional (MySQL).

Endpoints sugeridos: `/api/equipamentos`, `/api/ordens-servico` (+ `/historico`), `/api/chamados`, `/api/tecnicos`,
`/api/pecas` (+ `/movimentacoes`), `/api/preventivas`, `/api/corretivas`, `/api/configuracao`, `/api/auth/login` (JWT).

## Dados

* Dados ficam no navegador; use **Configurações → Dados e backup** para exportar/importar JSON ou restaurar a demonstração.
* As datas de demonstração são geradas em relação ao dia do primeiro acesso e então fixadas no armazenamento local.
