import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface CreateTemplateDto {
  organizationId: string
  contractType:   string
  name:           string
  content:        string
  isPublic?:      boolean
}

export interface UpdateTemplateDto {
  name?:     string
  content?:  string
  isPublic?: boolean
}

const SYSTEM_TEMPLATES: { contractType: string; name: string; content: string }[] = [
  {
    contractType: 'OLDI_SOTDI',
    name: "Oldi-sotdi shartnomasi (standart)",
    content: `OLDI-SOTDI SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda "Sotuvchi"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda "Xaridor"), ikkinchi tomondan, ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Sotuvchi Xaridorga {{TOVAR_NOMI}} (keyingi o'rinlarda "Tovar") ni sotadi, Xaridor esa ushbu Tovarni qabul qilib, uning narxini to'laydi.
1.2. Tovar miqdori: {{TOVAR_MIQDORI}}.
1.3. Tovar sifati: {{TOVAR_SIFATI}}.

2. NARX VA TO'LOV TARTIBI

2.1. Tovarning umumiy qiymati: {{SUMMA}} so'm ({{SUMMA_MATN}}).
2.2. To'lov tartibi: {{TOLOV_TARTIBI}}.
2.3. To'lov muddati: {{TOLOV_MUDDAT}}.

3. TOVARNI YETKAZIB BERISH

3.1. Yetkazib berish muddati: {{YETKAZISH_MUDDAT}}.
3.2. Yetkazib berish manzili: {{ORG_MANZIL}}.

4. TOMONLARNING HUQUQ VA MAJBURIYATLARI

4.1. Sotuvchi majburliklari:
— Tovarni belgilangan muddatda va sifatda yetkazib berish;
— Tovarning to'liq to'plami va hujjatlarini taqdim etish.

4.2. Xaridor majburiyatlari:
— Tovarni belgilangan muddatda qabul qilish;
— To'lovni o'z vaqtida amalga oshirish.

5. JAVOBGARLIK

5.1. Shartnoma shartlarini bajarmaganligi uchun tomonlar O'zbekiston Respublikasi qonunchiligiga muvofiq javobgar bo'ladilar.
5.2. Kechiktirish uchun penya: {{PENYA_FOIZ}}% har bir kechiktirilgan kun uchun.

6. FORS-MAJOR

6.1. Tomonlar favqulodda holatlarda (tabiiy ofat, urush, davlat organlari qarori va boshqalar) o'z majburiyatlaridan ozod etiladi.

7. NIZOLARNI HAL QILISH

7.1. Tomonlar o'rtasidagi nizolar muzokaralar yo'li bilan hal etiladi.
7.2. Kelishmovchilik hal etilmasa, O'zbekiston Respublikasi iqtisodiy sudiga murojaat etiladi.

8. SHARTNOMA MUDDATI

8.1. Shartnoma imzolanган kundan kuchga kiradi va {{MUDDAT}} muddatga tuzilgan.

9. REKVIZITLAR

SOTUVCHI:                           XARIDOR:
{{ORG_NOMI}}                        {{CP_NOMI}}
STIR: {{ORG_INN}}                   STIR: {{CP_INN}}
Bank: {{ORG_BANK}}                  Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                  H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                    MFO: {{CP_MFO}}
Manzil: {{ORG_MANZIL}}              Manzil: {{CP_MANZIL}}

_______________ / {{ORG_RAHBAR}} /  _______________ / {{CP_RAHBAR}} /
       M.O.                                M.O.`,
  },
  {
    contractType: 'XIZMAT',
    name: "Xizmat ko'rsatish shartnomasi (standart)",
    content: `XIZMAT KO'RSATISH SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda "Ijrochi"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda "Buyurtmachi"), ikkinchi tomondan, ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ijrochi Buyurtmachiga {{XIZMAT_NOMI}} xizmatini ko'rsatadi.
1.2. Xizmat hajmi va shartlari: {{XIZMAT_SHARTLARI}}.

2. NARX VA TO'LOV

2.1. Xizmat narxi: {{SUMMA}} so'm ({{SUMMA_MATN}}).
2.2. To'lov tartibi: {{TOLOV_TARTIBI}}.
2.3. To'lov muddati: {{TOLOV_MUDDAT}}.

3. TOMONLAR MAJBURIYATLARI

3.1. Ijrochi:
— Xizmatni sifatli va o'z vaqtida ko'rsatish;
— Buyurtmachi talablariga rioya qilish.

3.2. Buyurtmachi:
— Xizmat ko'rsatish uchun zarur sharoitlarni yaratish;
— Xizmat narxini belgilangan muddatda to'lash.

4. XIZMAT QABUL QILISH

4.1. Xizmat tugagach, tomonlar Qabul-topshirish dalolatnomasi imzolaydilar.
4.2. Buyurtmachining e'tirozlari bo'lmasa, xizmat qabul qilingan hisoblanadi.

5. JAVOBGARLIK

5.1. Kechiktirilgan to'lov uchun penya: {{PENYA_FOIZ}}% har kun uchun.

6. SHARTNOMA MUDDATI

6.1. Shartnoma "{{SANA}}" dan boshlab {{MUDDAT}} muddatga tuzilgan.

7. REKVIZITLAR

IJROCHI:                            BUYURTMACHI:
{{ORG_NOMI}}                        {{CP_NOMI}}
STIR: {{ORG_INN}}                   STIR: {{CP_INN}}
Bank: {{ORG_BANK}}                  Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                  H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                    MFO: {{CP_MFO}}

_______________ / {{ORG_RAHBAR}} /  _______________ / {{CP_RAHBAR}} /
       M.O.                                M.O.`,
  },
  {
    contractType: 'IJARA',
    name: "Ijara shartnomasi (standart)",
    content: `IJARA SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda "Ijaraberuvchi"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda "Ijarachi"), ikkinchi tomondan, ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ijaraberuvchi Ijarachiga vaqtincha foydalanish uchun quyidagilarni beradi:
{{MULK_TAVSIFI}}.
1.2. Manzil/joylashuv: {{MULK_MANZILI}}.

2. IJARA NARXI VA TO'LOV

2.1. Oylik ijara haqqi: {{SUMMA}} so'm ({{SUMMA_MATN}}).
2.2. To'lov muddati: har oyning {{TOLOV_KUNI}}-sanasigacha.
2.3. To'lov shakli: {{TOLOV_SHAKLI}}.

3. IJARA MUDDATI

3.1. Ijara muddati: {{IJARA_MUDDAT}}.
3.2. Boshlanish sanasi: {{SANA}}.

4. TOMONLAR MAJBURIYATLARI

4.1. Ijaraberuvchi:
— Mulkni kelishilgan holatda topshirish;
— Ijara muddati davomida mulkdan foydalanishga to'sqinlik qilmaslik.

4.2. Ijarachi:
— Mulkni ehtiyotkorlik bilan saqlash;
— Ijara haqini o'z vaqtida to'lash;
— Mulkni asl holatida qaytarish.

5. REKVIZITLAR

IJARABERUVCHI:                      IJARACHI:
{{ORG_NOMI}}                        {{CP_NOMI}}
STIR: {{ORG_INN}}                   STIR: {{CP_INN}}
Bank: {{ORG_BANK}}                  Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                  H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                    MFO: {{CP_MFO}}

_______________ / {{ORG_RAHBAR}} /  _______________ / {{CP_RAHBAR}} /
       M.O.                                M.O.`,
  },
]

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, contractType?: string) {
    const where: any = {
      OR: [
        { isSystem: true },
        { organizationId: orgId },
      ],
      ...(contractType ? { contractType } : {}),
    }
    return this.prisma.template.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true, contractType: true, name: true, isSystem: true,
        isPublic: true, organizationId: true, createdAt: true,
      },
    })
  }

  async findOne(id: string) {
    const tpl = await this.prisma.template.findUnique({ where: { id } })
    if (!tpl) throw new NotFoundException('Shablon topilmadi')
    return tpl
  }

  async create(dto: CreateTemplateDto) {
    return this.prisma.template.create({
      data: {
        organizationId: dto.organizationId,
        contractType:   dto.contractType as any,
        name:           dto.name,
        content:        dto.content,
        isSystem:       false,
        isPublic:       dto.isPublic ?? false,
      },
    })
  }

  async update(id: string, orgId: string, dto: UpdateTemplateDto) {
    const tpl = await this.findOne(id)
    if (tpl.isSystem) throw new ForbiddenException('Tizim shablonini o\'zgartirib bo\'lmaydi')
    if (tpl.organizationId !== orgId) throw new ForbiddenException('Ruxsat yo\'q')
    return this.prisma.template.update({ where: { id }, data: dto })
  }

  async remove(id: string, orgId: string) {
    const tpl = await this.findOne(id)
    if (tpl.isSystem) throw new ForbiddenException('Tizim shablonini o\'chirib bo\'lmaydi')
    if (tpl.organizationId !== orgId) throw new ForbiddenException('Ruxsat yo\'q')
    return this.prisma.template.delete({ where: { id } })
  }

  async seedSystemTemplates() {
    for (const t of SYSTEM_TEMPLATES) {
      const exists = await this.prisma.template.findFirst({
        where: { isSystem: true, contractType: t.contractType as any, name: t.name },
      })
      if (!exists) {
        await this.prisma.template.create({
          data: { ...t, contractType: t.contractType as any, isSystem: true, isPublic: true },
        })
      }
    }
  }
}
