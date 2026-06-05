import * as sql from 'mssql'
import { getConnection, DbConfig } from '../connection'
import log from 'electron-log'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Modelos internos ────────────────────────────────────────────────────────

export interface DatosDespachoRow {
  NumeroTransaccion: number
  Hora:              number
  Fecha:             number
  Posicion:          number
  Terminal:          number
  Tarjeta:           number
  TipoDeRegistro:    string
  Litros:            number
  Nota:              number
  Importe:           number
  CodEstacion:       number
  Estacion:          string
  CodProd:           number
  ClaveProd:         string
  ClaveEst:          string
  Producto:          string
  NombreCliente:     string
  CodigoCliente:     number
  CodExt:            number
  Rfc:               string
  DomicilioCliente:  string
  ColoniaCliente:    string
  CiudadCliente:     string
  EstadoCliente:     string
  CodPostCliente:    string
  Placas:            string
  Precio:            number
  NumeroPAT:         string
  NombreVehiculo:    string
  Grupo:             string
  Odometro:          number
  AcumMes:           number
  DebSaldo:          number
  Factura:           number
  NumeroTarjeta:     string
  ReferenciaTarjeta: string
  AprobacionTarjeta: string
  TipoTarjeta:       string
  CodigoGas:         number
  NumeroVehiculo:    number
  NumeroTurno:       number
  MontoAsignado:     number
  NumeroEconomico:   string
  Permiso:           string
  Estado:            string
}

// ─── Funciones exportadas ────────────────────────────────────────────────────

/**
 * Obtiene los datos completos de un despacho de crédito.
 * Equivale a SqlRepositories.GetDatosDespachoAsync() del proyecto C#.
 */
export async function getDatosDespacho(
  config: DbConfig,
  fechaDesde: number,
  fechaHasta: number,
  numTrn: number
): Promise<DatosDespachoRow[]> {
  try {
    const pool = await getConnection(config)
    const sqlQuery = readSql('ObtDespacho.sql')

    const result = await pool
      .request()
      .input('fechaDesde', sql.Float, fechaDesde)
      .input('fechaHasta', sql.Float, fechaHasta)
      .input('numTrn',     sql.Int,   numTrn)
      .query(sqlQuery)

    log.info(`[DespachosRepo] getDatosDespacho → ${result.recordset.length} registros (nroTrn=${numTrn})`)
    return result.recordset as DatosDespachoRow[]
  } catch (error) {
    log.error('[DespachosRepo] Error en getDatosDespacho:', error)
    throw error
  }
}

/**
 * Lista los despachos de crédito de una gasolinera en un rango de fechas.
 * Equivale a SqlRepositories.GetTipoDespachoCreditoAsync() del proyecto C#.
 */
export async function getDespachosCredito(
  config: DbConfig,
  fechaInicial: number,
  fechaFinal: number,
  codGas: number
): Promise<{ NROTRN: number }[]> {
  try {
    const pool = await getConnection(config)
    const sqlQuery = readSql('ObtDespachosCredito.sql')

    const result = await pool
      .request()
      .input('fechaInicial', sql.Float, fechaInicial)
      .input('fechaFinal',   sql.Float, fechaFinal)
      .input('codGas',       sql.Int,   codGas)
      .query(sqlQuery)

    log.info(`[DespachosRepo] getDespachosCredito → ${result.recordset.length} registros (codGas=${codGas})`)
    return result.recordset
  } catch (error) {
    log.error('[DespachosRepo] Error en getDespachosCredito:', error)
    throw error
  }
}

/**
 * Obtiene la tasa IEPS vigente para un producto/gasolinera en una fecha.
 * Equivale a SqlRepositories.GetIepsAsync() del proyecto C#.
 */
export async function getIeps(
  config: DbConfig,
  fecha: number,   // OLE date
  codProd: number,
  codGas: number
): Promise<number> {
  try {
    const pool = await getConnection(config)
    const sqlQuery = readSql('ObtIeps.sql')

    const result = await pool
      .request()
      .input('fecha',   sql.Float, fecha)
      .input('codprod', sql.Int,   codProd)
      .input('CodGas',  sql.Int,   codGas)
      .query(sqlQuery)

    const ieps = result.recordset[0]?.IEPS ?? 0
    log.info(`[DespachosRepo] getIeps → ${ieps} (codProd=${codProd}, codGas=${codGas})`)
    return Number(ieps)
  } catch (error) {
    log.error('[DespachosRepo] Error en getIeps:', error)
    throw error
  }
}
