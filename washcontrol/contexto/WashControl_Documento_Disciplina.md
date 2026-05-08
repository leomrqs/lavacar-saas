# Curso de Bacharelado em Ciência da Computação — BCC
## Modelagem de Sistemas Computacionais

**Projeto:** Análise e Projeto de Sistema Computacional

**Contexto:** WashControl — Sistema SaaS de Gestão para Lava-Cars e Estéticas Automotivas

**Condução:** Leonardo dos Santos Marques

**Objetivo:** Especificar o sistema WashControl aplicando UML para um problema de contexto real no mercado de estética automotiva.

---

# RA1 — Modelo de Domínio

## 1. Introdução

### 1.1 Contexto de Negócio

O mercado de cuidados automotivos — popularmente chamado de *detailing* — tem crescido de forma expressiva no Brasil. As pessoas investem cada vez mais em seus veículos e buscam serviços de qualidade. No entanto, a maioria dos estabelecimentos de pequeno e médio porte ainda opera de forma desorganizada: filas sem controle, anotações em papel, comunicação dispersa via WhatsApp e ausência de visibilidade financeira.

O **WashControl** é um sistema SaaS (*Software as a Service*) multi-tenant desenvolvido para atender lava-cars e estéticas automotivas. Cada estabelecimento cadastrado na plataforma é tratado como um *tenant* isolado, com seus próprios clientes, veículos, funcionários, ordens de serviço e dados financeiros. A plataforma é administrada centralmente por um Super Admin, que gerencia os tenants, planos de assinatura e faturamento.

A arquitetura multi-tenant permite que o WashControl atenda simultaneamente dezenas de estabelecimentos com um único sistema, reduzindo custos de infraestrutura e facilitando a escalabilidade do produto.

### 1.2 Justificativa do Projeto

O principal problema que o WashControl resolve é a **falta de previsibilidade e controle** nos lava-cars. Quando um cliente deixa o veículo e recebe a informação "volta em 2 horas", mas ao chegar o serviço nem começou, a confiança é destruída. Da mesma forma, o dono do estabelecimento frequentemente não sabe com precisão quanto lucrou no dia, quais funcionários são mais produtivos ou quais insumos estão em falta.

O projeto se justifica pela necessidade de **automatizar o fluxo operacional** — desde o agendamento até a entrega do veículo — e fornecer **visibilidade financeira em tempo real** ao gestor. Estabelecimentos que utilizam sistemas organizados passam mais credibilidade ao cliente, conseguem atender maior volume de serviços sem perda de qualidade e tomam decisões baseadas em dados.

Do ponto de vista de mercado, trata-se de uma oportunidade de negócio B2B (empresa-para-empresa) com modelo de receita recorrente via assinatura (SaaS), com baixa concorrência de sistemas especializados acessíveis para pequenos e médios estabelecimentos.

### 1.3 Benefícios

**Para o dono do negócio (Manager):**
- Controle financeiro real com DRE automática (receitas × despesas)
- Visibilidade da produtividade da equipe e cálculo automático de comissões
- Gestão de estoque integrada ao fluxo de atendimento
- Programa de fidelidade configurável para reter clientes

**Para o lavador (Washer):**
- Interface simplificada e responsiva para uso no pátio via celular
- Fila de serviços organizada, eliminando conflitos de atribuição

**Para o cliente:**
- Agendamento prévio de horário
- Notificação automática quando o veículo estiver pronto (RF09)
- Histórico de atendimentos e benefícios do programa de fidelidade

**Para a operação como um todo:**
- Redução de erros humanos (dupla marcação, serviços não cobrados)
- Rastreabilidade completa do ciclo de vida de cada ordem de serviço
- Isolamento de dados entre estabelecimentos (multi-tenancy seguro)

---

## 2. Requisitos

### 2.1 Requisitos Funcionais

| ID | Descrição | Requisitante | Detalhes |
|---|---|---|---|
| RF01 | O sistema deve permitir o cadastro e gerenciamento de Tenants (lava-jatos parceiros). | SUPER_ADMIN | Envolve a criação da conta principal da loja no modelo SaaS, com nome, slug único e plano de assinatura. |
| RF02 | O sistema deve permitir o cadastro de clientes e seus respectivos veículos. | MANAGER | Deve suportar a vinculação de múltiplos veículos a um único Customer. A placa do veículo deve ser única por tenant. |
| RF03 | O sistema deve gerenciar o ciclo de vida da Ordem de Serviço (OS) através de um Kanban. | MANAGER | A OS deve transitar pelos status: PENDING, WAITING_QUEUE, IN_PROGRESS, READY, COMPLETED ou CANCELED. |
| RF04 | O sistema deve permitir a visualização e atualização de status das OSs ativas no pátio. | WASHER | Interface simplificada para que o lavador mova o card da OS (ex: de WAITING_QUEUE para IN_PROGRESS). |
| RF05 | O sistema deve permitir o agendamento prévio (Appointment) de serviços de lavagem. | Customer / MANAGER | O cliente final ou o gerente podem reservar um horário na agenda. Um agendamento pode gerar no máximo uma OS (idempotência). |
| RF06 | O sistema deve abater automaticamente produtos do estoque (InventoryTransaction) ao concluir uma OS. | MANAGER | Integração entre a conclusão da OS e a baixa dos insumos utilizados nos itens da OS. |
| RF07 | O sistema deve gerar uma transação financeira de receita (FinancialTransaction) ao concluir uma OS. | MANAGER | O fechamento da OS no Kanban engatilha o registro financeiro automático com método de pagamento e valor total. |
| RF08 | O sistema deve permitir o registro e controle de despesas fixas (FixedExpense) e pagamentos de funcionários. | MANAGER | Controle de custos operacionais como água, luz, aluguel e comissões calculadas sobre OSs concluídas. |
| RF09 | O sistema deve disparar notificações sobre a mudança de status do veículo. | Customer | O cliente deve ser avisado (ex: via WhatsApp ou Push) quando o status mudar para READY. |
| RF10 | O sistema deve prover relatórios gerenciais sobre o volume de OSs, receitas e despesas. | MANAGER | Dashboard unificando os dados financeiros e operacionais do Tenant (DRE, fluxo de caixa, KPIs). |

### 2.2 Requisitos Não Funcionais (Classificação FURPS+)

| ID | Descrição | Requisitante | Categoria FURPS+ | Detalhes |
|---|---|---|---|---|
| RNF01 | O sistema deve possuir uma interface responsiva para adaptação a telas de smartphones. | WASHER | **Usability** (Usabilidade) | Essencial para o uso do sistema no pátio do lava-jato via celular, com mãos potencialmente molhadas. |
| RNF02 | O sistema deve garantir o isolamento lógico dos dados entre diferentes lojas. | SUPER_ADMIN | **Reliability** (Confiabilidade) | Sendo multi-tenant, um gerente nunca pode acessar dados (clientes, OS) de outro tenant. O tenantId é obrigatório em todas as queries. |
| RNF03 | A atualização de status da OS no painel Kanban deve ser refletida na interface em no máximo 2 segundos. | MANAGER | **Performance** (Desempenho) | O tempo de resposta deve garantir a fluidez da operação no pátio em tempo real. |
| RNF04 | O sistema deve utilizar o padrão Repository com ORM (Prisma) para o acesso a dados. | Equipe de Desenvolvimento | **Supportability** (Suportabilidade) | Facilita a manutenção do código, trocas de SGBD e escalabilidade do sistema. |
| RNF05 | O sistema deve restringir o acesso a funcionalidades financeiras e de estoque exclusivamente ao papel de gerência. | MANAGER | **+ Security** (Segurança) | O WASHER só tem acesso operacional (pátio, OS), enquanto o MANAGER tem acesso total à sua loja. |
| RNF06 | O modelo de dados central do sistema deve ser armazenado em um banco de dados relacional. | Equipe de Arquitetura | **+ Implementation** (Implementação) | Restrição tecnológica atendida pelo uso do schema.prisma com PostgreSQL. |

