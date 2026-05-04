import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

// Foydalanuvchining shaxsiy shabloni — Word'dan import, paste yoki tahrir qilingan
// tizim shabloni. Block-level editor uchun JSON struktura saqlaydi.

export type ContractType =
  | 'OLDI_SOTDI' | 'XIZMAT' | 'IJARA' | 'PUDRAT' | 'QOSHIMCHA'
  | 'MOLIYAVIY' | 'DAVAL' | 'XALQARO' | 'AGENTLIK'
  | 'TRANSPORT' | 'LIZING' | 'BOSHQA'

export type UserTemplateSource = 'CUSTOM' | 'WORD_UPLOAD' | 'PASTE' | 'CLONED' | 'EDITED'

export interface TemplateBlock {
  id?:    string         // har bir blokning UUID — front block-editor'da sortable
  type:   'heading' | 'clause' | 'paragraph' | 'list' | 'signature'
  level?: number         // sarlavha darajasi (1=H1, 2=H2)
  number?: string        // band raqami: "1", "1.1", "1.1.1"
  text:   string         // bandning matni
}

export interface CreateUserTemplateDto {
  organizationId: string
  name:           string
  contractType?:  ContractType
  source:         UserTemplateSource
  baseTemplateId?: string  // tizim shablonidan klonlangan bo'lsa
  blocks?:        TemplateBlock[]
  rawContent?:    string
}

export interface UpdateUserTemplateDto {
  name?:        string
  contractType?: ContractType
  blocks?:      TemplateBlock[]
  rawContent?:  string
}

@Injectable()
export class UserTemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateUserTemplateDto) {
    if (!dto.name?.trim()) {
      throw new BadRequestException("Shablon nomi kerak")
    }
    if (!dto.blocks?.length && !dto.rawContent?.trim()) {
      throw new BadRequestException("Shablon mazmuni bo'sh bo'lmasligi kerak")
    }

