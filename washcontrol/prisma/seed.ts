import { config } from 'dotenv';
config({ path: '.env' }); 

import { PrismaClient, UserRole, OrderStatus, VehicleType } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

// Necessário para o Node.js usar a conexão nativa do Neon via WebSocket
neonConfig.webSocketConstructor = global.WebSocket;

// ============================================================================
// MOTORES DE DADOS E INTELIGÊNCIA ARTIFICIAL DO SEED
// ============================================================================

// Definindo o período exato (1 ano para preencher os gráficos do Dashboard)
const START_DATE = new Date('2025-03-16T00:00:00Z');
const END_DATE = new Date('2026-03-16T23:59:59Z');

// Helpers de tempo e aleatoriedade
const getRandomDate = () => new Date(START_DATE.getTime() + Math.random() * (END_DATE.getTime() - START_DATE.getTime()));
const addHours = (date: Date, hours: number) => new Date(date.getTime() + hours * 60 * 60 * 1000);
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (array: any[]) => array[getRandomInt(0, array.length - 1)];

// Dicionários para Combinatória
const nomes = ['Carlos', 'Mariana', 'Roberto', 'Fernanda', 'Lucas', 'Juliana', 'Thiago', 'Patrícia', 'André', 'Camila', 'Marcos', 'Aline', 'João', 'Letícia', 'Felipe', 'Beatriz', 'Diego', 'Vanessa', 'Ricardo', 'Amanda', 'Leandro', 'Bruna'];
const sobrenomes = ['Silva', 'Costa', 'Almeida', 'Santos', 'Oliveira', 'Rocha', 'Mendes', 'Farias', 'Souza', 'Lima', 'Gomes', 'Ferreira', 'Rodrigues', 'Carvalho', 'Martins', 'Araújo', 'Ribeiro'];

const carros = [
  { b: 'Fiat', m: ['Uno', 'Mobi', 'Argo', 'Toro', 'Strada', 'Pulse'], t: VehicleType.CAR },
  { b: 'Volkswagen', m: ['Gol', 'Polo', 'Nivus', 'T-Cross', 'Amarok'], t: VehicleType.CAR },
  { b: 'Chevrolet', m: ['Onix', 'Tracker', 'S10', 'Cruze', 'Montana'], t: VehicleType.CAR },
  { b: 'Hyundai', m: ['HB20', 'Creta', 'Tucson'], t: VehicleType.CAR },
  { b: 'Toyota', m: ['Corolla', 'Hilux', 'Yaris', 'SW4'], t: VehicleType.SUV },
  { b: 'Jeep', m: ['Renegade', 'Compass', 'Commander'], t: VehicleType.SUV },
  { b: 'Honda', m: ['Civic', 'HR-V', 'City', 'Fit', 'CG 160 Titan', 'Biz 125'], t: VehicleType.CAR }, 
  { b: 'Yamaha', m: ['Fazer 250', 'MT-03', 'NMAX', 'Crosser'], t: VehicleType.MOTORCYCLE },
  { b: 'Ford', m: ['Ranger', 'Transit'], t: VehicleType.TRUCK }
];

const notasCliente = [
  'Carro muito sujo de barro por causa do sítio.', 'Pediu capricho nas rodas e caixas de ar.', 'Lavar rápido, cliente tem viagem agendada.',
  'Caiu resina de árvore no capô.', 'Derramou leite no banco traseiro (focar na higienização).', 'Apenas poeira do dia a dia.',
  'Cachorro andou no carro, tirar todos os pelos.', 'Polimento nos faróis que estão amarelados.', 'Dono muito exigente com os vidros por dentro.'
];

const despesasTitulos = ['Conta de Água (Sanepar/Sabesp)', 'Conta de Energia', 'Internet Fibra', 'Compra de Produtos (Distribuidora)', 'Manutenção da Wap/Compressor', 'Marketing (Meta Ads)', 'Impostos (DAS)'];