---

## 3. Modelagem do Sistema

### 3.1 Diagrama de Caso de Uso

```plantuml
@startuml CasosDeUso_WashControl

left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome

actor "Manager\n(Dono/Gerente)" as MGR
actor "Washer\n(Lavador)" as WSH
actor "Cliente" as CLI
actor "Super Admin" as SA
actor "Sistema" as SYS <<system>>

rectangle "WashControl SaaS" {

  package "Gestão de OS" {
    usecase "Criar OS" as UC01
    usecase "Adicionar Itens à OS" as UC02
    usecase "Atualizar Status da OS" as UC03
    usecase "Cancelar OS" as UC04
    usecase "Visualizar Board Kanban" as UC05
    usecase "Registrar Pagamento" as UC06
  }

  package "Clientes e Veículos" {
    usecase "Cadastrar Cliente" as UC07
    usecase "Cadastrar Veículo" as UC08
    usecase "Consultar Histórico do Cliente" as UC09
    usecase "Aplicar Desconto Fidelidade" as UC10
  }

  package "Agendamentos" {
    usecase "Criar Agendamento" as UC11
    usecase "Converter Agendamento em OS" as UC12
    usecase "Cancelar Agendamento" as UC13
  }

  package "Financeiro" {
    usecase "Visualizar DRE" as UC14
    usecase "Lançar Despesa Manual" as UC15
    usecase "Controlar Despesas Fixas" as UC16
    usecase "Calcular Comissão de Funcionário" as UC17
  }

  package "Estoque" {
    usecase "Gerenciar Produtos/Insumos" as UC18
    usecase "Baixar Estoque por OS" as UC19
    usecase "Alertar Estoque Mínimo" as UC20
  }

  package "Equipe" {
    usecase "Cadastrar Funcionário" as UC21
    usecase "Vincular Funcionário a Usuário" as UC22
    usecase "Desativar Funcionário" as UC23
  }

  package "Administração SaaS" {
    usecase "Gerenciar Tenants" as UC24
    usecase "Configurar Plano SaaS" as UC25
    usecase "Ativar/Desativar Tenant" as UC26
  }
}

' Relações Manager
MGR --> UC01
MGR --> UC02
MGR --> UC03
MGR --> UC04
MGR --> UC05
MGR --> UC06
MGR --> UC07
MGR --> UC08
MGR --> UC09
MGR --> UC11
MGR --> UC12
MGR --> UC13
MGR --> UC14
MGR --> UC15
MGR --> UC16
MGR --> UC18
MGR --> UC21
MGR --> UC22
MGR --> UC23

' Relações Washer
WSH --> UC03
WSH --> UC05

' Relações Cliente
CLI --> UC11

' Relações Super Admin
SA --> UC24
SA --> UC25
SA --> UC26

' Automações do Sistema
UC01 ..> UC10 : <<include>>
UC12 ..> UC01 : <<include>>
UC03 ..> UC19 : <<extend>>\n[ao COMPLETED]
UC03 ..> UC17 : <<extend>>\n[ao COMPLETED]
UC03 ..> UC20 : <<extend>>\n[estoque baixo]
SYS --> UC10
SYS --> UC16
SYS --> UC17
SYS --> UC19
SYS --> UC20

@enduml
```

---

### 3.2 Especificações de Casos de Uso

---

#### UC-01 — Criar Ordem de Serviço

**Nome do Caso de Uso:** Criar Ordem de Serviço (OS)

**Breve Descrição:** Permite que o Manager registre a entrada de um veículo no sistema, criando uma Ordem de Serviço vinculada a um cliente, um veículo e com os itens de serviço/insumos a serem executados. A OS é criada com status PENDING e passa a compor o board Kanban.

**Ator Principal:** Manager

**Ator Secundário:** Sistema (valida dados, persiste no banco, verifica fidelidade)

**Precondições:**
- O Manager deve estar autenticado no sistema com papel MANAGER
- O cliente deve estar previamente cadastrado no sistema (ou ser cadastrado durante o fluxo)
- O veículo deve estar vinculado ao cliente
- Deve haver pelo menos um produto/serviço cadastrado no catálogo do tenant

**Pós-condições:**
- Uma nova OS é criada com status PENDING no banco de dados
- A OS aparece na coluna PENDING do board Kanban
- Os itens (OrderItems) estão vinculados à OS com preços e quantidades

**Fluxo de Eventos:**

*Fluxo Básico:*
1. O Manager acessa o módulo `/dashboard/os`
2. O Manager clica em "Nova OS"
3. O sistema exibe o formulário de criação com campos: cliente, veículo, itens, observações, pagamento antecipado
4. O Manager seleciona o cliente pelo nome ou telefone
5. O sistema lista os veículos vinculados ao cliente selecionado
6. O Manager seleciona o veículo a ser atendido
7. O Manager adiciona os itens da OS (serviços e/ou insumos) com quantidades e preços unitários
8. O sistema calcula e exibe o valor total em tempo real
9. O Manager confirma a criação clicando em "Criar OS"
10. O sistema persiste a OS com status PENDING e redireciona para o board Kanban
11. O sistema verifica se o cliente atingiu o intervalo de fidelidade (`totalWashes % loyaltyInterval == 0`) e, se aplicável, aplica desconto automaticamente

*Fluxo Alternativo — Cliente não cadastrado:*
- 4a. O Manager não encontra o cliente na busca
- 4b. O Manager clica em "Novo Cliente"
- 4c. O sistema exibe o formulário de cadastro de cliente (nome, telefone, e-mail)
- 4d. O Manager preenche e confirma o cadastro
- 4e. O fluxo retorna ao passo 5

*Fluxo Alternativo — Criação via Agendamento:*
- 1a. O Manager acessa o módulo `/dashboard/agendamentos`
- 1b. O Manager seleciona um agendamento com status SCHEDULED
- 1c. O Manager clica em "Converter em OS"
- 1d. O sistema preenche automaticamente cliente e veículo a partir do agendamento
- 1e. O fluxo continua a partir do passo 7
- **Restrição:** O sistema impede a criação de uma segunda OS para o mesmo agendamento (idempotência via `Appointment.orderId @unique`)

*Fluxo de Exceção — Veículo sem itens:*
- 9a. O Manager tenta confirmar a OS sem nenhum item adicionado
- 9b. O sistema exibe a mensagem: "A OS deve conter pelo menos um serviço ou insumo"
- 9c. O fluxo retorna ao passo 7

---

#### UC-03 — Atualizar Status da Ordem de Serviço

**Nome do Caso de Uso:** Atualizar Status da Ordem de Serviço

