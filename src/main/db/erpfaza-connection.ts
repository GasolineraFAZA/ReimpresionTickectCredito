import * as sql from 'mssql'
import log from 'electron-log'

/**
 * Configuración fija de la BD central ERPFaza.
 * Este servidor es compartido por todas las sucursales — no es por-sucursal.
 */
const ERPFAZA_CONFIG: sql.config = {
  server:   '10.10.0.245',
  database: 'ERPFaza',
  user:     'sa',
  password: 'F.D3v0luc10n3s.F',
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
