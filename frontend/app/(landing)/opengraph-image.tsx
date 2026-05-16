import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt     = 'MyHujjat.uz — O\'zbekiston hujjat platformasi'
export const size    = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #2563EB 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Background pattern dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo badge */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            border: '2px solid rgba(255,255,255,0.2)',
          }}
        >
          <span style={{ color: 'white', fontSize: 40, fontWeight: 900 }}>M</span>
        </div>

        {/* Title */}
        <div
          style={{
            color: 'white',
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: '-2px',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          MyHujjat.uz
        </div>

        {/* Subtitle */}
        <div
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: 28,
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.4,
            marginBottom: 48,
          }}
        >
          O'zbekiston uchun aqlli hujjat platformasi
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Shartnomalar', 'Faktura', 'Kadrlar', 'AI Hujjat', 'E-imzo'].map(label => (
            <div
              key={label}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 100,
                padding: '8px 20px',
                color: 'rgba(255,255,255,0.9)',
                fontSize: 18,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