**Breve Descrição:** Permite que o Manager ou o Washer movam a OS entre os estados do ciclo de vida (PENDING → WAITING_QUEUE → IN_PROGRESS → READY → COMPLETED). Ao atingir o status COMPLETED, o sistema executa automaticamente os processos financeiro, de estoque e de fidelidade.

**Ator Principal:** Manager (para todos os status) / Washer (apenas IN_PROGRESS e READY)

**Ator Secundário:** Sistema (registros financeiros e de estoque automáticos)

**Precondições:**
- O usuário deve estar autenticado
- A OS deve existir e pertencer ao tenant do usuário
- A transição de status deve ser válida conforme o ciclo de vida definido

**Pós-condições:**
- O status da OS é atualizado no banco de dados
- Os campos de timestamp correspondentes são preenchidos (startedAt, finishedAt, completedAt)
- Se o novo status for COMPLETED:
  - Uma FinancialTransaction de INCOME é criada automaticamente
  - InventoryTransactions de saída (OUT) são criadas para cada insumo da OS
  - O estoque de cada produto é decrementado
  - O contador `Customer.totalWashes` é incrementado
  - A comissão do funcionário é calculada
- A interface do Kanban é atualizada em no máximo 2 segundos (RNF03)

**Fluxo de Eventos:**

*Fluxo Básico — Conclusão de OS (READY → COMPLETED):*
1. O Manager acessa o board Kanban em `/dashboard/os`
2. O Manager localiza a OS na coluna READY
3. O Manager clica no card da OS e seleciona "Concluir / Registrar Pagamento"
4. O sistema exibe o formulário de conclusão: método de pagamento, valor total, valor adiantado
5. O Manager confirma o método de pagamento (PIX, Dinheiro, Cartão Crédito, Cartão Débito)
6. O Manager clica em "Confirmar Conclusão"
7. O sistema atualiza o status para COMPLETED e registra `completedAt = now()`
8. O sistema cria automaticamente:
   - `FinancialTransaction` (type: INCOME, amount: total da OS)
   - `InventoryTransaction` OUT para cada OrderItem com `isService = false`
   - Decrementa `Product.stock` para cada insumo
9. O sistema incrementa `Customer.totalWashes`
10. O sistema verifica se o cliente atingiu o intervalo de fidelidade e aplica desconto, se aplicável
11. O sistema calcula e registra a comissão do Employee vinculado
12. O card da OS desaparece do Kanban e aparece no histórico

*Fluxo Alternativo — Lavador inicia serviço (WAITING_QUEUE → IN_PROGRESS):*
1. O Washer acessa a visão do pátio em `/dashboard/patio`
2. O Washer visualiza a lista de OSs com status WAITING_QUEUE
3. O Washer clica em "Iniciar" no card do veículo atribuído
4. O sistema atualiza o status para IN_PROGRESS e registra `startedAt = now()`
5. O card move para a coluna IN_PROGRESS no Kanban do Manager

*Fluxo Alternativo — Cancelamento:*
- 3a. O Manager seleciona "Cancelar OS" no menu do card
- 3b. O sistema solicita confirmação e motivo do cancelamento
- 3c. O Manager confirma
- 3d. O sistema atualiza o status para CANCELED
- **Restrição:** Somente MANAGER pode cancelar uma OS; WASHER não tem esta permissão (RNF05)

*Fluxo de Exceção — Transição de status inválida:*
- O sistema rejeita transições fora do ciclo definido (ex: PENDING → COMPLETED)
- O sistema exibe mensagem de erro informando os status válidos para a transição

---

#### UC-11 — Criar Agendamento

**Nome do Caso de Uso:** Criar Agendamento

**Breve Descrição:** Permite que o Manager registre previamente um horário de atendimento para um cliente e veículo, reservando uma vaga na agenda do lava-car. O agendamento permanece com status SCHEDULED até ser convertido em OS ou cancelado.

**Ator Principal:** Manager

**Ator Secundário:** Sistema (valida disponibilidade de horário, envia notificação futura ao cliente)

**Precondições:**
- O Manager deve estar autenticado com papel MANAGER
- O cliente e veículo devem estar cadastrados no sistema
- O horário solicitado não deve estar ocupado por outro agendamento (verificação de conflito)

**Pós-condições:**
- Um novo Appointment é criado com status SCHEDULED
- O agendamento aparece no calendário do sistema
- O cliente pode receber uma notificação de confirmação (RF09)

**Fluxo de Eventos:**

*Fluxo Básico:*
1. O Manager acessa o módulo `/dashboard/agendamentos`
2. O Manager clica em "Novo Agendamento"
3. O sistema exibe o formulário: data/hora, cliente, veículo, serviço desejado, observações
4. O Manager seleciona a data e horário desejados
5. O sistema verifica a disponibilidade do horário selecionado
6. O Manager seleciona o cliente e o veículo
7. O Manager seleciona o tipo de serviço (opcional)
8. O Manager confirma o agendamento
9. O sistema persiste o Appointment com status SCHEDULED
10. O agendamento é exibido no calendário e na lista de agendamentos

*Fluxo Alternativo — Conversão em OS no dia do atendimento:*
1. O Manager localiza o agendamento no calendário ou lista
2. O Manager clica em "Converter em OS"
3. O sistema cria uma OS pré-preenchida com os dados do agendamento (cliente, veículo, serviço)
4. O Manager adiciona os itens finais e confirma
5. O sistema vincula a OS ao agendamento via `Appointment.orderId`
6. O status do agendamento é atualizado para COMPLETED

*Fluxo Alternativo — Cancelamento do Agendamento:*
- O Manager localiza o agendamento
- O Manager clica em "Cancelar Agendamento"
- O sistema solicita confirmação
- O status do agendamento é atualizado para CANCELED

*Fluxo de Exceção — Conflito de horário:*
- 5a. O sistema detecta outro agendamento no mesmo horário
- 5b. O sistema exibe alerta: "Horário indisponível. Selecione outro horário."
- 5c. O Manager seleciona um horário alternativo e o fluxo retorna ao passo 6

*Fluxo de Exceção — Tentativa de segunda OS para o mesmo agendamento:*
- 3a. O Manager tenta converter um agendamento que já possui uma OS vinculada
- 3b. O sistema rejeita a operação exibindo: "Este agendamento já possui uma OS vinculada"
- 3c. O sistema redireciona para a OS existente (idempotência garantida por `Appointment.orderId @unique`)

---

# RA2 — Diagramas Estruturais

## 4. Modelo de Domínio

O modelo de domínio apresenta as entidades do problema de negócio, seus atributos essenciais, multiplicidades e relacionamentos conceituais (sem foco em implementação técnica).

