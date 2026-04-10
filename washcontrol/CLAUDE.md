# CLAUDE.md — WashControl SaaS Lavacar

## Contexto do Projeto

Este repositório contém o **WashControl**, um SaaS multi-tenant de gestão para lava-cars. O projeto é desenvolvido simultaneamente como:

1. **Produto real** — aplicação Next.js + Prisma + PostgreSQL
2. **Trabalho acadêmico** — matéria de **Modelagem de Sistemas** (faculdade), com foco em UML, requisitos, stakeholders e diagramas

## Foco Prioritário: Matéria de Modelagem

Sempre que o usuário pedir ajuda neste projeto, priorize a perspectiva de **Modelagem de Sistemas**. Mesmo quando a tarefa é de código, pense e comunique em termos de:

- **Requisitos funcionais (RF)** e **não funcionais (RNF)** que a funcionalidade atende (numeração oficial: RF01–RF10, RNF01–RNF06, classificação FURPS+)
- **Técnica de elicitação** que gerou o requisito (Questionário, Entrevista, Observação, Reunião, Brainstorming ou JAD) e por quê foi escolhida
- **Casos de uso** envolvidos (qual ator dispara, qual fluxo)
- **Diagrama UML** correspondente (classe, sequência, atividade, estado, componente, implantação) — sintaxe PlantUML por padrão
- **Stakeholder** impactado pela mudança
- **Regras de negócio** mapeadas no domínio

## Stack do Projeto

- **Frontend/Backend:** Next.js 15 (App Router) com TypeScript
- **ORM:** Prisma com PostgreSQL
- **Autenticação:** Middleware customizado (`middleware.ts`)
- **Estrutura:** multi-tenant via modelo `Tenant` (slug único por lava-car)

## Entidades do Domínio (schema.prisma)

| Entidade | Papel no Domínio |
|---|---|
| `Tenant` | Cada lava-car cadastrado no SaaS |
| `User` | Usuário com papel: SUPER_ADMIN, MANAGER, WASHER |
| `Customer` | Cliente do lava-car (com contador de fidelidade) |
| `Vehicle` | Veículo do cliente (placa única por tenant) |
| `Order` | Ordem de serviço (OS) com status de ciclo de vida |
| `OrderItem` | Item da OS (serviço ou insumo físico) |
| `Product` | Serviço ou produto físico (com estoque) |
| `Appointment` | Agendamento vinculado a 1 OS (idempotência) |
| `Employee` | Funcionário com comissão e vínculo com User |
| `FinancialTransaction` | Lançamento financeiro (receita/despesa) |
| `InventoryTransaction` | Movimentação de estoque (entrada/saída) |
| `FixedExpense` | Despesa fixa recorrente por dia do mês |

## Ciclo de Vida da Ordem de Serviço

```
PENDING → WAITING_QUEUE → IN_PROGRESS → READY → COMPLETED
                                              ↘ CANCELED
```

## Papéis (Atores UML)

| Ator | Papel | Acesso |
|---|---|---|
| **Super Admin** | Administrador da plataforma SaaS | Gerencia todos os tenants |
| **Manager** | Dono/gerente do lava-car | Gestão completa do seu tenant |
| **Washer** | Lavador funcionário | Executa OS, vê pátio |
| **Customer** | Cliente do lava-car | Agendamentos (futuro) |

## Módulos do Sistema (por rota `/dashboard/`)

- `agendamentos` — Gestão de agendamentos
- `clientes` — CRUD de clientes e fidelidade
- `configuracoes` — Configurações do tenant e plano SaaS
- `equipe` — Gestão de funcionários e comissões
- `faturamento` — Controle de planos e cobranças SaaS
- `financeiro` — DRE, fluxo de caixa, lançamentos
- `insumos` — Gestão de estoque e inventário
- `lavacarros` — Catálogo de serviços/produtos
- `os` — Ordens de serviço (board Kanban)
- `patio` — Visão do pátio (veículos em atendimento)

## Diretrizes para Modelagem Acadêmica

### Ao gerar diagramas UML

