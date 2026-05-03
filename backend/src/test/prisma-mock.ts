/**
 * Prisma mock helper — testlarda haqiqiy DB chaqirmasdan, har bir method'ning
 * qaytariladigan qiymatini boshqarish uchun.
 *
 * Misol:
 *   const prisma = createMockPrisma()
 *   prisma.user.findUnique.mockResolvedValue({ id: 'u1', isActive: true } as any)
 *   const guard = new JwtAuthGuard(jwt, ref, prisma as any)
 */

type Mock = jest.Mock

interface PrismaModelMock {
  findFirst:    Mock
  findUnique:   Mock
  findMany:     Mock
  create:       Mock
  update:       Mock
  updateMany:   Mock
  delete:       Mock
  deleteMany:   Mock
  count:        Mock
  upsert:       Mock
}

function modelMock(): PrismaModelMock {
  return {
    findFirst:    jest.fn(),
    findUnique:   jest.fn(),
    findMany:     jest.fn(),
    create:       jest.fn(),
    update:       jest.fn(),
    updateMany:   jest.fn(),
    delete:       jest.fn(),
    deleteMany:   jest.fn(),
    count:        jest.fn(),
    upsert:       jest.fn(),
  }
}

export function createMockPrisma() {
  return {
    user:           modelMock(),
    organization:   modelMock(),
    counterparty:   modelMock(),
    contract:       modelMock(),
    miraSettings:   modelMock(),
    bulkSendDraft:  modelMock(),
    subscription:   modelMock(),
    payment:        modelMock(),
    auditLog:       modelMock(),
    notification:   modelMock(),
    invoice:        modelMock(),
    document:       modelMock(),
    employee:       modelMock(),
    template:       modelMock(),

    // $transaction — callback'ni darhol shu mock prisma bilan chaqiradi
    $transaction: jest.fn(async (cb: any, _opts?: any) => {
      if (typeof cb === 'function') return cb(this)
      return cb
    }),
  }
}

export type MockPrisma = ReturnType<typeof createMockPrisma>
