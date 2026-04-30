/**
 * Audio yordamchi funksiyalar — Mira ovozli yordamchisi uchun
 */

// ─── Blob → base64 (audio yuborish uchun) ──────────────────
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // "data:audio/webm;base64,XXXX" → "XXXX"
      const base64 = result.split(',')[1] || ''
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// ─── Gemini PCM audio'ni o'ynash ───────────────────────────
// Gemini TTS PCM 16-bit qaytaradi (audio/L16;rate=24000)
// Brauzer to'g'ridan-to'g'ri o'ynay olmaydi — WAV header qo'shamiz
export function playGeminiAudio(base64: string, mimeType: string) {
  try {
    const bin = atob(base64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)

    const rateMatch = mimeType.match(/rate=(\d+)/i)
    const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000

    const wavBlob = pcmToWav(bytes, sampleRate, 1)
    const url = URL.createObjectURL(wavBlob)
    const audio = new Audio(url)
    audio.onended = () => URL.revokeObjectURL(url)
    audio.play().catch(err => console.error('Audio play error:', err))
  } catch (err) {
    console.error('Gemini audio play error:', err)
  }
}

// PCM 16-bit → WAV blob
function pcmToWav(pcmBytes: Uint8Array, sampleRate: number, channels: number): Blob {
  const dataSize  = pcmBytes.byteLength
  const buffer    = new ArrayBuffer(44 + dataSize)
  const view      = new DataView(buffer)

  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i))
  }

  writeStr(0,  'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8,  'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * channels * 2, true)
  view.setUint16(32, channels * 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)

  const out = new Uint8Array(buffer)
  out.set(pcmBytes, 44)

  return new Blob([buffer], { type: 'audio/wav' })
}

// ─── Brauzer TTS (fallback) ────────────────────────────────
export function speakBrowser(text: string) {
  if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'uz-UZ'
    u.rate = 1.05
    window.speechSynthesis.speak(u)
  } catch {}
}

// ─── MediaRecorder uchun mime type aniqlash ────────────────
export function detectAudioMimeType(): string {
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus'
  if (MediaRecorder.isTypeSupported('audio/webm'))             return 'audio/webm'
  if (MediaRecorder.isTypeSupported('audio/mp4'))              return 'audio/mp4'
  return ''
}
