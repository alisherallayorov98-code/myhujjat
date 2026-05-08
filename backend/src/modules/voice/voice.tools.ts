import { Type } from '@google/genai'

/**
 * Mira AI yordamchisining tool (function calling) sxemasi
 */
export const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'createCounterparty',
        description: "Yangi kontragent (hamkor kompaniya) qo'shadi. Agar STIR berilgan bo'lsa, avval searchStir chaqirib ma'lumotni oling.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name:         { type: Type.STRING, description: 'Kompaniya nomi (majburiy)' },
            inn:          { type: Type.STRING, description: 'STIR (9 ta raqam)' },
            directorName: { type: Type.STRING, description: 'Rahbar ismi' },
            address:      { type: Type.STRING, description: 'Yuridik manzil' },
            phone:        { type: Type.STRING, description: 'Telefon raqam' },
            bankName:     { type: Type.STRING, description: 'Bank nomi' },
            bankAccount:  { type: Type.STRING, description: 'Hisob raqami' },
            mfo:          { type: Type.STRING, description: 'MFO (5 ta raqam)' },
          },
          required: ['name'],
        },
      },
      {
        name: 'findCounterparty',
        description: "Mavjud kontragentni nomi yoki STIR bo'yicha tizimda qidiradi. Kontragent borligini tekshirish yoki shartnoma yaratishdan avval foydalaning.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Kontragent nomi (qismi ham ishlaydi, masalan: 'Toshmatov')" },
            inn:  { type: Type.STRING, description: 'STIR (9 ta raqam)' },
          },
        },
      },
      {
        name: 'createContract',
        description: 'Yangi shartnoma yaratadi. counterpartyName yoki counterpartyInn berilsa, avtomatik kontragentni topadi.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            contractType: {
              type: Type.STRING,
              description: "Shartnoma turi. Mumkin qiymatlar: OLDI_SOTDI, XIZMAT, IJARA, PUDRAT, MOLIYAVIY, QOSHIMCHA, DAVAL, XALQARO, AGENTLIK, TRANSPORT, LIZING, BOSHQA",
            },
            counterpartyName: { type: Type.STRING, description: 'Kontragent nomi (qidirish uchun)' },
            counterpartyInn:  { type: Type.STRING, description: 'Kontragent STIR (qidirish uchun)' },
            amount:           { type: Type.NUMBER, description: "Shartnoma summasi so'mda" },
            city:             { type: Type.STRING, description: 'Shahar (default: Toshkent)' },
            productName:      { type: Type.STRING, description: 'Mahsulot/xizmat nomi' },
            endDate:          { type: Type.STRING, description: "Shartnoma tugash sanasi ISO format: YYYY-MM-DD (masalan: 2026-12-31)" },
          },
          required: ['contractType'],
        },
      },
      {
        name: 'updateContract',
        description: "Mavjud shartnomani yangilaydi. contractNumber yoki contractId bilan topiladi.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            contractNumber: { type: Type.STRING, description: "Shartnoma raqami (masalan: SH-2026/05-001)" },
            contractId:     { type: Type.STRING, description: "Shartnoma ID (cuid)" },
            status: {
              type: Type.STRING,
              description: "Yangi status: DRAFT, ACTIVE, COMPLETED, CANCELLED",
            },
            amount:      { type: Type.NUMBER, description: "Yangi summa so'mda" },
            endDate:     { type: Type.STRING, description: "Yangi tugash sanasi ISO: YYYY-MM-DD" },
            productName: { type: Type.STRING, description: 'Yangi mahsulot/xizmat nomi' },
          },
        },
      },
      {
        name: 'getContractDetails',
        description: "Bitta shartnomaning to'liq ma'lumotini qaytaradi. contractNumber yoki contractId bilan topiladi.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            contractNumber: { type: Type.STRING, description: "Shartnoma raqami" },
            contractId:     { type: Type.STRING, description: "Shartnoma ID" },
          },
        },
      },
      {
        name: 'listContracts',
        description: "Foydalanuvchi tashkilotidagi so'nggi shartnomalarni qaytaradi",
        parameters: {
          type: Type.OBJECT,
          properties: {
            limit:  { type: Type.NUMBER, description: 'Nechtasini qaytarish (default: 5, max: 20)' },
            status: { type: Type.STRING, description: 'Filter status: DRAFT, ACTIVE, COMPLETED, CANCELLED' },
          },
        },
      },
      {
        name: 'searchStir',
        description: "STIR (9 ta raqam) bo'yicha kompaniya ma'lumotlarini Soliq APIdan qidiradi",
        parameters: {
          type: Type.OBJECT,
          properties: {
            inn: { type: Type.STRING, description: 'STIR (INN) — 9 ta raqam' },
          },
          required: ['inn'],
        },
      },
      {
        name: 'listCounterparties',
        description: "Tizimda mavjud kontragentlar ro'yxatini qaytaradi. Ism yoki STIR bo'yicha filter qilish mumkin. Kontragentlar kimlar bor deb so'ralganda ishlating.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "Qidiruv matni — kontragent ismi yoki STIR qismi" },
            limit: { type: Type.NUMBER, description: "Nechtasini qaytarish (default: 10, max: 20)" },
          },
        },
      },
      {
        name: 'getStats',
        description: 'Foydalanuvchi tashkilotining statistikasini qaytaradi (umumiy/faol shartnomalar, kontragentlar soni)',
        parameters: { type: Type.OBJECT, properties: {} },
      },
    ],
  },
]