async function main() {
  console.log('⏳ Verificando Variáveis de Ambiente...');
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) throw new Error("❌ ERRO: DATABASE_URL não foi encontrada. Verifique o .env");

  // AQUI ESTÁ A CORREÇÃO: Passando o Adapter obrigatório
  console.log('🔗 Configurando conexão serverless com o Neon...');
  const neonPool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaNeon(neonPool);
  const prisma = new PrismaClient({ adapter });

  console.log('🚀 INICIANDO A SUPER SEMEADURA WASHCONTROL (1 ANO DE DADOS)...');

  const tenantId = 'cmmwashcontrol0001master';
  const hashedPassword = await bcrypt.hash('123456', 10);

  // ============================================================================
  // 1. LIMPEZA SEGURA DO BANCO (ORFANATOS)
  // ============================================================================
  console.log('🧹 [1/8] Limpando o pátio (Destruindo dados antigos)...');
  await prisma.orderItem.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.financialTransaction.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.fixedExpense.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // ============================================================================
  // 2. CRIAÇÃO DO TENANT E USUÁRIOS BÁSICOS
  // ============================================================================
  console.log('🏢 [2/8] Inaugurando Lava-Jato e criando Acessos...');
  
  // Super Admin
  await prisma.user.create({
    data: { name: 'Admin do SaaS', email: 'admin@saas.com', password: hashedPassword, role: 'SUPER_ADMIN' },
  });

  // O Lava-Jato principal
  const tenant = await prisma.tenant.create({
    data: {
      id: tenantId,
      name: 'Acqua Premium Estética Automotiva',
      slug: 'acqua-premium',
      saasPlan: 'PRO',
      isActive: true,
      monthlyGoal: 35000.0,
      users: {
        create: { name: 'Carlos Gerente', email: 'dono@acquapremium.com', password: hashedPassword, role: 'MANAGER' },
      },
    },
  });

  // ============================================================================
  // 3. EQUIPE DE FUNCIONÁRIOS (LAVADORES)
  // ============================================================================
  console.log('🧽 [3/8] Contratando Equipe Especializada...');
  const nomesLavadores = ['João Silva', 'Marcos Alves', 'Diego Costa', 'Felipe Santos'];
  const dbEmployees = [];
  
  for (let i = 0; i < nomesLavadores.length; i++) {
    const userWasher = await prisma.user.create({
      data: {
        tenantId,
        name: nomesLavadores[i],
        email: `lavador${i+1}@acquapremium.com`,
        password: hashedPassword,
        role: 'WASHER',
        employee: {
          create: {
            tenantId,
            name: nomesLavadores[i],
            role: i === 0 ? 'POLIDOR_CHEFE' : 'WASHER',
            salary: 1500 + (i * 200),
            commissionPct: 15, // 15% de comissão
          }
        }
      },
      include: { employee: true }
    });
    if(userWasher.employee) dbEmployees.push(userWasher.employee);
  }

  // ============================================================================
  // 4. CATÁLOGO DE SERVIÇOS E PRODUTOS (ESTOQUE)
  // ============================================================================
  console.log('📦 [4/8] Cadastrando Tabela de Preços e Abastecendo o Estoque...');
  const catProdutos = [
    { n: 'Lavagem Simples', c: 'LAVAGEM', p: 50, s: true, st: 0 },
    { n: 'Lavagem Completa (Cera)', c: 'LAVAGEM', p: 80, s: true, st: 0 },
    { n: 'Lavagem de Moto', c: 'LAVAGEM', p: 40, s: true, st: 0 },
    { n: 'Lavagem Caminhonete/SUV', c: 'LAVAGEM', p: 100, s: true, st: 0 },
    { n: 'Higienização Interna', c: 'ESTETICA', p: 250, s: true, st: 0 },
    { n: 'Polimento Comercial', c: 'ESTETICA', p: 350, s: true, st: 0 },
    { n: 'Vitrificação de Pintura', c: 'ESTETICA', p: 800, s: true, st: 0 },
    
    // Insumos físicos que saem do estoque
    { n: 'Cera de Carnaúba (Aplicação)', c: 'INSUMO', p: 20, s: false, st: 500 },
    { n: 'Shampoo Desincrustante (Dose)', c: 'INSUMO', p: 5, s: false, st: 2000 },
    { n: 'Pretinho Pneu Premium (Dose)', c: 'INSUMO', p: 3, s: false, st: 2000 },
    { n: 'Aromatizante Little Trees', c: 'PRODUTO_REVENDA', p: 15, s: false, st: 200 },
    { n: 'Palheta Limpador Parabrisa (Par)', c: 'PRODUTO_REVENDA', p: 60, s: false, st: 50 },
  ];

  const dbProducts = [];
  for (const p of catProdutos) {
    const prod = await prisma.product.create({
      data: { name: p.n, category: p.c, price: p.p, isService: p.s, stock: p.st, minStock: p.s ? 0 : 20, tenantId }
    });
    dbProducts.push(prod);
    
    // Gera histórico de compra para os insumos
    if (!p.s) {
      await prisma.inventoryTransaction.create({
        data: { type: 'IN', quantity: p.st, notes: 'Compra de Lote Anual (Setup Inicial)', productId: prod.id, tenantId, createdAt: START_DATE }
      });
    }
  }

  // Separando arrays para facilitar a montagem da OS
  const dbServices = dbProducts.filter(p => p.isService);
  const dbInsumos = dbProducts.filter(p => !p.isService);

  // ============================================================================
  // 5. GERAÇÃO DE 80 CLIENTES E VEÍCULOS (ALGORÍTMICO)
  // ============================================================================
  console.log('👥 [5/8] Gerando 80 Clientes Fiéis e suas frotas...');
  const dbCustomers = [];
  for (let i = 0; i < 80; i++) {
    const nomeCompleto = `${getRandomItem(nomes)} ${getRandomItem(sobrenomes)}`.trim();
    const vCount = getRandomInt(1, 2); // 1 a 2 carros por cliente
    const veiculosDoCliente = [];
    
    for(let j=0; j<vCount; j++) {
      const marca = getRandomItem(carros);
      const isMoto = marca.b === 'Yamaha' || marca.m.includes('Titan');
      
      veiculosDoCliente.push({
        tenantId,
        plate: `${String.fromCharCode(65 + getRandomInt(0,25))}${String.fromCharCode(65 + getRandomInt(0,25))}${String.fromCharCode(65 + getRandomInt(0,25))}${getRandomInt(1000, 9999)}`,
        brand: marca.b,
        model: getRandomItem(marca.m),
        color: getRandomItem(['Preto', 'Branco', 'Prata', 'Vermelho', 'Cinza']),
        year: getRandomInt(2010, 2024),
        type: isMoto ? VehicleType.MOTORCYCLE : marca.t,
      });
    }

    const cust = await prisma.customer.create({
      data: {
        name: nomeCompleto, phone: '419' + getRandomInt(10000000, 99999999), tenantId,
        vehicles: { create: veiculosDoCliente }
      },
      include: { vehicles: true }
    });
    dbCustomers.push(cust);
  }

  // ============================================================================
  // 6. MOTOR DO TEMPO: 700 LAVAGENS (ORDENS DE SERVIÇO) NO ANO
  // ============================================================================
  console.log('🕰️ [6/8] O Motor do Tempo foi ativado! Realizando 700 lavagens (Aguarde alguns segundos)...');
  let incomeAcumulado = 0;

  for (let i = 1; i <= 700; i++) {
    const isCanceled = i % 25 === 0; // 4% de chance de cancelamento
    const osDate = getRandomDate();
    const cust = getRandomItem(dbCustomers);
    const veh = getRandomItem(cust.vehicles);
    
    // Escolher Serviços e Produtos
    const items = [];
    let orderTotal = 0;
    
    // Força o tipo de lavagem baseado no tipo do veículo
    let svcBase;
    if (veh.type === 'MOTORCYCLE') svcBase = dbServices.find(s => s.name.includes('Moto'));
    else if (veh.type === 'SUV' || veh.type === 'TRUCK') svcBase = dbServices.find(s => s.name.includes('SUV'));
    else svcBase = dbServices.find(s => s.name.includes(getRandomItem(['Simples', 'Completa'])));
    
    if(!svcBase) svcBase = dbServices[0]; // fallback

    items.push({ name: svcBase.name, isService: true, productId: svcBase.id, quantity: 1, unitPrice: svcBase.price });
    orderTotal += svcBase.price;

    // Adiciona venda adicional (Cera, Pretinho, Aromatizante) 40% das vezes
    if (getRandomInt(1, 100) > 60) {
      const insumo = getRandomItem(dbInsumos);
      items.push({ name: insumo.name, isService: false, productId: insumo.id, quantity: 1, unitPrice: insumo.price });
      orderTotal += insumo.price;
    }

    // REGRA 4 - FIDELIDADE: Checar se é a 10ª lavagem e dar 100% de desconto
    let finalTotal = orderTotal;
    let fidelityNotes = '';
    
    // Atualiza contador de lavagens do cliente de forma artificial
    cust.totalWashes += 1;
    if (!isCanceled && cust.totalWashes % 10 === 0) {
      finalTotal = 0;
      fidelityNotes = '🎉 [CORTESIA] 10ª Lavagem Grátis (Programa de Fidelidade)!';
    }

    const finalStatus = isCanceled ? 'CANCELED' : 'COMPLETED';

    // Cria OS
    const os = await prisma.order.create({
      data: {
        tenantId, customerId: cust.id, vehicleId: veh.id,
        status: finalStatus,
        total: finalTotal,
        paymentMethod: finalTotal > 0 ? getRandomItem(['PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO']) : null,
        startedAt: addHours(osDate, 1), finishedAt: addHours(osDate, 2), completedAt: addHours(osDate, 2.5),
        notes: fidelityNotes || getRandomItem(notasCliente),
        createdAt: osDate, updatedAt: osDate,
        items: {
          create: items.map(it => ({ ...it, tenantId, orderId: undefined }))
        }
      }
    });

    if (!isCanceled) {
      incomeAcumulado += finalTotal;
      
      // Salva totalWashes real no banco
      await prisma.customer.update({ where: { id: cust.id }, data: { totalWashes: cust.totalWashes } });

      // Transação Financeira
      if (finalTotal > 0) {
        await prisma.financialTransaction.create({
          data: {
            tenantId, orderId: os.id,
            type: 'INCOME', category: 'SERVICO_LAVAGEM', description: `Lavagem Placa: ${veh.plate}`, amount: finalTotal,
            status: 'PAID', paymentMethod: os.paymentMethod, paymentDate: osDate, dueDate: osDate, createdAt: osDate
          }
        });
      }

      // Baixa de Insumos
      for(const item of items) {
        if(!item.isService && item.productId) {
          await prisma.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
          await prisma.inventoryTransaction.create({
            data: { tenantId, type: 'OUT', quantity: item.quantity, notes: `Usado na OS do veículo ${veh.plate}`, productId: item.productId, orderId: os.id, createdAt: osDate }
          });
        }
      }
    }
  }

  // ============================================================================
  // 7. DESPESAS E CUSTOS PARA O DRE
  // ============================================================================
  console.log('💸 [7/8] Pagando as contas de Água, Luz e Produtos do ano...');
  
  await prisma.fixedExpense.createMany({
    data: [
      { name: 'Aluguel do Barracão', amount: 3500.00, dueDay: 10, category: 'INFRAESTRUTURA', tenantId },
      { name: 'Assinatura WashControl', amount: 150.00, dueDay: 5, category: 'SISTEMA', tenantId },
    ]
  });

  const despesasData = [];
  for (let i = 0; i < 200; i++) {
    const expDate = getRandomDate();
    despesasData.push({
      tenantId, type: 'EXPENSE', category: 'DESPESA_FIXA',
      description: getRandomItem(despesasTitulos),
      amount: getRandomInt(80, 800),
      status: 'PAID', paymentDate: expDate, dueDate: expDate, createdAt: expDate
    });
  }
  await prisma.financialTransaction.createMany({ data: despesasData });

  // ============================================================================
  // 8. POPULANDO O PÁTIO/KANBAN (A MÁGICA DE HOJE)
  // ============================================================================
  console.log('🚧 [8/8] Colocando 12 carros no Pátio (Kanban) para trabalho imediato...');
  
  const NOW = new Date('2026-03-27T10:00:00Z'); 
  
  const createKanbanCard = async (status: any, hrsAgo: number, isVip: boolean = false) => {
    const cust = getRandomItem(dbCustomers);
    const veh = getRandomItem(cust.vehicles);
    const d = addHours(NOW, -hrsAgo);

    await prisma.order.create({
      data: {
        tenantId, customerId: cust.id, vehicleId: veh.id,
        status, total: isVip ? 400 : 80,
        startedAt: status === 'IN_PROGRESS' || status === 'READY' ? addHours(d, 1) : null,
        finishedAt: status === 'READY' ? addHours(d, 2) : null,
        notes: isVip ? '⚠️ VIP - Vitrificação Completa' : 'Fila comum',
        createdAt: d, updatedAt: d,
        items: {
          create: [
            { tenantId, name: isVip ? 'Vitrificação de Pintura' : 'Lavagem Completa (Cera)', isService: true, quantity: 1, unitPrice: isVip ? 400 : 80 }
          ]
        }
      }
    });
  };

  // Status variados para o Drag and Drop do Front-end
  await createKanbanCard('PENDING', 5);
  await createKanbanCard('PENDING', 3);
  
  await createKanbanCard('WAITING_QUEUE', 4, true); 
  await createKanbanCard('WAITING_QUEUE', 2);
  await createKanbanCard('WAITING_QUEUE', 1);
  
  await createKanbanCard('IN_PROGRESS', 3, true); 
  await createKanbanCard('IN_PROGRESS', 1);
  await createKanbanCard('IN_PROGRESS', 0.5);
  
  await createKanbanCard('READY', 4);
  await createKanbanCard('READY', 2);

  console.log('✅ =========================================================');
  console.log(`✅ MEGA SEMEADURA CONCLUÍDA! (KANBAN E DRE PRONTOS)`);
  console.log(`📊 Mais de R$ ${incomeAcumulado.toLocaleString('pt-BR')} em faturamento simulado na história do Lava-jato.`);
  console.log('✅ =========================================================');
  console.log('🔑 Logins para o Sistema (Senha comum: 123456):');
  console.log('-> Gerente/Dono  : dono@acquapremium.com');
  console.log('-> Lavador Chefe : lavador1@acquapremium.com');
  console.log('-> Admin do SaaS : admin@saas.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });