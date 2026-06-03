import { API_BASE_URL, API_KEY_HEADER_NAME, API_KEY_HEADER_VALUE } from './constants'
import log from 'electron-log'

// ─── Modelos exactos que regresa la API ───────────────────────────────────────

/** Respuesta de GET /api/v1/Sucursales/VerificarFolio */
export interface VerificarFolioItem {
  ID:               number
  FOLIO:            number
  NUM_IMPRESIONES:  number
  UsuarioCreacion:  string | null
  UltimoUsuario:    string | null
  FechaCreacion:    string | null
  Fum:              string | null
  ID_CONTROL_GAS:   number
  NOMBRE_GASOLINERA: string | null
  YA_FUE_REIMPRESO: boolean
}

/** Respuesta de GET /api/v1/Sucursales/InsertarFolio */
export interface InsertarFolioItem {
  ID:             number
  FOLIO:          number
  NUM_IMPRESIONES: number
  RESULTADO:      string
}

const HEADERS = {
  [API_KEY_HEADER_NAME]: API_KEY_HEADER_VALUE,
  Accept: 'application/json'
}

/**
 * GET /api/v1/Sucursales/VerificarFolio?folio={folio}&idControlGas={idControlGas}
 * Retorna lista vacía si el folio nunca fue impreso.
 */
export async function verificarFolio(
  folio:        number,
  idControlGas: number
): Promise<VerificarFolioItem[]> {
  const url = new URL(`${API_BASE_URL}/api/v1/Sucursales/VerificarFolio`)
  url.searchParams.set('folio',        String(folio))
  url.searchParams.set('idControlGas', String(idControlGas))

  log.info(`[ReimpresionesService] GET ${url.toString()}`)

  const res = await fetch(url.toString(), { headers: HEADERS })
  if (!res.ok) throw new Error(`VerificarFolio: ${res.status} ${res.statusText}`)

  return res.json() as Promise<VerificarFolioItem[]>
}

/**
 * GET /api/v1/Sucursales/InsertarFolio?folio={folio}&idControlGas={idControlGas}&nombreSucursal={n}&usuario={u}
 * Inserta o incrementa NUM_IMPRESIONES del folio.
 */
export async function insertarFolio(
  folio:          number,
  idControlGas:   number,
  nombreSucursal: string,
  usuario:        string
): Promise<InsertarFolioItem[]> {
  const url = new URL(`${API_BASE_URL}/api/v1/Sucursales/InsertarFolio`)
  url.searchParams.set('folio',          String(folio))
  url.searchParams.set('idControlGas',   String(idControlGas))
  url.searchParams.set('nombreSucursal', nombreSucursal)
  url.searchParams.set('usuario',        usuario)

  log.info(`[ReimpresionesService] GET ${url.toString()}`)

  const res = await fetch(url.toString(), { headers: HEADERS })
  if (!res.ok) throw new Error(`InsertarFolio: ${res.status} ${res.statusText}`)

  return res.json() as Promise<InsertarFolioItem[]>
}
