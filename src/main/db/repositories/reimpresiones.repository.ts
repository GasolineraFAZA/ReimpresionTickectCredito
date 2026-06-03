import * as sql from 'mssql'
import { getErpFazaConnection } from '../erpfaza-connection'
import log from 'electron-log'

// ─── Modelos ──────────────────────────────────────────────────────────────────

export interface VerificacionFolioResult {
  ID:               number | null
  FOLIO:            number
  NUM_IMPRESIONES:  number
  UsuarioCreacion:  string | null
  UltimoUsuario:    string | null
  FechaCreacion:    Date   | null
  Fum:              Date   | null
  ID_CONTROL_GAS:   number
  NOMBRE_GASOLINERA: string | null
  YA_FUE_REIMPRESO: number   // 0 = nunca impreso, 1 = ya tiene registro
}

export interface RegistroReimpresionResult {
  ID:               number
  FOLIO:            number
  NUM_IMPRESIONES:  number
}

// ─── Funciones ────────────────────────────────────────────────────────────────

/**
 * Verifica si un folio ya fue reimpreso previamente.
 * Si YA_FUE_REIMPRESO = 1 → mostrar modal de autorización.
 */
export async function verificarFolioReimpreso(
  folio:        number,
  idControlGas: number
): Promise<VerificacionFolioResult | null> {
  try {
    const pool = await getErpFazaConnection()

    const result = await pool
      .request()
      .input('FOLIO',          sql.Int, folio)
      .input('ID_CONTROL_GAS', sql.Int, idControlGas)
      .execute('SP_VerificarFolioReimpreso')

    const row = result.recordset[0] ?? null
    log.info(
      `[ReimpresionesRepo] verificarFolioReimpreso folio=${folio} → ` +
      (row ? `NUM_IMPRESIONES=${row.NUM_IMPRESIONES}` : 'sin registro')
    )
    return row
  } catch (error) {
    log.error('[ReimpresionesRepo] Error en verificarFolioReimpreso:', error)
    throw error
  }
}

/**
 * Inserta o actualiza el registro de reimpresión en ERPFaza.
 * Si ya existe → incrementa NUM_IMPRESIONES.
 * Si no existe  → inserta con NUM_IMPRESIONES = 1.
 */
export async function insertarRegReimpresion(
  folio:            number,
  idControlGas:     number,
  nombreGasolinera: string,
  usuario:          string
): Promise<RegistroReimpresionResult> {
  try {
    const pool = await getErpFazaConnection()

    const result = await pool
      .request()
      .input('FOLIO',             sql.Int,         folio)
      .input('ID_CONTROL_GAS',    sql.Int,         idControlGas)
      .input('NOMBRE_GASOLINERA', sql.VarChar(200), nombreGasolinera)
      .input('UsuarioCreacion',   sql.VarChar(100), usuario)
      .input('UltimoUsuario',     sql.VarChar(100), usuario)
      .execute('SP_InsertarRegReimpresion')

    const row = result.recordset[0]
    log.info(
      `[ReimpresionesRepo] insertarRegReimpresion folio=${folio} → ` +
      `ID=${row?.ID} NUM_IMPRESIONES=${row?.NUM_IMPRESIONES}`
    )
    return row as RegistroReimpresionResult
  } catch (error) {
    log.error('[ReimpresionesRepo] Error en insertarRegReimpresion:', error)
    throw error
  }
}
