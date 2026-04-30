import dynamic from 'next/dynamic'

export const EimzoSign = dynamic(
  () => import('@/components/EimzoSign/EimzoSign').then(m => m.EimzoSign),
  { ssr: false },
)