    return this.prisma.userTemplate.create({
      data: {
        userId,
        organizationId: dto.organizationId,
        name:           dto.name.trim().slice(0, 200),
        contractType:   dto.contractType ?? null,
        source:         dto.source,
        baseTemplateId: dto.baseTemplateId ?? null,
        blocks:         (dto.blocks ?? []) as any,
        rawContent:     dto.rawContent?.slice(0, 100_000) ?? null,
        versionHistory: [] as any,
      },
    })
  }

  async list(organizationId: string, query: { search?: string; limit?: number; page?: number } = {}) {
    const limit = Math.min(query.limit ?? 30, 100)
    const page  = query.page ?? 1
    const where: any = {
      organizationId,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
    }

    const [total, data] = await Promise.all([
      this.prisma.userTemplate.count({ where }),
      this.prisma.userTemplate.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
        select: {
          id: true, name: true, contractType: true, source: true,
          baseTemplateId: true, organizationId: true,
          createdAt: true, updatedAt: true,
        },
      }),
    ])

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  async findOne(id: string, organizationId: string) {
    const tpl = await this.prisma.userTemplate.findUnique({ where: { id } })
    if (!tpl) throw new NotFoundException('Shablon topilmadi')
    if (tpl.organizationId !== organizationId) {
      throw new ForbiddenException("Bu shablonga ruxsatingiz yo'q")
    }
    return tpl
  }

  async update(id: string, organizationId: string, dto: UpdateUserTemplateDto) {
    const existing = await this.findOne(id, organizationId)

    // Versiya tarixiga eski versiyani yozamiz (oxirgi 10 ta saqlanadi)
    const history: any[] = Array.isArray(existing.versionHistory) ? (existing.versionHistory as any[]) : []
    const newSnapshot = {
      at:        new Date().toISOString(),
      blocks:    existing.blocks,
      rawContent: existing.rawContent,
      name:      existing.name,
    }
    const trimmed = [newSnapshot, ...history].slice(0, 10)

    return this.prisma.userTemplate.update({
      where: { id },
      data: {
        ...(dto.name         !== undefined ? { name: dto.name.trim().slice(0, 200) } : {}),
        ...(dto.contractType !== undefined ? { contractType: dto.contractType } : {}),
        ...(dto.blocks       !== undefined ? { blocks: dto.blocks as any } : {}),
        ...(dto.rawContent   !== undefined ? { rawContent: dto.rawContent.slice(0, 100_000) } : {}),
        versionHistory: trimmed as any,
      },
    })
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId) // ownership check
    return this.prisma.userTemplate.delete({ where: { id } })
  }

  // Tizim shablonidan klonlash — foydalanuvchi tahrir qilishi uchun nusxa yaratamiz
  async cloneFromSystem(userId: string, organizationId: string, baseTemplateId: string, customName?: string) {
    const base = await this.prisma.template.findUnique({ where: { id: baseTemplateId } })
    if (!base) throw new NotFoundException('Asl shablon topilmadi')
    if (!base.isSystem && base.organizationId !== organizationId) {
      throw new ForbiddenException("Asl shablonga ruxsatingiz yo'q")
    }

    return this.prisma.userTemplate.create({
      data: {
        userId,
        organizationId,
        name:           (customName?.trim() || `${base.name} (nusxa)`).slice(0, 200),
        contractType:   base.contractType as any,
        source:         'CLONED',
        baseTemplateId: base.id,
        blocks:         this.parseTextToBlocks(base.content) as any,
        rawContent:     base.content,
        versionHistory: [] as any,
      },
    })
  }

  // Raw text -> bloklar (oddiy heuristic). Frontend block editor uchun.
  // Sarlavha: "1. SHARTNOMA PREDMETI" yoki ALL CAPS satr
  // Band:    "1.1. ...", "1.2. ..."
  parseTextToBlocks(text: string): TemplateBlock[] {
    if (!text?.trim()) return []
    const blocks: TemplateBlock[] = []
    const lines = text.split(/\r?\n/)

    let i = 0
    for (const raw of lines) {
      const line = raw.trim()
      if (!line) continue

      // Sarlavha: "1. CAPS_TEXT" yoki to'liq UPPERCASE
      const headingMatch = line.match(/^(\d+)\.\s+([A-ZА-ЯЎҒҲҚ\s'`,-]+)$/)
      const isAllCaps    = line === line.toUpperCase() && line.length > 5 && /[A-ZА-ЯЎҒҲҚ]/.test(line)

      if (headingMatch) {
        blocks.push({
          id:     `b${i++}`,
          type:   'heading',
          level:  1,
          number: headingMatch[1],
          text:   headingMatch[2].trim(),
        })
        continue
      }

      // Band: "1.1.", "1.2.1.", ...
      const clauseMatch = line.match(/^(\d+\.\d+(?:\.\d+)?\.?)\s+(.+)$/)
      if (clauseMatch) {
        blocks.push({
          id:     `b${i++}`,
          type:   'clause',
          number: clauseMatch[1].replace(/\.$/, ''),
          text:   clauseMatch[2].trim(),
        })
        continue
      }

      // Imzo qatori (— yoki _____ bilan boshlanadi)
      if (/^_{3,}|^—\s/.test(line) || /\/[A-ZА-ЯЎҒҲҚ]/.test(line) && line.includes('M.O')) {
        blocks.push({
          id:   `b${i++}`,
          type: 'signature',
          text: line,
        })
        continue
      }

      // Boshqa hammasi — paragraph
      if (isAllCaps) {
        blocks.push({
          id:    `b${i++}`,
          type:  'heading',
          level: 1,
          text:  line,
        })
      } else {
        blocks.push({
          id:   `b${i++}`,
          type: 'paragraph',
          text: line,
        })
      }
    }

    return blocks
  }

  // Bloklarni raw text'ga aylantirish (export va backward compat uchun)
  blocksToText(blocks: TemplateBlock[]): string {
    if (!Array.isArray(blocks) || blocks.length === 0) return ''
    return blocks.map(b => {
      if (b.type === 'heading') {
        return b.number ? `\n${b.number}. ${b.text.toUpperCase()}\n` : `\n${b.text.toUpperCase()}\n`
      }
      if (b.type === 'clause') {
        return b.number ? `${b.number}. ${b.text}` : b.text
      }
      if (b.type === 'signature') {
        return `\n${b.text}`
      }
      return b.text
    }).join('\n')
  }
}