```plantuml
@startuml ModeloDominio_WashControl

skinparam classAttributeIconSize 0
skinparam classBorderColor #2C7BB6
skinparam classBackgroundColor #EAF4FF

class "Lava-Car\n(Tenant)" as Tenant {
  nome
  identificador único (slug)
  plano de assinatura
  meta mensal
  intervalo de fidelidade
  desconto de fidelidade
}

class "Usuário" as User {
  nome
  e-mail
  papel (SUPER_ADMIN | MANAGER | WASHER)
}

class "Cliente" as Customer {
  nome
  telefone
  e-mail
  total de lavagens (fidelidade)
}

class "Veículo" as Vehicle {
  placa
  marca
  modelo
  cor
  ano
  tipo (CAR | MOTO | TRUCK | VAN | SUV)
}

class "Ordem de Serviço" as Order {
  status
  valor total
  método de pagamento
  data de início
  data de conclusão
  observações
}

class "Item da OS" as OrderItem {
  nome do serviço/produto
  quantidade
  preço unitário
  é serviço? (sim/não)
}

class "Produto/Serviço" as Product {
  nome
  categoria
  preço
  estoque atual
  estoque mínimo
  unidade
}

class "Agendamento" as Appointment {
  data e hora
  status (SCHEDULED | COMPLETED | CANCELED)
  observações
}

class "Funcionário" as Employee {
  nome
  cargo
  salário
  percentual de comissão
  ativo?
}

class "Transação Financeira" as FinancialTx {
  tipo (RECEITA | DESPESA)
  categoria
  descrição
  valor
  status (PENDENTE | PAGO)
  data de vencimento
}

class "Movimentação de Estoque" as InventoryTx {
  tipo (ENTRADA | SAÍDA)
  quantidade
  observações
}

class "Despesa Fixa" as FixedExpense {
  nome
  valor
  dia de vencimento
  categoria
  ativa?
}

' Relações
Tenant "1" -- "0..*" User : possui >
Tenant "1" -- "0..*" Customer : atende >
Tenant "1" -- "0..*" Vehicle : gerencia >
Tenant "1" -- "0..*" Order : registra >
Tenant "1" -- "0..*" Product : cataloga >
Tenant "1" -- "0..*" Employee : emprega >
Tenant "1" -- "0..*" Appointment : agenda >
Tenant "1" -- "0..*" FinancialTx : controla >
Tenant "1" -- "0..*" InventoryTx : rastreia >
Tenant "1" -- "0..*" FixedExpense : define >

Customer "1" -- "1..*" Vehicle : possui >
Customer "1" -- "0..*" Order : realiza >
Customer "1" -- "0..*" Appointment : agenda >

Vehicle "1" -- "0..*" Order : participa de >

Order "1" *-- "1..*" OrderItem : contém >
Order "1" -- "0..1" Appointment : originada de >

OrderItem "0..*" -- "0..1" Product : referencia >
Product "1" -- "0..*" InventoryTx : movimenta >

Employee "0..1" -- "0..1" User : vinculado a >

@enduml
```

---

## 5. Diagrama de Classes

```plantuml
@startuml DiagramaClasses_WashControl

skinparam classAttributeIconSize 0

enum UserRole {
  SUPER_ADMIN
  MANAGER
  WASHER
}

enum OrderStatus {
  PENDING
  WAITING_QUEUE
  IN_PROGRESS
  READY
  COMPLETED
  CANCELED
}

enum VehicleType {
  CAR
  MOTORCYCLE
  TRUCK
  VAN
  SUV
}

class Tenant {
  +id: String
  +name: String
  +slug: String
  +isActive: Boolean
  +saasPlan: String
  +saasPrice: Float
  +saasDueDate: DateTime
  +billingCycleDay: Int
  +monthlyGoal: Float
  +loyaltyInterval: Int
  +loyaltyDiscount: Float
  +createdAt: DateTime
  +updatedAt: DateTime
}

class User {
  +id: String
  +tenantId: String?
  +name: String
  +email: String
  +password: String
  +role: UserRole
  +createdAt: DateTime
  +updatedAt: DateTime
}

class Customer {
  +id: String
  +tenantId: String
  +name: String
  +phone: String?
  +email: String?
  +totalWashes: Int
  +createdAt: DateTime
}

class Vehicle {
  +id: String
  +tenantId: String
  +customerId: String
  +plate: String
  +brand: String?
  +model: String?
  +color: String?
  +year: Int?
  +type: VehicleType
}

class Order {
  +id: String
  +tenantId: String
  +customerId: String
  +vehicleId: String
  +status: OrderStatus
  +total: Float
  +advancePayment: Float
  +paymentMethod: String?
  +startedAt: DateTime?
  +finishedAt: DateTime?
  +completedAt: DateTime?
  +notes: String?
  +createdAt: DateTime
  +updatedAt: DateTime
  --
  +criarOS(): void
  +atualizarStatus(novoStatus: OrderStatus): void
  +calcularTotal(): Float
  +concluir(paymentMethod: String): void
  +cancelar(): void
}

class OrderItem {
  +id: String
  +orderId: String
  +productId: String?
  +name: String
  +quantity: Float
  +unitPrice: Float
  +isService: Boolean
}

class Product {
  +id: String
  +tenantId: String
  +name: String
  +category: String?
  +price: Float
  +stock: Float
  +minStock: Float
  +unit: String
  +isService: Boolean
  --
  +verificarEstoqueMinimo(): Boolean
  +decrementarEstoque(qty: Float): void
  +incrementarEstoque(qty: Float): void
}

class Appointment {
  +id: String
  +tenantId: String
  +customerId: String
  +vehicleId: String?
  +orderId: String?
  +date: DateTime
  +serviceId: String?
  +notes: String?
  +status: String
  +createdAt: DateTime
  --
  +converterEmOS(): Order
  +cancelar(): void
}

class Employee {
  +id: String
  +tenantId: String
  +name: String
  +role: String
  +phone: String?
  +salary: Float
  +commissionPct: Float
  +isActive: Boolean
  +userId: String?
  +createdAt: DateTime
  --
  +calcularComissao(totalOS: Float): Float
  +desativar(): void
}

class FinancialTransaction {
  +id: String
  +tenantId: String
  +orderId: String?
  +type: String
  +category: String
  +description: String
  +amount: Float
  +status: String
  +paymentMethod: String?
  +paymentDate: DateTime?
  +dueDate: DateTime?
  +notes: String?
  +createdAt: DateTime
}

class InventoryTransaction {
  +id: String
  +tenantId: String
  +productId: String
  +orderId: String?
  +type: String
  +quantity: Float
  +notes: String?
  +createdAt: DateTime
}

class FixedExpense {
  +id: String
  +tenantId: String
  +name: String
  +amount: Float
  +dueDay: Int
  +category: String?
  +isActive: Boolean
  +createdAt: DateTime
  --
  +lancarMensalmente(): FinancialTransaction
}

' Composições (Tenant é raiz de tudo)
Tenant "1" *-- "0..*" User : users
Tenant "1" *-- "0..*" Customer : customers
Tenant "1" *-- "0..*" Vehicle : vehicles
Tenant "1" *-- "0..*" Order : orders
Tenant "1" *-- "0..*" Product : products
Tenant "1" *-- "0..*" Employee : employees
Tenant "1" *-- "0..*" Appointment : appointments
Tenant "1" *-- "0..*" FinancialTransaction : financialTx
Tenant "1" *-- "0..*" InventoryTransaction : inventoryTx
Tenant "1" *-- "0..*" FixedExpense : fixedExpenses

' Associações
Customer "1" -- "0..*" Vehicle : vehicles
Customer "1" -- "0..*" Order : orders
Customer "1" -- "0..*" Appointment : appointments

Vehicle "1" -- "0..*" Order : orders
Vehicle "1" -- "0..*" Appointment : appointments

Order "1" *-- "1..*" OrderItem : items
Order "1" -- "0..1" Appointment : appointment

OrderItem "0..*" -- "0..1" Product : product
Product "1" -- "0..*" InventoryTransaction : inventoryTx

Employee "0..1" -- "0..1" User : user

@enduml
```

