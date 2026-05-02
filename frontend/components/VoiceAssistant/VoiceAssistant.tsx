'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Mic, MicOff, Loader2, X, Sparkles,
  Check, AlertCircle, Volume2,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import toast from 'react-hot-toast'
import {
  blobToBase64, playGeminiAudio, speakBrowser, detectAudioMimeType,
} from './audio'

type Status = 'idle' | 'recording' | 'processing' | 'done' | 'error'

interface ToolCall {
  name:    string
  result:  any
  success: boolean
  error?:  string
}

interface VoiceMessage {
  role:        'user' | 'assistant'
  text:        string
  toolsCalled?: ToolCall[]
  timestamp:   number
}

const TOOL_KEYS = [
  'createCounterparty',
  'createContract',
  'listContracts',
  'searchStir',
  'getStats',
] as const

export function VoiceAssistant() {
  const t              = useTranslations('voiceAssistant')
  const { currentOrg } = useAuth()
  const qc             = useQueryClient()

  function toolLabel(name: string): string {
    if ((TOOL_KEYS as readonly string[]).includes(name)) {
      return (t as any)(`tools.${name}`)
    }
    return name
  }

  const [open,        setOpen]        = useState(false)
  const [status,      setStatus]      = useState<Status>('idle')
  const [messages,    setMessages]    = useState<VoiceMessage[]>([])
  const [textInput,   setTextInput]   = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef   = useRef<Blob[]>([])
  const messagesEndRef   = useRef<HTMLDivElement>(null)
  const startTimeRef     = useRef<number>(0)
  const [recSeconds, setRecSeconds] = useState(0)

  // Recording timer
  useEffect(() => {
    if (status !== 'recording') return
    const t = setInterval(() => {
      setRecSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 250)
    return () => clearInterval(t)
  }, [status])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  // ─── Mikrofon yozish (click-toggle) ────────────────────────
  async function toggleRecording() {
    if (status === 'recording') {
      stopRecording()
      return
    }
    if (status !== 'idle') return

    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error(t('errorMicNotSupported'))
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = detectAudioMimeType()
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      audioChunksRef.current = []
      startTimeRef.current   = Date.now()
      setRecSeconds(0)

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const duration = Date.now() - startTimeRef.current
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' })
        if (duration < 500 || blob.size < 1500) {
          toast.error(t('errorTooShort'))
          setStatus('idle')
          return
        }
        await sendAudio(blob, mr.mimeType || 'audio/webm')
      }

      mediaRecorderRef.current = mr
      mr.start(250) // har 250ms data event
      setStatus('recording')

      // Auto-stop 30 sekunddan so'ng (xavfsizlik)
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording()
        }
      }, 30_000)
    } catch (err: any) {
      console.error(err)
      toast.error(t('errorMicPermission'))
      setStatus('idle')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  // ─── Audio'ni base64 → backend ──────────────────────────────
  async function sendAudio(blob: Blob, mimeType: string) {
    setStatus('processing')
    try {
      const base64 = await blobToBase64(blob)
      // Mime type'dan codecs qismini olib tashlash (Gemini'ga toza mime kerak)
      const cleanMime = mimeType.split(';')[0]
      await sendCommand({ audio: { data: base64, mimeType: cleanMime } })
    } catch (err: any) {
      toast.error(t('errorAudioSend'))
      setStatus('error')
    }
  }

  // ─── Matn yuborish ──────────────────────────────────────────
  async function sendText() {
    const txt = textInput.trim()
    if (!txt) return
    setTextInput('')
    setStatus('processing')
    await sendCommand({ text: txt })
  }

  // ─── API chaqiruv + javob qayta ishlash ─────────────────────
  async function sendCommand(payload: { text?: string; audio?: { data: string; mimeType: string } }) {
    try {
      const { data } = await api.post('/voice/command', {
        ...payload,
        orgId: currentOrg?.id,
      })

      // Foydalanuvchi xabari (transcript)
      if (data.transcript) {
        setMessages(m => [...m, {
          role:      'user',
          text:      data.transcript,
          timestamp: Date.now(),
        }])
      }

      // Agent javobi
      setMessages(m => [...m, {
        role:        'assistant',
        text:        data.response || t('doneFallback'),
        toolsCalled: data.toolsCalled,
        timestamp:   Date.now(),
      }])

      // Tool chaqirilgan bo'lsa — kerakli queries'ni invalidate qilish
      const tools = (data.toolsCalled || []) as ToolCall[]
      if (tools.some(t => t.name === 'createCounterparty')) {
        qc.invalidateQueries({ queryKey: ['counterparties'] })
      }
      if (tools.some(t => t.name === 'createContract')) {
        qc.invalidateQueries({ queryKey: ['contracts'] })
        qc.invalidateQueries({ queryKey: ['contracts-stats'] })
        qc.invalidateQueries({ queryKey: ['recent-contracts'] })
      }

      // Agent javobini ovozda o'qish — Gemini TTS audio bo'lsa shuni o'ynaymiz
      if (data.audio?.data) {
        playGeminiAudio(data.audio.data, data.audio.mimeType)
      } else {
        speakBrowser(data.response) // fallback: brauzer TTS
      }

      setStatus('done')
      setTimeout(() => setStatus('idle'), 800)
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('errorGeneric')
      setMessages(m => [...m, { role: 'assistant', text: `❌ ${msg}`, timestamp: Date.now() }])
      setStatus('error')
      setTimeout(() => setStatus('idle'), 1500)
    }
  }

  return (
    <>
      {/* Floating mic button — chap pastda (SupportChat o'ng pastda) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
          aria-label="Mira — ovozli yordamchi"
        >
          <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 px-1 py-0.5 rounded-full bg-[#16A34A] text-[8px] font-bold border-2 border-white leading-none">AI</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed inset-x-4 bottom-20 md:inset-auto md:bottom-6 md:left-6 md:w-[400px] z-50 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[calc(100vh-160px)] md:max-h-[600px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <Sparkles size={15} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">Mira</p>
                <p className="text-[11px] text-white/70 mt-0.5">AI ovozli yordamchi</p>
              </div>
            </div>
            <button
              onClick={() => { setOpen(false); window.speechSynthesis?.cancel() }}
              className="p-1.5 rounded-lg hover:bg-white/15 transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
            {messages.length === 0 && status === 'idle' && (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#DBEAFE] flex items-center justify-center mx-auto mb-3">
                  <Mic size={24} className="text-[#7C3AED]" />
                </div>
                <p className="text-sm font-semibold text-[#0F172A] mb-2">Salom! Men Miraman 👋</p>
                <p className="text-xs text-[#94A3B8] mb-4 max-w-xs mx-auto">
                  Mikrofonni bosib gapiring yoki pastdan matn yozing
                </p>
                <div className="space-y-1.5 text-left max-w-xs mx-auto">
                  {[
                    "💬 «Bu oy nechta shartnoma yaratilgan?»",
                    "💬 «Toshmatov MChJ uchun shartnoma yarat»",
                    "💬 «STIR 302756789 ni qidir»",
                  ].map((t, i) => (
                    <div key={i} className="text-xs text-[#475569] bg-white rounded-lg px-3 py-2 border border-[#E2E8F0]">
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div className={cn(
                  'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm',
                  m.role === 'user'
                    ? 'bg-[#2563EB] text-white rounded-br-sm'
                    : 'bg-white border border-[#E2E8F0] text-[#0F172A] rounded-bl-sm'
                )}>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  {m.toolsCalled && m.toolsCalled.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#F1F5F9] space-y-1">
                      {m.toolsCalled.map((t, j) => (
                        <div key={j} className="flex items-center gap-1.5 text-xs">
                          {t.success
                            ? <Check       size={11} className="text-[#16A34A] shrink-0" />
                            : <AlertCircle size={11} className="text-[#DC2626] shrink-0" />
                          }
                          <span className={t.success ? 'text-[#15803D]' : 'text-[#DC2626]'}>
                            {toolLabel(t.name)}
                            {!t.success && t.error && `: ${t.error}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {status === 'processing' && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                  <div className="flex items-center gap-2 text-[#94A3B8]">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-xs">O'ylamoqda...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer — input + mic */}
          <div className="border-t border-[#E2E8F0] p-3 bg-white">
            <div className="flex items-end gap-2">
              <input
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendText() }}
                placeholder={t('inputPlaceholder')}
                disabled={status === 'recording' || status === 'processing'}
                className="flex-1 h-10 rounded-lg text-sm px-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 disabled:opacity-60"
              />
              <button
                onClick={toggleRecording}
                disabled={status === 'processing'}
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-all shrink-0',
                  status === 'recording'
                    ? 'bg-[#DC2626] text-white scale-110 shadow-lg shadow-[#DC2626]/30'
                    : status === 'processing'
                    ? 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed'
                    : 'bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-white hover:shadow-md'
                )}
                aria-label={status === 'recording' ? 'To\'xtatish' : 'Mikrofon'}
              >
                {status === 'recording'
                  ? <MicOff size={16} />
                  : status === 'processing'
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Mic size={16} />
                }
              </button>
            </div>
            <p className="text-[10px] text-[#94A3B8] mt-1.5 text-center">
              {status === 'recording' ? (
                <span className="text-[#DC2626] font-medium">
                  🔴 Yozilmoqda... {recSeconds}s — to'xtatish uchun qaytadan bosing
                </span>
              ) : status === 'processing' ? (
                "AI o'ylamoqda..."
              ) : (
                "Mikrofonni bosib gapiring · Enter — yuborish"
              )}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

