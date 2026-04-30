/**
 * React Query cache vaqtlari (millisekundlarda)
 *
 * staleTime — qancha vaqt cache "yangi" deb hisoblanadi (refetch qilinmaydi)
 * gcTime    — qancha vaqt cache xotirada saqlanadi (oxirgi observerdan keyin)
 *
 * Past internetda foydalanuvchi sahifa orasida o'tganda qaytadan yuklanmasligi uchun
 * staleTime ko'p, lekin gcTime juda uzoq emas (xotira tejash).
 */
export const CACHE = {
  // Statik (deyarli o'zgarmaydi)
  STATIC: {
    staleTime: 60 * 60 * 1000,   // 1 soat
    gcTime:    2 * 60 * 60 * 1000, // 2 soat
  },

  // Foydalanuvchi va tashkilot
  USER_ORG: {
    staleTime: 10 * 60 * 1000,   // 10 daq
    gcTime:    15 * 60 * 1000,   // 15 daq
  },

  // Ro'yxatlar (shartnomalar, kontragentlar, xodimlar)
  LISTS: {
    staleTime: 2 * 60 * 1000,    // 2 daq
    gcTime:    5 * 60 * 1000,    // 5 daq
  },

  // Tafsilot sahifalari (bir shartnoma)
  DETAIL: {
    staleTime: 1 * 60 * 1000,    // 1 daq
    gcTime:    3 * 60 * 1000,    // 3 daq
  },

  // Realtime — notifikatsiyalar, statistika
  REALTIME: {
    staleTime: 30 * 1000,        // 30 sek
    gcTime:    2 * 60 * 1000,    // 2 daq
    refetchInterval: 60 * 1000,  // 1 daq
  },

  // Tashqi API'lar (STIR, Soliq) — keshlangan
  EXTERNAL: {
    staleTime: 30 * 60 * 1000,   // 30 daq
    gcTime:    60 * 60 * 1000,   // 1 soat
  },
} as const
