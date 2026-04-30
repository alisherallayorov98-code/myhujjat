import { PrismaClient } from '@prisma/client'
import * as bcrypt      from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seed boshlanmoqda...')

  // ============================================
  // DEMO FOYDALANUVCHI
  // ============================================
  const demoHash = await bcrypt.hash('demo12345', 10)

  const demoUser = await prisma.user.upsert({
    where:  { email: 'demo@myhujjat.uz' },
    update: {},
    create: {
      email:        'demo@myhujjat.uz',
      passwordHash: demoHash,
      firstName:    'Demo',
      lastName:     'Foydalanuvchi',
      isActive:     true,
      isVerified:   true,
      role:         'USER',
    },
  })

  // Demo obuna (PRO, 30 kun)
  const demoExpires = new Date()
  demoExpires.setDate(demoExpires.getDate() + 30)

  await prisma.subscription.upsert({
    where:  { userId: demoUser.id },
    update: {},
    create: {
      userId:        demoUser.id,
      plan:          'PRO',
      status:        'ACTIVE',
      startedAt:     new Date(),
      expiresAt:     demoExpires,
      contractCount: 0,
    },
  })

  // ============================================
  // DEMO TASHKILOT
  // ============================================
  let demoOrg = await prisma.organization.findFirst({
    where: { inn: '302756789' },
  })

  if (!demoOrg) {
    demoOrg = await prisma.organization.create({
      data: {
        userId:       demoUser.id,
        name:         'Demo Savdo MChJ',
        inn:          '302756789',
        directorName: 'Toshmatov Jasur Baxtiyorovich',
        address:      "Toshkent sh., Yunusobod tumani, Amir Temur ko'chasi 108",
        phone:        '+998 71 123 45 67',
        bankName:     'Xalq banki',
        bankAccount:  '20208000302756789001',
        mfo:          '00014',
        isDefault:    true,
        members: {
          create: { userId: demoUser.id, role: 'OWNER', status: 'ACTIVE' },
        },
      },
    })
  }

  // ============================================
  // DEMO KONTRAGENTLAR
  // ============================================
  const cpData = [
    { name: 'Mirzayev Qurilish LLC',  inn: '302123456' },
    { name: 'Hasanov Transport MChJ', inn: '302234567' },
    { name: 'Alimov IT Xizmatlari',   inn: '302345678' },
  ]

  for (const cp of cpData) {
    const existing = await prisma.counterparty.findFirst({
      where: { inn: cp.inn, organizationId: demoOrg.id },
    })
    if (!existing) {
      await prisma.counterparty.create({
        data: { ...cp, organizationId: demoOrg.id, isActive: true },
      })
    }
  }

  const cpList = await prisma.counterparty.findMany({
    where: { organizationId: demoOrg.id },
  })

  // ============================================
  // DEMO SHARTNOMALAR
  // ============================================
  const contracts = [
    {
      contractNumber: 'SH-2025/01-001',
      contractType:   'OLDI_SOTDI' as const,
      status:         'COMPLETED' as const,
      amount:         15000000,
      contractDate:   '2025-01-15',
      counterpartyId: cpList[0]?.id,
    },
    {
      contractNumber: 'SH-2025/01-002',
      contractType:   'XIZMAT' as const,
      status:         'ACTIVE' as const,
      amount:         5000000,
      contractDate:   '2025-01-20',
      counterpartyId: cpList[1]?.id,
    },
    {
      contractNumber: 'SH-2025/02-001',
      contractType:   'IJARA' as const,
      status:         'DRAFT' as const,
      amount:         3000000,
      contractDate:   '2025-02-01',
      counterpartyId: cpList[2]?.id,
    },
  ]

  for (const contract of contracts) {
    if (!contract.counterpartyId) continue
    const existing = await prisma.contract.findFirst({
      where: { contractNumber: contract.contractNumber, organizationId: demoOrg.id },
    })
    if (!existing) {
      await prisma.contract.create({
        data: {
          ...contract,
          organizationId: demoOrg.id,
          content:        `Demo shartnoma matni — ${contract.contractType}`,
          isActive:       true,
        },
      })
    }
  }

  // ============================================
  // DEMO XODIMLAR
  // ============================================
  const employees = [
    { ism: 'Karimov Bobur Salimovich',   lavozim: 'Dasturchi',        bolim: 'IT',        maosh: '8000000' },
    { ism: 'Yusupova Dilnoza Hamidovna', lavozim: 'Buxgalter',        bolim: 'Moliya',    maosh: '6000000' },
    { ism: 'Rahimov Sherzod Toxirovich', lavozim: 'Marketing menejer', bolim: 'Marketing', maosh: '7000000' },
  ]

  for (const emp of employees) {
    const existing = await prisma.employee.findFirst({
      where: { ism: emp.ism, organizationId: demoOrg.id },
    })
    if (!existing) {
      await prisma.employee.create({
        data: { ...emp, organizationId: demoOrg.id, ishBoshi: '2024-01-01', isActive: true },
      })
    }
  }

  // ============================================
  // ADMIN FOYDALANUVCHI
  // ============================================
  const adminHash = await bcrypt.hash('admin@myhujjat2025!', 10)

  await prisma.user.upsert({
    where:  { email: 'admin@myhujjat.uz' },
    update: {},
    create: {
      email:        'admin@myhujjat.uz',
      passwordHash: adminHash,
      firstName:    'Super',
      lastName:     'Admin',
      isActive:     true,
      isVerified:   true,
      role:         'SUPER_ADMIN',
    },
  })

  console.log('✅ Seed muvaffaqiyatli yakunlandi!')
  console.log('📧 Demo:  demo@myhujjat.uz  / demo12345')
  console.log('🔐 Admin: admin@myhujjat.uz / admin@myhujjat2025!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
