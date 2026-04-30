import Link from 'next/link'
import { WifiOff, RefreshCw } from 'lucide-react'

export const metadata = {
  title: 'Internet aloqasi yo\'q — MyHujjat.uz',
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 max-w-sm text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
          <WifiOff size={28} className="text-[#94A3B8]" />
        </div>
        <h1 className="font-display font-black text-[#0F172A] text-xl mb-2">
          Internet aloqasi yo'q
        </h1>
        <p className="text-sm text-[#475569] mb-6 leading-relaxed">
          Hozir oflaynsiz. Internet aloqangizni tekshirib, qayta urinib ko'ring.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          <RefreshCw size={14} />
          Qayta urinib ko'rish
        </a>

        <div className="mt-6 pt-6 border-t border-[#E2E8F0]">
          <p className="text-xs text-[#94A3B8]">
            Oflayn rejimda ko'rilgan sahifalar va xotirada saqlangan ma'lumotlardan foydalanishingiz mumkin.
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-[#94A3B8] mt-6">
        MyHujjat.uz — O'zbekiston uchun hujjat platformasi
      </p>
    </div>
  )
}
