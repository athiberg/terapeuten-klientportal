import crypto from 'crypto'

const keyB64 = process.env.ENCRYPTION_KEY || ''
let KEY: Buffer
try {
  KEY = Buffer.from(keyB64, 'base64')
} catch {
  KEY = Buffer.alloc(32)
}

export function encrypt(s: string) {
  const iv = crypto.randomBytes(12)
  const c = crypto.createCipheriv('aes-256-gcm', KEY, iv)
  const enc = Buffer.concat([c.update(s, 'utf8'), c.final()])
  const tag = c.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decrypt(b64: string) {
  const b = Buffer.from(b64, 'base64')
  const iv = b.subarray(0, 12)
  const tag = b.subarray(12, 28)
  const enc = b.subarray(28)
  const d = crypto.createDecipheriv('aes-256-gcm', KEY, iv)
  d.setAuthTag(tag)
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8')
}