- Use sintaxe **PlantUML** por padrão (blocos de código ` ```plantuml `)
- Também aceite **Mermaid** se o usuário pedir
- Para Casos de Uso: identifique sempre o ator primário e ator secundário (sistema externo)
- Para Diagramas de Classe: mapeie as relações do schema Prisma (1:N, N:N, composição, agregação)
- Para Diagramas de Sequência: modele o fluxo real do Next.js (Client Component → Server Action → Prisma → DB)
- Para Diagramas de Estado: use o ciclo de vida da `Order` como referência central

### Ao levantar requisitos

Os requisitos **oficiais do trabalho acadêmico** estão definidos no documento da disciplina e consolidados em `contexto.md` seções 3 e 4. Use sempre a numeração RF01–RF10 e RNF01–RNF06 ao referenciar esses requisitos.

**Requisitos Funcionais oficiais (resumo):**

| ID | Descrição resumida | Requisitante |
|---|---|---|
| RF01 | Cadastro e gerenciamento de Tenants | SUPER_ADMIN |
| RF02 | Cadastro de clientes e veículos | MANAGER |
| RF03 | Ciclo de vida da OS via Kanban | MANAGER |
| RF04 | Visualização e atualização de status no pátio | WASHER |
| RF05 | Agendamento prévio (Appointment) | Customer / MANAGER |
| RF06 | Baixa automática de estoque ao concluir OS | MANAGER |
| RF07 | Geração automática de FinancialTransaction ao concluir OS | MANAGER |
| RF08 | Registro e controle de despesas fixas e comissões | MANAGER |
| RF09 | Notificações de mudança de status ao cliente | Customer |
| RF10 | Relatórios gerenciais (DRE, volume de OSs) | MANAGER |

**Requisitos Não Funcionais oficiais — classificação FURPS+:**

| ID | Categoria FURPS+ | Descrição resumida |
|---|---|---|
| RNF01 | Usability | Interface responsiva para celular |
| RNF02 | Reliability | Isolamento lógico de dados entre tenants |
| RNF03 | Performance | Atualização de status em ≤ 2 segundos |
| RNF04 | Supportability | Padrão Repository com Prisma ORM |
| RNF05 | + Security | Acesso financeiro/estoque restrito ao MANAGER |
| RNF06 | + Implementation | Banco de dados relacional (PostgreSQL) |

Para novos requisitos identificados fora do documento oficial, use o template:
```
RF-XX: [Verbo no infinitivo] + [objeto] + [condição/restrição]
Ator: [quem executa]
Prioridade: [Alta / Média / Baixa]
Módulo: [rota correspondente]
```

```
RNF-XX: [Atributo de qualidade] — [descrição mensurável]
Categoria FURPS+: [Usability / Reliability / Performance / Supportability / +Security / +Implementation]
```

### Ao trabalhar com Técnicas de Elicitação

A matéria cobre 6 técnicas (Reinehr). Ao responder qualquer pergunta sobre como os requisitos do WashControl foram levantados, referencie a técnica correta e justifique usando os critérios "quando usar":

| Técnica | Quando usar (critério-chave) | Aplicação no WashControl |
|---|---|---|
| **Questionário** | Usuários distantes; dados estatísticos; muitas pessoas | Validação SaaS com múltiplos donos de lava-car |
| **Entrevista** | Informações subjetivas; fluxo de trabalho/documentos | Manager: dores do negócio, fluxo de OS, financeiro |
| **Reunião** | Resposta rápida de várias pessoas; resolver conflitos; consenso | Alinhamento de equipe e stakeholders |
| **Observação** | Fluxo físico relevante; influência do ambiente; performance | Pátio: comportamento do Washer com celular em mãos |
| **Brainstorming** | Soluções inovadoras; novo produto no mercado | Ideação de fidelidade, Kanban, notificações |
| **JAD** | Escopo grande; múltiplas áreas; consenso; patrocínio | Design completo do sistema multi-tenant |

**Participantes do JAD (papéis):**
- **Condutor**: líder imparcial, não emite opinião técnica
- **Analista de Sistemas**: levanta dados, prepara material, escreve documentação
- **Executivo Patrocinador**: autoridade sobre decisões, visão estratégica
- **Usuários**: fornecem necessidades do negócio, têm poder de decisão
- **Documentador**: registra decisões e produz ata
- **Ouvintes**: aprendem a técnica ou o negócio, não votam
- **Convidados/Especialistas**: participam apenas nas sessões de sua área

**Fases do JAD:** Preparação → Execução (abertura + tópicos + conclusão) → Revisão

**Ao gerar perguntas de elicitação** para o WashControl, sempre especifique:
- A técnica adequada e por quê (critério "quando usar")
- O stakeholder-alvo
- Como evitar as limitações conhecidas da técnica (ex: entrevista → evitar perguntas só Sim/Não)

### Ao descrever stakeholders

Use o template de análise:
```
Stakeholder: [nome/papel]
Interesse: [o que ele quer do sistema]
Influência: [Alta / Média / Baixa]
Impacto: [Alta / Média / Baixa]
Expectativas-chave: [lista]
```

## Convenções de Código

- Português para nomes de variáveis/comentários de domínio (ex: `criarOS`, `cliente`)
- Inglês para estrutura técnica (componentes React, funções de infra)
- Server Actions em `/actions/`
- Todos os dados são isolados por `tenantId` (multi-tenancy)

## O que NÃO fazer

- Nunca quebrar o isolamento de tenant (queries sem `tenantId`)
- Não criar uma OS sem vincular a um `Customer` e `Vehicle`
- Não misturar conceitos de modelagem acadêmica com implementação especulativa
- Não gerar diagramas sem basear nas entidades reais do schema.prisma