---

## 6. Diagrama de Objetos

O diagrama de objetos apresenta uma instância concreta do sistema, representando um cenário real de atendimento: o cliente **João Silva** deixou seu veículo **Honda Civic (ABC-1234)** para uma lavagem completa com cera. Este snapshot representa o momento em que a OS está com status IN_PROGRESS.

> **Justificativa da escolha das classes:** As classes Order, Customer, Vehicle, OrderItem e Product foram selecionadas por constituírem o núcleo transacional do sistema — são as entidades que trocam estado com maior frequência durante a operação diária. O Tenant foi incluído para ilustrar o isolamento multi-tenant. Employee e FinancialTransaction foram omitidos pois ainda não há valores definitivos neste estado (a OS está em andamento, não concluída).

```plantuml
@startuml DiagramaObjetos_WashControl

object "lavaJatoSul : Tenant" as t {
  id = "clx001tenant"
  name = "Lava Jato Sul"
  slug = "lava-jato-sul"
  isActive = true
  saasPlan = "PRO"
  loyaltyInterval = 10
  loyaltyDiscount = 100.0
}

object "joao : Customer" as c {
  id = "clx002customer"
  tenantId = "clx001tenant"
  name = "João Silva"
  phone = "(41) 99999-1234"
  totalWashes = 7
}

object "civic : Vehicle" as v {
  id = "clx003vehicle"
  tenantId = "clx001tenant"
  customerId = "clx002customer"
  plate = "ABC-1234"
  brand = "Honda"
  model = "Civic"
  color = "Prata"
  year = 2021
  type = CAR
}

object "os001 : Order" as o {
  id = "clx004order"
  tenantId = "clx001tenant"
  customerId = "clx002customer"
  vehicleId = "clx003vehicle"
  status = IN_PROGRESS
  total = 120.00
  advancePayment = 0.00
  paymentMethod = null
  startedAt = "2026-04-17 09:30:00"
  finishedAt = null
  completedAt = null
}

object "item1 : OrderItem" as i1 {
  id = "clx005item"
  orderId = "clx004order"
  name = "Lavagem Completa"
  quantity = 1.0
  unitPrice = 80.00
  isService = true
}

object "item2 : OrderItem" as i2 {
  id = "clx006item"
  orderId = "clx004order"
  name = "Cera Automotiva"
  quantity = 1.0
  unitPrice = 40.00
  isService = false
}

object "ceraAutomotiva : Product" as p {
  id = "clx007product"
  tenantId = "clx001tenant"
  name = "Cera Automotiva Carnaúba 500g"
  category = "INSUMO"
  price = 40.00
  stock = 12.0
  minStock = 3.0
  unit = "un"
  isService = false
}

t --> c : possui
t --> v : possui
t --> o : possui
c --> v : tem
c --> o : realiza
v --> o : participa de
o --> i1 : contém
o --> i2 : contém
i2 --> p : referencia

@enduml
```

---

# RA3 — Diagramas Comportamentais

## 7. Diagramas de Sequência

### 7.1 DS-01 — Autenticação e Acesso ao Dashboard

```plantuml
@startuml DS01_Autenticacao

actor Manager
participant "LoginForm\n(Next.js Client)" as UI
participant "Middleware\n(auth)" as MID
participant "NextAuth\nServer Action" as AUTH
database "PostgreSQL" as DB

Manager -> UI : Acessa /login\nInforma e-mail e senha
UI -> AUTH : signIn(email, password)
AUTH -> DB : SELECT User WHERE email = ?

alt Usuário encontrado
  DB --> AUTH : { id, name, email, role, tenantId, password_hash }
  AUTH -> AUTH : bcrypt.compare(password, hash)

  alt Senha correta
    AUTH --> UI : JWT com { id, role, tenantId }
    UI -> MID : GET /dashboard
    MID -> MID : verifica JWT e extrai role/tenantId
    MID --> UI : Acesso permitido — redireciona ao dashboard
    UI --> Manager : Exibe Dashboard com KPIs do tenant
  else Senha incorreta
    AUTH --> UI : Erro: "Credenciais inválidas"
    UI --> Manager : Exibe mensagem de erro
  end

else Usuário não encontrado
  DB --> AUTH : null
  AUTH --> UI : Erro: "Usuário não encontrado"
  UI --> Manager : Exibe mensagem de erro
end

@enduml
```

---

### 7.2 DS-02 — Criar e Concluir Ordem de Serviço

```plantuml
@startuml DS02_CriarConcluirOS

actor Manager
actor Washer
participant "Dashboard\n(Next.js Client)" as UI
participant "Server Action\ncriarOS / atualizarStatus" as SA
participant "Prisma ORM" as ORM
database "PostgreSQL" as DB

== Criação da OS ==

Manager -> UI : Preenche formulário\n(cliente, veículo, itens, obs)
UI -> SA : criarOS(tenantId, customerId, vehicleId, items[])

SA -> ORM : order.create({\n  tenantId, customerId, vehicleId,\n  status: PENDING, total, items\n})
ORM -> DB : INSERT INTO Order\nINSERT INTO OrderItem (N registros)
DB --> ORM : { orderId, status: PENDING }
ORM --> SA : Order criada
SA --> UI : revalidatePath("/dashboard/os")
UI --> Manager : OS aparece no Kanban — coluna PENDING

== Fila de atendimento ==

Manager -> UI : Move OS para WAITING_QUEUE
UI -> SA : atualizarStatus(orderId, "WAITING_QUEUE")
SA -> ORM : order.update({ status: WAITING_QUEUE })
ORM -> DB : UPDATE Order SET status
DB --> ORM : OK
SA --> UI : Cache revalidado
UI --> Manager : OS na coluna WAITING_QUEUE

== Lavador inicia serviço ==

Washer -> UI : Clica "Iniciar" na OS (tela do pátio)
UI -> SA : atualizarStatus(orderId, "IN_PROGRESS")
SA -> ORM : order.update({\n  status: IN_PROGRESS,\n  startedAt: now()\n})
ORM -> DB : UPDATE Order SET status, startedAt
DB --> ORM : OK
SA --> UI : Cache revalidado
UI --> Washer : OS na coluna IN_PROGRESS

== Lavador finaliza serviço ==

Washer -> UI : Clica "Finalizado"
UI -> SA : atualizarStatus(orderId, "READY")
SA -> ORM : order.update({\n  status: READY,\n  finishedAt: now()\n})
ORM -> DB : UPDATE Order
DB --> ORM : OK
SA --> UI : Cache revalidado
UI --> Manager : OS na coluna READY

== Manager conclui e registra pagamento ==

Manager -> UI : Clica "Concluir" +\nconfirma método de pagamento
UI -> SA : concluirOS(orderId, paymentMethod, total)

SA -> ORM : order.update({\n  status: COMPLETED,\n  completedAt: now(),\n  paymentMethod\n})
ORM -> DB : UPDATE Order

SA -> ORM : financialTransaction.create({\n  type: "INCOME",\n  amount: total,\n  orderId\n})
ORM -> DB : INSERT FinancialTransaction

loop Para cada OrderItem com isService = false
  SA -> ORM : inventoryTransaction.create({\n    type: "OUT", productId, qty\n  })
  ORM -> DB : INSERT InventoryTransaction
  SA -> ORM : product.update({\n    stock: stock - qty\n  })
  ORM -> DB : UPDATE Product.stock
end

SA -> ORM : customer.update({\n  totalWashes: totalWashes + 1\n})
ORM -> DB : UPDATE Customer

DB --> ORM : Todos os registros confirmados
ORM --> SA : Sucesso
SA --> UI : revalidatePath("/dashboard/os")
UI --> Manager : OS movida para COMPLETED

@enduml
```

