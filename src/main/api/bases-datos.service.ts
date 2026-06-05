import { API_BASE_URL, API_KEY_HEADER_NAME, API_KEY_HEADER_VALUE } from './constants'
import log from 'electron-log'

// ─── Modelo que devuelve la API ───────────────────────────────────────────────

export interface BaseDatosApiResponse {
  id:            number
  idSucursal:    number
  nombre:        string        // "SG" | "REIMPRESIONTICKETS" | ...
  identificador: string        // "ReimpresionTicketsGasolineras" | ...
  tipo:          string
  activo:        boolean
  cadena:        string        // connection string ENCRIPTADA (no usar directamente)
  referencia1:   string
  referencia2:   string
  referencia3:   string        // connection string en TEXTO PLANO ← usar esta
  referencia4:   string
}

// ─── Modelo de configuración de BD para uso interno ──────────────────────────

export interface DbConfigParsed {
  server:   string
  database: string
  user:     string
  password: string
  port:     number
}

/**
 * Llama a GET /api/v1/Sucursales/GetBasesDatos?id=-1&idSucursal=-1&direccionIP={ip}
 *
 * El endpoint usa la IP del servidor de la sucursal (sucursal.direccionIP)
 * para retornar todas las cadenas de conexión configuradas.
 *
 * Campos clave del response:
 *   - nombre      → identifica la BD ("SG", "REIMPRESIONTICKETS", etc.)
 *   - referencia3 → connection string en texto plano (p.ej. "Data Source=10.4.10.2; User id=usrOperadorCG; Password=xxx;")
 *   - cadena      → connection string encriptada (no se usa aquí)
 */
export async function getBasesDatos(direccionIP: string): Promise<BaseDatosApiResponse[]> {
  const url = new URL(`${API_BASE_URL}/api/v1/Sucursales/GetBasesDatos`)
  url.searchParams.set('id',          '-1')
  url.searchParams.set('idSucursal',  '-1')
  url.searchParams.set('direccionIP', direccionIP)

  log.info(`[BasesDatosService] GET ${url.toString()}`)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      [API_KEY_HEADER_NAME]: API_KEY_HEADER_VALUE,
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Error al obtener bases de datos: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as BaseDatosApiResponse[]
  log.info(`[BasesDatosService] BDs recibidas: ${data.map((d) => d.nombre).join(', ')}`)
  return data
}

/**
 * Parsea una connection string al formato { server, database, user, password, port }.
 *
 * Soporta el formato de SQL Server:
 *   "Data Source = 10.4.10.2; User id = usrOperadorCG; Password = xxx;"
 *   "Server=host,1433; Database=SG; User Id=sa; Password=xxx;"
 *
 * Si no se encuentra el campo Database en la cadena, se usa el
 * parámetro `fallbackDatabase` (normalmente el campo `nombre` del response).
 */
export function parsearConnectionString(
  cadena:           string,
  fallbackDatabase: string = ''
): DbConfigParsed {
  const get = (...keys: string[]): string => {
    for (const key of keys) {
      const match = cadena.match(new RegExp(`${key}\\s*=\\s*([^;]+)`, 'i'))
      if (match) return match[1].trim()
    }
    return ''
  }

  const serverRaw = get('Data Source', 'Server', 'Host')
  // Soporta "10.4.10.2" | "10.4.10.2,1433" | "10.4.10.2\\instancia"
  const [serverHost, serverPort] = serverRaw.split(/[,\\]/)

  const database =
    get('Initial Catalog', 'Database') ||
    fallbackDatabase

  return {
    server:   serverHost.trim(),
    database: database.trim(),
    user:     get('User id', 'User Id', 'User ID', 'uid', 'Username').trim(),
    password: get('Password', 'pwd').trim(),
    port:     serverPort ? Number(serverPort.trim()) : 1433
  }
}
