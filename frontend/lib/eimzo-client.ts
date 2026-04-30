export interface EimzoKey {
  alias:     string
  subjectDn: string
  issuerDn:  string
  notBefore: string
  notAfter:  string
  serialNum: string
  type:      string
  disk?:     string
}

class EimzoClient {
  private ws:      WebSocket | null = null
  private pending: Map<string, { resolve: Function; reject: Function }> = new Map()
  private msgId   = 0

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('ws://127.0.0.1:64646')

      this.ws.onopen = () => resolve()

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const pend = this.pending.get(data.id)
          if (pend) {
            this.pending.delete(data.id)
            if (data.status === 'ok') {
              pend.resolve(data)
            } else {
              pend.reject(new Error(data.reason || 'E-imzo xatolik'))
            }
          }
        } catch {}
      }

      this.ws.onerror   = () => reject(new Error('E-imzo ilovasi topilmadi'))
      this.ws.onclose   = () => { this.ws = null }
    })
  }

  async listKeys(): Promise<EimzoKey[]> {
    const response = await this.send({ method: 'listAllUserKeys' })
    return response.keys || []
  }

  async sign(alias: string, challenge: string): Promise<{
    signature: string; certificate: string
  }> {
    const response = await this.send({
      method: 'createPkcs7',
      id:     alias,
      data:   challenge,
    })
    return {
      signature:   response.pkcs7b64 || '',
      certificate: response.sertifikat || '',
    }
  }

  private send(data: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('E-imzo ga ulanilmagan'))
        return
      }
      const id = String(++this.msgId)
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ ...data, id }))
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id)
          reject(new Error('E-imzo javob bermadi'))
        }
      }, 30_000)
    })
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
