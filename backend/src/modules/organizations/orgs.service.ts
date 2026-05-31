import {
  Injectable, NotFoundException,
  BadRequestException, ForbiddenException
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface CreateOrgDto {
  name:             string
  inn?:             string
  directorName?:    string
  directorPinfl?:   string
  bankName?:        string
  bankAccount?:     string
  mfo?:             string
  address?:         string
  phone?:           string
  oked?:            string
  qqsReg?:          string
  qqsStavka?:       string
  chiefAccountant?: string
}

@Injectable()
export class OrgsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const owned = await this.prisma.organization.findMany({
      where:   { userId, isActive: true },
      include: {
        bankAccounts: { where: { isDefault: true } },
        _count: { select: { contracts: true, counterparties: true } }
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
    })

    const memberOrgs = await this.prisma.orgMember.findMany({
      where:   { userId, status: 'ACTIVE' },
      include: {
        organization: {
          include: {
            bankAccounts: { where: { isDefault: true } },
            _count: { select: { contracts: true } }
          }
        }
      }
    })

    const memberOrgList = memberOrgs
      .map(m => m.organization)
      .filter(o => o.isActive)

    // Egasi endi a'zo ham bo'lgani uchun tashkilot ikki ro'yxatda chiqishi mumkin —
    // ID bo'yicha takrorlarni olib tashlaymiz.
    const byId = new Map<string, typeof owned[number]>()
    for (const o of owned)          byId.set(o.id, o)
    for (const o of memberOrgList)  if (!byId.has(o.id)) byId.set(o.id, o as any)

    return Array.from(byId.values())
  }

  async findOne(userId: string, id: string) {
    const org = await this.prisma.organization.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { members: { some: { userId, status: 'ACTIVE' } } }
        ]
      },
      include: {
        bankAccounts: true,
        members: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } }
          }
        },
        tasischilar: true,
      }
    })

    if (!org) throw new NotFoundException('Tashkilot topilmadi')
    return org
  }

  async create(userId: string, dto: CreateOrgDto) {
    const count = await this.prisma.organization.count({ where: { userId } })

    const user = await this.prisma.user.findUnique({
      where:   { id: userId },
      include: { subscription: true }
    })

    if (count >= 3 && user?.subscription?.plan === 'FREE') {
      throw new BadRequestException(
        "Bepul rejada 3 tadan ko'proq tashkilot qo'shib bo'lmaydi"
      )
    }

    const isDefault = count === 0

    const org = await this.prisma.organization.create({
      data: { userId, ...dto, isDefault }
    })

    // Yaratuvchini OWNER a'zo sifatida yozib qo'yamiz — egalik a'zolik orqali
    // saqlanadi va keyinchalik boshqa xodimga o'tkazilishi mumkin.
    await this.prisma.orgMember.create({
      data: { organizationId: org.id, userId, role: 'OWNER', status: 'ACTIVE' },
    }).catch(() => {}) // allaqachon a'zo bo'lsa — e'tiborsiz qoldiramiz

    return org
  }

  async update(userId: string, id: string, dto: Partial<CreateOrgDto>) {
    await this.checkOwner(userId, id)
    return this.prisma.organization.update({
      where: { id },
      data:  { ...dto, updatedAt: new Date() }
    })
  }

  async remove(userId: string, id: string) {
    await this.checkOwner(userId, id)
    return this.prisma.organization.update({
      where: { id },
      data:  { isActive: false }
    })
  }

  async setDefault(userId: string, id: string) {
    await this.checkOwner(userId, id)
    await this.prisma.organization.updateMany({
      where: { userId },
      data:  { isDefault: false }
    })
    return this.prisma.organization.update({
      where: { id },
      data:  { isDefault: true }
    })
  }

  async addBankAccount(
    userId: string,
    orgId:  string,
    dto: { bankName: string; accountNumber: string; mfo: string; isDefault?: boolean }
  ) {
    await this.checkOwner(userId, orgId)
    if (dto.isDefault) {
      await this.prisma.bankAccount.updateMany({
        where: { organizationId: orgId },
        data:  { isDefault: false }
      })
    }
    return this.prisma.bankAccount.create({
      data: {
        organizationId: orgId,
        bankName:       dto.bankName,
        accountNumber:  dto.accountNumber,
        mfo:            dto.mfo,
        isDefault:      dto.isDefault || false,
      }
    })
  }

  async saveSoliqData(orgId: string, data: Record<string, any>) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data:  { ...data, soliqSyncedAt: new Date() }
    })
  }

  private async checkOwner(userId: string, orgId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id: orgId, userId }
    })
    if (!org) throw new ForbiddenException("Ruxsat yo'q")
    return org
  }
}
