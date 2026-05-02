export const DOC_TYPES = [
  { value: 'Oldi-sotdi shartnomasi',        icon: '🛒', category: 'shartnoma' },
  { value: "Xizmat ko'rsatish shartnomasi", icon: '🔧', category: 'shartnoma' },
  { value: 'Ijara shartnomasi',             icon: '🏢', category: 'shartnoma' },
  { value: 'Pudrat shartnomasi',            icon: '🏗️', category: 'shartnoma' },
  { value: 'Agentlik shartnomasi',          icon: '🤝', category: 'shartnoma' },
  { value: 'Buyruq',                        icon: '📋', category: 'kotib'     },
  { value: 'Bayonnoma',                     icon: '📝', category: 'kotib'     },
  { value: 'Ishonchnoma',                   icon: '📜', category: 'kotib'     },
  { value: 'Faktura',                       icon: '🧾', category: 'buxgalter' },
  { value: 'Akt-sverka',                    icon: '📊', category: 'buxgalter' },
  { value: 'Mehnat shartnomasi',            icon: '👷', category: 'kadr'      },
  { value: 'Ishga qabul buyrug\'i',         icon: '✅', category: 'kadr'      },
  { value: 'Pretenziya',                    icon: '⚖️', category: 'yurist'    },
  { value: "Da'vo arizasi",                 icon: '🏛️', category: 'yurist'    },
] as const

export const CATEGORIES = [
  { id: 'all',       labelKey: 'categoryAll'        },
  { id: 'shartnoma', labelKey: 'categoryContract'   },
  { id: 'kotib',     labelKey: 'categorySecretary'  },
  { id: 'buxgalter', labelKey: 'categoryAccountant' },
  { id: 'kadr',      labelKey: 'categoryHr'         },
  { id: 'yurist',    labelKey: 'categoryLawyer'     },
] as const

export const EXAMPLE_PROMPTS: Record<string, string[]> = {
  'Oldi-sotdi shartnomasi': [
    "Kompyuter uskunalari sotish. 5 ta noutbuk, umumiy summa 15,000,000 so'm. 10 kunlik to'lov muddati.",
    "Qurilish materiallari sotish. Bir oylik yetkazib berish. QQS 12%.",
  ],
  'Buyruq': [
    "Abdullayev Sardor Bekmurodovichni bosh muhandis lavozimiga tayinlash buyrug'i. Ish haqi 5,000,000 so'm.",
    "Rahimova Dilnozani bosh hisobchi lavozimidan bo'shatish. Sabab: o'z xohishiga ko'ra.",
  ],
  'Mehnat shartnomasi': [
    "Toshmatov Alisher, dasturchi, oylik maosh 8,000,000 so'm, bir yillik, to'liq ish kuni.",
  ],
}
