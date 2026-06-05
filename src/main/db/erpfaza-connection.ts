import * as sql from 'mssql'
import log from 'electron-log'

const ERPFAZA_CONFIG: sql.config = {
  server:   process.env['ERPFAZA_SERVER']   ?? '',
  database: process.env['ERPFAZA_DATABASE'] ?? 'ERPFaza',
  user:     process.env['ERPFAZA_USER']     ?? '',
  password: process.env['ERPFAZA_PASSWORD'] ?? '',
  port:     1433,
  options: {
    encrypt:                false,
    trustServerCertificate: true,
    connectTimeout:         5000,
    requestTimeout:         10000
  }
}

let pool: sql.ConnectionPool | null = null

export async function getErpFazaConnection(): Promise<sql.ConnectionPool> {
  if (pool?.connected) return pool

  log.info('[ErpFaza] Conectando a ERPFaza...')
  pool = await new sql.ConnectionPool(ERPFAZA_CONFIG).connect()
  log.info('[ErpFaza] Conexión establecida')
  return pool
}
