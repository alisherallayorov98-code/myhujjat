export type Lang = 'uz' | 'oz' | 'ru'

export const CONTRACT_TYPE_NAMES: Record<string, Record<Lang, string>> = {
  OLDI_SOTDI:  { uz: 'Oldi-sotdi',           oz: 'Олди-сотди',          ru: 'Купля-продажа'      },
  XIZMAT:      { uz: "Xizmat ko'rsatish",    oz: 'Хизмат кўрсатиш',    ru: 'Оказание услуг'     },
  IJARA:       { uz: 'Ijara',                oz: 'Ижара',               ru: 'Аренда'             },
  PUDRAT:      { uz: 'Pudrat',               oz: 'Пудрат',              ru: 'Подряд'             },
  QOSHIMCHA:   { uz: "Qo'shimcha",           oz: 'Қўшимча',             ru: 'Дополнительный'     },
  MOLIYAVIY:   { uz: 'Moliyaviy yordam',     oz: 'Молиявий ёрдам',      ru: 'Финансовая помощь'  },
  DAVAL:       { uz: 'Daval',                oz: 'Давал',               ru: 'Давальческий'       },
  XALQARO:     { uz: 'Xalqaro',             oz: 'Халқаро',             ru: 'Международный'      },
  AGENTLIK:    { uz: 'Agentlik',             oz: 'Агентлик',            ru: 'Агентский'          },
  TRANSPORT:   { uz: 'Transport',            oz: 'Транспорт',           ru: 'Транспортный'       },
  LIZING:      { uz: 'Lizing',              oz: 'Лизинг',              ru: 'Лизинг'             },
  BOSHQA:      { uz: 'Boshqa',              oz: 'Бошқа',               ru: 'Другой'             },
}

export const SUBSCRIPTION_PLANS = {
  FREE: {
    name:          { uz: 'Bepul', oz: 'Бепул', ru: 'Бесплатно' },
    contractLimit: 3,
    price:         0,
    features: {
      uz: ['Oyiga 3 ta shartnoma', 'Asosiy shablonlar', 'PDF eksport'],
      ru: ['3 договора в месяц',   'Базовые шаблоны',    'Экспорт PDF'],
    }
  },
  STANDARD: {
    name:          { uz: 'Standart', oz: 'Стандарт', ru: 'Стандарт' },
    contractLimit: 50,
    price: {
      '1m':  149000,
      '3m':  399000,
      '12m': 1490000,
    },
    features: {
      uz: [
        'Oyiga 50 ta shartnoma',
        'Barcha shablonlar',
        'PDF + DOCX eksport',
        'Kontragentlar bazasi',
        'Soliq API (STIR)',
        'QQS hisoblash',
      ],
    }
  },
  PRO: {
    name:          { uz: 'Pro', oz: 'Про', ru: 'Про' },
    contractLimit: -1,
    price: {
      '1m':  299000,
      '3m':  799000,
      '12m': 2990000,
    },
    features: {
      uz: [
        'Cheksiz shartnomalar',
        'AI hujjat generatsiya',
        'E-imzo (ERI)',
        'Didox integratsiya',
        'Shablon muharriri',
        "Ko'p tashkilot",
        'Xodimlar boshqaruvi',
        "Ustuvor qo'llab-quvvatlash",
      ],
    }
  },
}
