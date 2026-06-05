import crypto from 'crypto'

/**
 * Replica EXACTA de Crypto.Utilities.CryptoUtility del proyecto C#.
 * Algoritmo:  Rijndael / AES-256-CBC con PBKDF2 (SHA1, 1000 iter, 32 bytes).
 * Las claves se leen del .env — NUNCA hardcodeadas en código.
 */

const SALT_KEY      = process.env['CRYPTO_SALT']     ?? ''
const IV_KEY        = process.env['CRYPTO_IV']        ?? ''
const PASSWORD_HASH = process.env['CRYPTO_PASSWORD']  ?? ''

const KEY = crypto.pbkdf2Sync(
  PASSWORD_HASH,
  Buffer.from(SALT_KEY, 'ascii'),
  1000,
  32,
  'sha1'
)
const IV = Buffer.from(IV_KEY, 'ascii') // 16 bytes

/**
 * Desencripta una cadena Base64 producida por CryptoUtility.Encrypt() del C#.
 */
export function decrypt(encryptedText: string): string {
  const data = Buffer.from(encryptedText, 'base64')

  const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, IV)
  decipher.setAutoPadding(false)

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return decrypted.toString('utf8').replace(/\0+$/, '')
}
