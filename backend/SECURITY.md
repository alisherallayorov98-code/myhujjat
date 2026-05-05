# Multi-Tenant Xavfsizlik

Bu hujjatda MyHujjat.uz backend'idagi multi-tenant xavfsizlik me'yorlari va auditi tasvirlangan.

## Asosiy printsiplar

1. **Hech qanday tashkilot foydalanuvchisi boshqa tashkilotning ma'lumotini ko'ra olmasligi/o'zgartira olmasligi/o'chira olmasligi shart.**
2. **Defense in depth**: Controller-darajadagi guard + service-darajadagi `organizationId` filter.
3. **Default deny**: Har bir endpoint kirish ruxsatini explicit talab qiladi (JwtAuthGuard global).

## Xavfsizlik chiziqlari

### 1. Auth Layer
- `JwtAuthGuard` — APP_GUARD orqali har endpoint'da default holatida
- `@Public()` decorator faqat ataylab ochiq endpoint'lar uchun (sign/[token])
- `CurrentUser()` — JWT'dan `user.sub` (userId) chiqaradi

### 2. Tenant Layer (`TenantAccessService`)
Har CRUD endpoint'ida ulardan **birini** chaqirish shart:

- `requireOrgAccess(userId, orgId)` — foydalanuvchi shu tashkilotga ruxsati borligini tekshiradi:
  - egasi (Organization.userId) yoki
  - active a'zo (OrgMember.userId, status='ACTIVE')

- `requireResourceOwnership(userId, resource, resourceId)` — resurs (shartnoma, kontragent va h.k.) foydalanuvchining biror tashkilotiga tegishli ekanligini tekshiradi:
  ```typescript
  const orgIds = await getAccessibleOrgIds(userId)
  count = await prisma.contract.count({
    where: { id: resourceId, organizationId: { in: orgIds } }
  })
  if (count === 0) throw NotFoundException
  ```

- `requireOwner(userId, orgId)` — faqat OWNER role uchun (a'zolarni chaqirish, tashkilotni o'chirish va h.k.)

### 3. Service Layer (Defense in Depth)
Service'lar ichida ham `organizationId` filter qo'shilgan. Bu — agar controller guard'i unutilsa ham, ma'lumotlar yopiq qoladi.

Misol (cp.service.ts):
```typescript
async findOne(id: string, orgId?: string) {
  const where = orgId ? { id, organizationId: orgId } : { id }
  const cp = await prisma.counterparty.findFirst({ where })
  if (!cp) throw NotFoundException
  return cp
}
```

## Audit natijalari (2026-05-05)

### ✅ Guard mavjud va to'g'ri ishlaydi
| Modul | Endpoint soni | Guard |
|---|---|---|
| contracts | 10 | 10 ✅ |
| counterparties | 6 | 6 ✅ |
| specifications | 5 | 5 ✅ |
| employees | 5 | 5 ✅ |
| documents | 7 | 7 ✅ |
| templates | 6 | 5 (1 — public seed) |
| user-templates | 7 | 6 (1 — utility parse-text) |
| founders | 4 | 4 ✅ |
| invoices | 10 | 7 (3 — public/admin) |
| ai | 4 | 4 ✅ |
| share-links | 5 | service ichida (userId filter, 2 ta public token) |
| bulk-send | 8 | service ichida (userId filter, OWNER-only) |

### 🔴 Tuzatilgan muammolar

**1. Voice controller — orgId validatsiya yo'q edi (2026-05-05 tuzatildi)**
- Foydalanuvchi `body.orgId` orqali boshqa tashkilot identifikatorini yuborsa, voice service shu kontekstida ishlardi.
- Tuzatish: `requireOrgAccess` qo'shildi.

**2. Invoices/recalc — butun bazadagi fakturalarni qayta hisoblovchi endpoint (2026-05-05 tuzatildi)**
- Hech qanday guard yo'q edi. Har foydalanuvchi `POST /invoices/recalc` chaqirsa butun bazadagi fakturalarni qayta hisoblardi (DDoS yoki resurs sarflanish xavfi).
- Tuzatish: faqat `ADMIN` yoki `SUPER_ADMIN` role chaqira oladi.

**3. Counterparties service — defense-in-depth org filter (2026-05-05 qo'shildi)**
- Controller'da `requireResourceOwnership` mavjud edi (xavfsiz), lekin service'da `findOne(id)` to'g'ridan-to'g'ri `findUnique` ishlatardi.
- Tuzatish: `findOne(id, orgId?)`, `update(id, dto, orgId?)`, `remove(id, orgId?)` — orgId ixtiyoriy ikkinchi qatlam himoya.

## Tekshirish jarayoni (penetration test)

Foydalanuvchi A (Org-A egasi) va B (Org-B egasi) holatda quyidagilar:

| Hujum | Natija |
|---|---|
| `GET /contracts/{B'ning-shartnoma-ID}` `?orgId=A` | ❌ NotFoundException (requireResourceOwnership) |
| `GET /contracts?orgId=B` (A login bilan) | ❌ ForbiddenException (requireOrgAccess) |
| `PUT /counterparties/{B'ning-CP-ID}` (A login bilan) | ❌ NotFoundException |
| `DELETE /contracts/{B'ning-shartnoma-ID}` | ❌ NotFoundException |
| `POST /invoices/recalc` (oddiy USER) | ❌ ForbiddenException (admin only) |
| `POST /voice/command body.orgId=B` (A login) | ❌ ForbiddenException |

## Yangi modul qo'shganda

Yangi controller yaratayotganda:
1. `TenantAccessService` ni inject qiling
2. **Har CRUD endpoint'da** `requireOrgAccess` yoki `requireResourceOwnership` chaqiring
3. Service ichida ham `organizationId` filter qo'shing (defense in depth)
4. Yangi resurs turi qo'shsangiz — `tenant-access.service.ts` `requireResourceOwnership` switch'iga case qo'shing

## Yana tekshirish kerak (kelajakda)

- [ ] Penetration test (haqiqiy tashqi vositalar bilan)
- [ ] Rate limiting har tashkilot bo'yicha (TenantRateLimitGuard mavjud, lekin barcha endpoint'larda emas)
- [ ] Audit log: cross-org urinish topilsa SUSPICIOUS_ACTIVITY ga yozish
- [ ] Frontend: API javob 403/404 bo'lsa kategoriyaga ko'ra UI feedback
