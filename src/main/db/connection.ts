import * as sql from 'mssql'
import log from 'electron-log'

export interface DbConfig {
  server:   string
  database: string
  user:     string
  password: string
  port?:    number
}

/**
 * Cache de pools por "server:port/database".
 * Permite conexiones simultáneas a distintos servidores (SG, ERPFaza, etc.)
 */
const pools = new Map<string, sql.ConnectionPool>()

function poolKey(config: DbConfig): string {
  return `${config.server}:${config.port ?? 1433}/${config.database}`
}

export async function getConnection(config: DbConfig): Promise<sql.ConnectionPool> {
  const key = poolKey(config)

  const existing = pools.get(key)
  if (existing?.connected) return existing

  log.info(`[DB] Conectando → ${key}`)
  log.info(`[DB] server="${config.server}" | database="${config.database}" | user="${config.user}" | password="${config.password}" | port=${config.port ?? 1433}`)
  log.info(`[DB] password_length=${config.password.length} | char_codes=[${[...config.password].map(c => c.charCodeAt(0)).join(',')}]`)

  const pool = await new sql.ConnectionPool({
    server:   config.server,
    // Si database está vacío no lo mandamos — SQL Server usa el default del usuario
    ...(config.database ? { database: config.database } : {}),
    user:     config.user,
    password: config.password,
    port:     config.port ?? 1433,
    options: {
      encrypt:                false,
      trustServerCertificate: true,
      connectTimeout:         8000,
      requestTimeout:         15000
    }
  }).connect()

  pools.set(key, pool)
  log.info(`[DB] Conectado → ${key}`)
  return pool
}

export async function closeAllConnections(): Promise<void> {
  for (const [key, pool] of pools.entries()) {
    await pool.close()
    log.info(`[DB] Conexión cerrada → ${key}`)
  }
  pools.clear()
}