---

### 7.3 DS-03 — Criar Agendamento e Converter em OS

```plantuml
@startuml DS03_Agendamento

actor Manager

participant "Dashboard\n(Next.js Client)" as UI
participant "Server Action\nagendamentos" as SA
participant "Prisma ORM" as ORM
database "PostgreSQL" as DB

== Criação do Agendamento ==

Manager -> UI : Acessa /dashboard/agendamentos\ne clica "Novo Agendamento"
UI --> Manager : Exibe formulário (data, cliente, veículo, serviço)

Manager -> UI : Preenche e confirma
UI -> SA : criarAgendamento(tenantId, customerId, vehicleId, date, notes)

SA -> ORM : appointment.findMany({\n  tenantId, date: { range }\n})
ORM -> DB : SELECT conflitos de horário
DB --> ORM : []  (horário disponível)

SA -> ORM : appointment.create({\n  tenantId, customerId, vehicleId,\n  date, status: "SCHEDULED"\n})
ORM -> DB : INSERT Appointment
DB --> ORM : { appointmentId, status: SCHEDULED }
ORM --> SA : Appointment criado
SA --> UI : Sucesso + revalidatePath
UI --> Manager : Agendamento aparece no calendário

== Conversão em OS (dia do atendimento) ==

Manager -> UI : Localiza agendamento no calendário\ne clica "Converter em OS"
UI -> SA : converterAgendamentoEmOS(appointmentId, tenantId)

SA -> ORM : appointment.findUnique(appointmentId)
ORM -> DB : SELECT Appointment
DB --> ORM : { customerId, vehicleId, orderId: null }

alt orderId == null (ainda sem OS)
  SA -> ORM : order.create({\n    tenantId, customerId, vehicleId,\n    status: PENDING\n  })
  ORM -> DB : INSERT Order
  DB --> ORM : { orderId }

  SA -> ORM : appointment.update({\n    orderId: orderId,\n    status: "COMPLETED"\n  })
  ORM -> DB : UPDATE Appointment
  DB --> ORM : OK
  ORM --> SA : Sucesso
  SA --> UI : Redireciona para /dashboard/os com OS em PENDING
  UI --> Manager : OS criada e exibida no Kanban

else orderId != null (OS já existe — idempotência)
  SA --> UI : Erro: "Este agendamento já possui uma OS"
  UI --> Manager : Exibe alerta com link para a OS existente
end

@enduml
```

---

### 7.4 DS-04 — Baixa Automática de Estoque ao Concluir OS

```plantuml
@startuml DS04_BaixaEstoque

actor Manager
participant "Dashboard\n(Next.js Client)" as UI
participant "Server Action\nconcluirOS" as SA
participant "Prisma ORM" as ORM
database "PostgreSQL" as DB

Manager -> UI : Confirma conclusão da OS\n(método de pagamento informado)
UI -> SA : concluirOS(orderId, tenantId, paymentMethod)

SA -> ORM : orderItem.findMany({\n  orderId,\n  where: { isService: false }\n})
ORM -> DB : SELECT OrderItem WHERE orderId AND isService = false
DB --> ORM : [ {productId, quantity}, ... ]

loop Para cada insumo na OS
  SA -> ORM : product.findUnique({ id: productId, tenantId })
  ORM -> DB : SELECT Product
  DB --> ORM : { id, stock, minStock }

  alt stock >= quantity (estoque suficiente)
    SA -> ORM : inventoryTransaction.create({\n      type: "OUT",\n      productId, orderId,\n      quantity\n    })
    ORM -> DB : INSERT InventoryTransaction

    SA -> ORM : product.update({\n      stock: stock - quantity\n    })
    ORM -> DB : UPDATE Product SET stock

    DB --> ORM : OK

    opt novo stock < minStock
      SA --> UI : Alerta: "Estoque mínimo atingido: [produto]"
      UI --> Manager : Notificação de estoque baixo
    end

  else stock < quantity (estoque insuficiente)
    SA --> UI : Aviso: "Estoque insuficiente para [produto].\nA OS será concluída, mas o estoque ficará negativo."
    SA -> ORM : product.update({ stock: stock - quantity })
    ORM -> DB : UPDATE Product SET stock (valor negativo registrado)
    DB --> ORM : OK
  end
end

SA --> UI : Baixas de estoque concluídas
UI --> Manager : OS marcada como COMPLETED

@enduml
```

---

### 7.5 DS-05 — Visualização do Relatório Financeiro (DRE)

```plantuml
@startuml DS05_Financeiro

actor Manager
participant "ClientFinanceiro\n(Next.js Client)" as UI
participant "Server Component\npage.tsx" as SC
participant "Server Action\nfinance" as SA
participant "Prisma ORM" as ORM
database "PostgreSQL" as DB

Manager -> SC : GET /dashboard/financeiro\n?mes=4&ano=2026

SC -> SA : getDadosFinanceiros(tenantId, mes, ano)

SA -> ORM : financialTransaction.findMany({\n  tenantId,\n  type: "INCOME",\n  createdAt: { range do mês }\n})
ORM -> DB : SELECT receitas do período
DB --> ORM : [ FinancialTransaction[] ]

SA -> ORM : financialTransaction.findMany({\n  tenantId,\n  type: "EXPENSE",\n  createdAt: { range do mês }\n})
ORM -> DB : SELECT despesas do período
DB --> ORM : [ FinancialTransaction[] ]

SA -> ORM : fixedExpense.findMany({\n  tenantId,\n  isActive: true\n})
ORM -> DB : SELECT despesas fixas ativas
DB --> ORM : [ FixedExpense[] ]

SA -> SA : calcularDRE(receitas, despesas, fixas)\n→ { totalReceitas, totalDespesas,\n     lucroLiquido, margemPct }

SA --> SC : { kpis, transacoes[], dre }
SC --> UI : Renderiza página com dados do servidor
UI --> Manager : Exibe KPIs, gráfico de barras (receitas × despesas),\ntabela de transações e DRE do mês

opt Manager altera período
  Manager -> UI : Seleciona novo mês/ano
  UI -> SA : getDadosFinanceiros(tenantId, novoMes, novoAno)
  note right: Reexecuta fluxo acima
end

@enduml
```

---

## 8. Diagramas de Atividades

### 8.1 DA-01 — Fluxo Completo de Atendimento (Ciclo da OS)

