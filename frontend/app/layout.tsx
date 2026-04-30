import type { Metadata }  from 'next'
import { Inter }          from 'next/font/google'
import { Toaster }        from 'react-hot-toast'
import { AuthProvider }   from '@/components/providers/AuthProvider'
import { QueryProvider }  from '@/components/providers/QueryProvider'
import { ThemeProvider }  from '@/components/providers/ThemeProvider'
import { SWRegister }     from '@/components/SWRegister/SWRegister'
import { ErrorBoundary }  from '@/components/ErrorBoundary/ErrorBoundary'
import { CookieConsent }  from '@/components/CookieConsent/CookieConsent'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title:       "MyHujjat.uz — O'zbekiston hujjat platformasi",
  description: "Shartnomalar, faktiralar va rasmiy hujjatlarni AI yordamida yarating",
  manifest:    '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'MyHujjat' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#2563EB" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={inter.className}>
        <SWRegister />
        <ErrorBoundary>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                {children}
                <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 3000,
                    className: 'theme-toast',
                    style: {
                      borderRadius: '12px',
                      fontSize:     '13px',
                      padding:      '10px 14px',
                      boxShadow:    '0 4px 20px rgba(0,0,0,0.08)',
                    },
                    success: { iconTheme: { primary: '#16A34A', secondary: '#fff' } },
                    error:   { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
                  }}
                />
                <CookieConsent />
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
