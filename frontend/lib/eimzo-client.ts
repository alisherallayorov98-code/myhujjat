export interface EimzoCert {
  alias:     string
  disk:      string
  path:      string
  name:      string
  subjectDn: string
  issuerDn:  string
  notBefore: string
  notAfter:  string
  serialNum: string
  type:      string
}

class EimzoClient {
  private ws:      WebSocket | null = null
  private pending: Map<string, { resolve: Function; reject: Function }> = new Map()
  private msgId    = 0

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return

    const urls = [
      'wss://127.0.0.1:64443/CAPI/ws',
      'wss://localhost:64443/CAPI/ws',
      'ws://127.0.0.1:64646/CAPI/ws',
      'ws://localhost:64646/CAPI/ws',
    ]

    for (const url of urls) {
      try {
        await new Promise<void>((resolve, reject) => {
          const ws    = new WebSocket(url)
          const timer = setTimeout(() => { ws.close(); reject(new Error('timeout')) }, 3000)

          ws.onopen = () => {
            clearTimeout(timer)
            this.ws = ws
            ws.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data)
                const pend = this.pending.get(String(data.id))
                if (pend) {
                  this.pending.delete(String(data.id))
                  if (data.success === true || data.success === 'true') pend.resolve(data)
                  else pend.reject(new Error(data.reason || data.message || 'E-imzo xatolik'))
                }
              } catch {}
            }
            ws.onclose = () => { if (this.ws === ws) this.ws = null }
            resolve()
          }
          ws.onerror = () => { clearTimeout(timer); reject(new Error('error')) }
        })
        return
      } catch {
        // keyingi URL ga o'tamiz
      }
    }
    throw new Error('E-imzo ilovasi topilmadi')
  }

  private call(plugin: string, name: string, args: string[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('E-imzo ga ulanilmagan'))
        return
      }
      const id  = String(++this.msgId)
      const msg: Record<string, any> = { plugin, name, id }
      if (args.length > 0) msg.arguments = args
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify(msg))
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id)
          reject(new Error('E-imzo javob bermadi (timeout)'))
        }
      }, 30_000)
    })
  }

  async listCertificates(): Promise<EimzoCert[]> {
    const res = await this.call('pfx', 'list_all_certificates')
    return res.certificates || res.keys || []
  }

  async loadKey(cert: EimzoCert): Promise<string> {
    const res = await this.call('pfx', 'load_key', [
      cert.disk,
      cert.path || '',
      cert.name,
      cert.alias,
    ])
    return res.keyId || res.id || ''
  }

  async sign(keyId: string, challengeHex: string): Promise<string> {
    // challenge hex → base64 (E-IMZO create_pkcs7 data_64 talab qiladi)
    const base64 = btoa(challengeHex)
    const res = await this.call('pkcs7', 'create_pkcs7', [base64, keyId, 'no'])
    return res.pkcs7 || res.pkcs7b64 || ''
  }

  async unloadKey(keyId: string): Promise<void> {
    await this.call('pfx', 'unload_key', [keyId]).catch(() => {})
  }

  disconnect() { this.ws?.close() }
}

export const eimzoClient = new EimzoClient()

export async function checkEimzoInstalled(): Promise<boolean> {
  try {
    await eimzoClient.connect()
    return true
  } catch {
    return false
  }
}