```plantuml
@startuml DA01_FluxoOS

|Manager|
start
:Recebe veículo do cliente;
:Busca/cadastra cliente no sistema;
:Seleciona veículo do cliente;
:Adiciona itens à OS\n(serviços + insumos);
:Confirma criação da OS\n(status: PENDING);

|Sistema|
:Persiste OS no banco;
:Exibe OS na coluna PENDING do Kanban;

|Manager|
:Move OS para WAITING_QUEUE\n(veículo aguarda na fila);

|Washer|
:Visualiza OSs em WAITING_QUEUE\nno painel do pátio;
:Seleciona OS e clica "Iniciar";

|Sistema|
:Atualiza status para IN_PROGRESS;
:Registra startedAt = now();

|Washer|
:Executa os serviços no veículo;
:Clica "Finalizado";

|Sistema|
:Atualiza status para READY;
:Registra finishedAt = now();

|Manager|
:Notifica cliente que o veículo está pronto;
:Recebe pagamento;

fork
  |Manager|
  :Registra método de pagamento;
fork again
  |Sistema|
  :Dispara notificação ao cliente\n(WhatsApp / Push);
end fork

|Manager|
:Confirma conclusão da OS;

|Sistema|
:Atualiza status para COMPLETED;
:Registra completedAt = now();

fork
  :Cria FinancialTransaction\n(INCOME) automaticamente;
fork again
  :Baixa estoque dos insumos\n(InventoryTransaction OUT);
fork again
  :Incrementa Customer.totalWashes;
end fork

if (totalWashes % loyaltyInterval == 0?) then (Sim)
  :Aplica desconto de fidelidade\nna próxima OS;
else (Não)
  :Sem ação adicional;
endif

:Calcula comissão do funcionário;

|Manager|
:OS aparece no histórico\ncom status COMPLETED;
stop

@enduml
```

---

### 8.2 DA-02 — Fluxo de Agendamento

```plantuml
@startuml DA02_Agendamento

start

:Manager cria agendamento\n(data, cliente, veículo, serviço);

|Sistema|
:Verifica disponibilidade do horário;

if (Horário disponível?) then (Sim)
  :Salva Appointment\nstatus: SCHEDULED;

  fork
    :Exibe no calendário do sistema;
  fork again
    :Envia lembrete ao cliente\n(futuro — RF09);
  end fork

  :Data do agendamento chega;

  |Manager|
  if (Cliente comparece?) then (Sim)
    :Clica "Converter em OS";

    |Sistema|
    :Verifica se já existe OS\nvinculada ao agendamento;

    if (orderId == null?) then (Sim — primeiro acesso)
      :Cria Order com dados\ndo agendamento (PENDING);
      :Vincula orderId ao Appointment;
      :Atualiza Appointment → COMPLETED;
      :Redireciona para Kanban;
    else (Não — OS já existe)
      :Bloqueia criação duplicada\n(idempotência);
      :Exibe link para OS existente;
    endif

  else (Não comparece)
    |Manager|
    :Cancela agendamento;
    |Sistema|
    :Atualiza Appointment → CANCELED;
  endif

else (Horário ocupado)
  :Exibe aviso de conflito\nde horário;
  :Retorna ao formulário\npara nova seleção;
endif

stop

@enduml
```

---

### 8.3 DA-03 — Cálculo de Fidelidade e Desconto

```plantuml
@startuml DA03_Fidelidade

start

:OS é concluída\n(status → COMPLETED);

|Sistema|
:Incrementa Customer.totalWashes\n(totalWashes + 1);

:Consulta configuração do tenant:\n- loyaltyInterval (N lavagens)\n- loyaltyDiscount (% desconto);

if (totalWashes % loyaltyInterval == 0?) then (Sim)
  :Cliente atingiu marco de fidelidade;

  fork
    :Registra desconto disponível\npara próxima OS;
  fork again
    :Notifica cliente sobre\nbônus conquistado\n(RF09 — futuro);
  end fork

  if (loyaltyDiscount == 100?) then (Lavagem grátis)
    :Próxima OS com\nvalor total = R$ 0,00;
  else (Desconto percentual)
    :Próxima OS com\ndesconto de {loyaltyDiscount}% no total;
  endif

else (Não)
  :Nenhuma ação de fidelidade;
  :Exibe progresso:\n"{totalWashes} de {loyaltyInterval} lavagens";
endif

stop

@enduml
```

---

### 8.4 DA-04 — Lançamento de Despesa Fixa Mensal

```plantuml
@startuml DA04_DespesaFixa

start

:Sistema verifica data atual;
:Consulta FixedExpenses ativas\nonde dueDay == dia_atual;

if (Existem despesas a lançar?) then (Sim)
  :Inicia processamento em lote;

  fork
    repeat
      :Seleciona próxima FixedExpense;

      :Verifica se já foi lançada\nneste mês\n(via notes de idempotência);

      if (Já lançada no mês atual?) then (Sim)
        :Ignora — evita duplicidade;
      else (Não)
        :Cria FinancialTransaction:\n- type: EXPENSE\n- category: DESPESA_FIXA\n- amount: fixedExpense.amount\n- dueDate: hoje;
        :Persiste no banco;
      endif
    repeat while (Há mais despesas?) is (Sim)
    ->Não;
  end fork

  :Notifica Manager sobre\ndespesas lançadas (opcional);
else (Não há despesas para hoje)
  :Nenhuma ação necessária;
endif

stop

@enduml
```

---

## 9. Diagramas de Máquina de Estados

### 9.1 DME-01 — Ciclo de Vida da Ordem de Serviço

```plantuml
@startuml DME01_EstadosOS

[*] --> PENDING : criarOS()\n[cliente + veículo válidos]

state PENDING {
  entry: registrar createdAt = now()
  exit: validar itens da OS (mínimo 1)
}

PENDING --> WAITING_QUEUE : confirmarEntrada()\n[OS possui ≥ 1 item]
PENDING --> CANCELED : cancelar()\n[apenas MANAGER]

state WAITING_QUEUE {
  entry: notificar pátio sobre novo veículo
  exit: registrar posição na fila
}

WAITING_QUEUE --> IN_PROGRESS : iniciarAtendimento()\n[WASHER ou MANAGER]
WAITING_QUEUE --> CANCELED : cancelar()\n[apenas MANAGER]

state IN_PROGRESS {
  entry: startedAt = now()
  exit: finishedAt = now()
}

IN_PROGRESS --> READY : concluirServico()\n[WASHER ou MANAGER]
IN_PROGRESS --> CANCELED : cancelar()\n[apenas MANAGER]

state READY {
  entry: notificar cliente via RF09
  exit: validar método de pagamento informado
}

READY --> COMPLETED : registrarPagamento(paymentMethod)\n[pagamento confirmado]
READY --> IN_PROGRESS : solicitarRetrabalho()\n[apenas MANAGER]

state COMPLETED {
  entry: completedAt = now()
  entry: criarFinancialTransaction(INCOME)
  entry: baixarEstoque(itens OUT)
  entry: incrementarTotalWashes()
  entry: calcularComissaoFuncionario()
}

COMPLETED --> [*]
CANCELED --> [*]

note right of COMPLETED
  Ações automáticas de entrada:
  1. FinancialTransaction (INCOME)
  2. InventoryTransaction (OUT) × N insumos
  3. Customer.totalWashes++
  4. Verificar fidelidade
  5. Calcular comissão
end note

@enduml
```

---

### 9.2 DME-02 — Ciclo de Vida do Agendamento

