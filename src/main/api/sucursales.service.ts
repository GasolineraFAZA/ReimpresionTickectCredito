import { API_BASE_URL, API_KEY_HEADER_NAME, API_KEY_HEADER_VALUE } from './constants'
import log from 'electron-log'

export interface SucursalModel {
  id: number
  idControlGas: number
  nombre: string
  tipo: string
  activo: boolean
  extension: string
  anyDesk: string
  anyDeskPass: string
  teamViewer: string
  teamViewerPass: string
  direccionIP: string
  direccionIPAdicional: string
  direccion: string
  referencia1: string
  referencia2: string
  referencia3: string
  referencia4: string
  baseDatosLocal: string
}

/**
 * Llama a GET /api/v1/Sucursales/Get?direccionIp={ip}
 * y devuelve la lista de sucursales que coinciden con esa IP.
 */
export async function getSucursalPorIp(direccionIp: string): Promise<SucursalModel[]> {
  const url = new URL(`${API_BASE_URL}/api/v1/Sucursales/Get`)
  url.searchParams.set('direccionIp', direccionIp)

  log.info(`[SucursalesService] GET ${url.toString()}`)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      [API_KEY_HEADER_NAME]: API_KEY_HEADER_VALUE,
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Error al obtener sucursal: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as SucursalModel[]
  log.info(`[SucursalesService] Sucursales encontradas: ${data.length}`)
  return data
}
