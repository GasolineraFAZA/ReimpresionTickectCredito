import * as sql from 'mssql'
import { getConnection, DbConfig } from '../connection'
import log from 'electron-log'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

function getSqlPath(filename: string): string {
  const base = app.isPackaged
    ? join(process.resourcesPath, 'sql')
    : join(app.getAppPath(), 'src', 'main', 'db', 'sql')
  return join(base, filename)
}

function readSql(filename: string): string {
  const path = getSqlPath(filename)
  if (!existsSync(path)) {
    throw new Error(`Archivo SQL no encontrado: ${path}`)
  }
  return readFileSync(path, 'utf-8')
}

export async function getVerRegistrosTicket(
  config: DbConfig,
  fechaIni: number,
  fechaFin: number,
  todasFechas: number,
  todosIds: number,
  despacho: number,
  todosDespachos: number
): Promise<any[]> {
  try {
    const pool = await getConnection(config)
    const sqlQuery = readSql('VerRegistrosTickets.sql')

    const result = await pool
      .request()
      .input('FECHA_INI', sql.Int, fechaIni)
      .input('FECHA_FIN', sql.Int, fechaFin)
      .input('TODAS_FECHAS', sql.Int, todasFechas)
      .input('ID', sql.Int, 2)
      .input('TODOS_IDS', sql.Int, todosIds)
      .input('DESPACHO', sql.Int, despacho)
      .input('TODOS_DESPACHOS', sql.Int, todosDespachos)
      .query(sqlQuery)

    log.info(`[TicketsRepo] getVerRegistrosTicket retornó ${result.recordset.length} registros`)
    return result.recordset

  } catch (error) {
    log.error('[TicketsRepo] Error en getVerRegistrosTicket:', error)
    throw error
  }
}

export async function insertarRegTicket(
  config: DbConfig,
  turno: number,
  despacho: number,
  cajero: string,
  fecha: Date,
  usuario: string,
  numImpresiones: number,
  numVehiculo: number,
  motivo: string,
  cliente: string,
  litros: number,
  importe: number
): Promise<void> {
  try {
    const pool = await getConnection(config)
    const sqlQuery = readSql('InsertarRegTicket.sql')

    await pool
      .request()
      .input('TURNO', sql.Int, turno)
      .input('DESPACHO', sql.BigInt, despacho)
      .input('CAJERO', sql.VarChar, cajero)
      .input('FECHA', sql.DateTime, fecha)
      .input('USUARIO', sql.VarChar, usuario)
      .input('NUM_IMPRESIONES', sql.Int, numImpresiones)
      .input('NUMEROVEHICULO', sql.Int, numVehiculo)
      .input('MOTIVO', sql.VarChar, motivo)
      .input('CLIENTE', sql.VarChar, cliente)
      .input('LITROS', sql.Float, litros)
      .input('IMPORTE', sql.Float, importe)
      .query(sqlQuery)

    log.info('[TicketsRepo] insertarRegTicket ejecutado correctamente')

  } catch (error) {
    log.error('[TicketsRepo] Error en insertarRegTicket:', error)
    throw error
  }
}