```plantuml
@startuml DME02_EstadosAppointment

[*] --> SCHEDULED : criarAgendamento()\n[horário disponível]

state SCHEDULED {
  entry: salvar data e hora do agendamento
  entry: enviar confirmação ao cliente (RF09)
  exit: verificar orderId == null (idempotência)
}

SCHEDULED --> COMPLETED : converterEmOS()\n[cliente compareceu]\n/ vincular orderId à OS criada
SCHEDULED --> CANCELED : cancelarAgendamento()\n[Manager ou Cliente]
SCHEDULED --> CANCELED : naoComparecimento()\n[Manager registra ausência]

state COMPLETED {
  entry: orderId = novaOS.id
  entry: registrar que agendamento foi atendido
}

state CANCELED {
  entry: liberar slot de horário na agenda
  entry: notificar cliente do cancelamento (RF09)
}

COMPLETED --> [*]
CANCELED --> [*]

note right of SCHEDULED
  Guarda de idempotência:
  [orderId == null] → pode converter em OS
  [orderId != null] → bloqueado (OS já existe)
end note

@enduml
```

---

# Protótipo

## Diagrama de Navegação de Telas

O WashControl é um sistema web implementado com Next.js 15 (App Router). As telas foram desenvolvidas e funcionais, servindo como protótipo de alta fidelidade.

```plantuml
@startuml NavegacaoTelas

state "/login" as Login {
  : Formulário de e-mail e senha
}

state "/dashboard" as Dashboard {
  : KPIs (receita, OSs, meta mensal)
  : Gráfico receitas vs despesas
  : OSs recentes
}

state "/dashboard/os" as OS {
  : Board Kanban (PENDING | WAITING_QUEUE\n| IN_PROGRESS | READY | COMPLETED)
  : Modal "Nova OS"
  : Modal "Concluir OS"
}

state "/dashboard/patio" as Patio {
  : Cards de veículos em atendimento
  : Botões Iniciar / Finalizar (Washer)
}

state "/dashboard/clientes" as Clientes {
  : Listagem de clientes
  : Cadastro/edição de cliente
  : Veículos vinculados
  : Histórico de OSs
}

state "/dashboard/agendamentos" as Agendamentos {
  : Calendário de agendamentos
  : Formulário novo agendamento
  : Botão "Converter em OS"
}

state "/dashboard/financeiro" as Financeiro {
  : DRE mensal
  : Fluxo de caixa
  : Tabela de transações
  : Lançamento manual de despesa
}

state "/dashboard/insumos" as Insumos {
  : Catálogo de produtos/insumos
  : Controle de estoque
  : Histórico de movimentações
}

state "/dashboard/equipe" as Equipe {
  : Listagem de funcionários
  : Cadastro/edição
  : Relatório de comissões
}

state "/dashboard/lavacarros" as Lavacarros {
  : Catálogo de serviços
  : Tabela de preços
}

state "/dashboard/configuracoes" as Config {
  : Dados do tenant
  : Configuração de fidelidade
  : Plano SaaS atual
}

[*] --> Login
Login --> Dashboard : autenticação bem-sucedida

Dashboard --> OS
Dashboard --> Patio
Dashboard --> Clientes
Dashboard --> Agendamentos
Dashboard --> Financeiro
Dashboard --> Insumos
Dashboard --> Equipe
Dashboard --> Lavacarros
Dashboard --> Config

OS --> Agendamentos : converter agendamento
Agendamentos --> OS : OS criada
OS --> Financeiro : OS concluída → lança receita
OS --> Insumos : OS concluída → baixa estoque

@enduml
```

## Telas Principais

O sistema possui protótipo de alta fidelidade implementado e funcional. As principais telas e seus objetivos:

| Tela | Descrição | Ator Principal |
|---|---|---|
| **Login** | Autenticação com e-mail e senha, redirecionamento por papel | Manager / Washer / SuperAdmin |
| **Dashboard** | KPIs: receita do dia/mês, OSs em andamento, meta mensal, gráfico receitas × despesas | Manager |
| **OS — Kanban** | Board com 5 colunas de status, drag-and-drop de cards, modal de criação e conclusão de OS | Manager |
| **Pátio** | Visão simplificada dos veículos em atendimento, botões de ação para o Washer | Washer |
| **Clientes** | CRUD de clientes, veículos vinculados, histórico de lavagens, programa de fidelidade | Manager |
| **Agendamentos** | Calendário mensal, formulário de novo agendamento, conversão em OS | Manager |
| **Financeiro** | DRE mensal, fluxo de caixa, listagem de transações com filtros | Manager |
| **Insumos** | Catálogo de produtos com estoque, alertas de mínimo, histórico de movimentações | Manager |
| **Equipe** | Cadastro de funcionários, vinculação com usuário do sistema, comissões | Manager |
| **Configurações** | Dados do tenant, configuração de fidelidade, plano SaaS | Manager |

---

# Criatividade

Os itens abaixo foram identificados pela equipe como contribuições criativas (inovação) — itens não solicitados explicitamente pelo enunciado que tornam o trabalho superior:

## Criatividade no Projeto (Documento)

1. **Sistema real implementado como protótipo de alta fidelidade:** Em vez de um protótipo estático no Figma, o WashControl foi desenvolvido como uma aplicação funcional em Next.js 15, com banco de dados real (PostgreSQL), autenticação e Server Actions — tornando o protótipo interativo e demonstrável.

2. **Programa de fidelidade parametrizável:** A modelagem incluiu campos `loyaltyInterval` e `loyaltyDiscount` no `Tenant`, permitindo que cada lava-car configure seu próprio programa de fidelidade (a cada N lavagens, X% de desconto) — um diferencial competitivo não previsto nos requisitos originais.

3. **Técnicas de Elicitação documentadas com rastreabilidade:** Cada técnica (Entrevista, Observação, Questionário, Brainstorming, JAD) foi documentada com stakeholder-alvo, roteiro aplicado, limitações encontradas e mapeamento direto para os RFs/RNFs resultantes — vai além da simples listagem de técnicas.

4. **Diagrama de Objetos com cenário real e justificativa:** O diagrama de objetos apresenta uma instância concreta de atendimento em andamento, com valores reais e justificativa da escolha das classes representadas.

5. **Idempotência modelada explicitamente:** A restrição `Appointment.orderId @unique` foi especificada como regra de negócio (RN-03) e representada em fluxos alternativos/exceções das especificações de caso de uso e no diagrama de estados do Appointment.

## Criatividade no Produto

6. **Arquitetura multi-tenant real:** O isolamento de dados entre tenants é garantido em nível de banco de dados pelo campo `tenantId` obrigatório em todas as tabelas — não é um isolamento lógico por aplicação, mas estrutural.

7. **Automações em cascata ao concluir OS:** Ao marcar uma OS como COMPLETED, 5 ações são executadas automaticamente em uma única transação: receita financeira, baixa de estoque, contagem de fidelidade, cálculo de comissão e verificação de desconto — modelado e implementado.

8. **Módulo de faturamento SaaS (B2B):** Além do sistema para o lava-car, existe um módulo de faturamento para o Super Admin gerenciar os planos e cobranças dos tenants — tornando o WashControl um produto SaaS completo (produto + plataforma).

---

# Responsabilidades

Todos os integrantes da equipe devem assinar e datar o documento de Análise e Projeto do Sistema Computacional.

| Integrante | RA | Assinatura | Data |
|---|---|---|---|
| Leonardo dos Santos Marques | — | _________________________ | 17/04/2026 |

---

*Documento elaborado para a disciplina de Modelagem de Sistemas Computacionais — BCC/PUCPR*
*Professora: Patricia Rucker de Bassi*
*Sistema: WashControl — Sistema SaaS de Gestão para Lava-Cars*
