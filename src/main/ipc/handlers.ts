import { ipcMain, BrowserWindow, app } from 'electron'
import { networkInterfaces }      from 'os'
import log                        from 'electron-log'

import type { DbConfig }                                          from '../db/connection'
import { getDatosDespacho, getDespachosCredito, getIeps }        from '../db/repositories/despachos.repository'
import { getVerRegistrosTicket, insertarRegTicket }               from '../db/repositories/tickets.repository'
import { verificarFolio, insertarFolio }                         from '../api/reimpresiones.service'
import { getSucursalPorIp }                                       from '../api/sucursales.service'
import { getBasesDatos, parsearConnectionString }                  from '../api/bases-datos.service'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Primera IP privada IPv4 de la máquina (no loopback). */
function getLocalIp(): string {
  const nets = networkInterfaces()
  for (const ifaces of Object.values(nets)) {
    for (const iface of ifaces ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return '127.0.0.1'
}

/**
 * Fecha ISO (del formulario) → número OLE Automation.
 * La BD SG almacena fechas como días decimales desde 1899-12-30.
 */
function isoToOle(isoDate: string): number {
  const epoch = new Date(1899, 11, 30).getTime()
  return (new Date(isoDate).getTime() - epoch) / 86400000
}

/**
 * OLE date → "dd/MM/yyyy"
 * Equivale a DateTime.FromOADate(fecha + 1) del C# (offset +1 de la BD SG).
 */
function oleToDateStr(ole: number): string {
  if (!ole) return ''
  const epoch = new Date(1899, 11, 30).getTime()
  return new Date(epoch + (ole + 1) * 86400000)
    .toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Campo Hora (entero HHMM p.ej. 1430) → "14:30"
 * Equivale a CommonUtilities.ConvertirAHoras() del C#.
 */
function horaIntToStr(hratrn: number): string {
  if (!hratrn) return '00:00'
  return (hratrn / 100).toFixed(2).padStart(5, '0').replace('.', ':')
}

/**
 * Calcula (subtotal, iva, total) con la fórmula exacta del C#:
 *   IEPS     = Litros × iepsRate
 *   Total    = Precio × Litros
 *   BIVA     = (Total − IEPS) / 1.16
 *   SubTotal = BIVA + IEPS
 *   IVA      = BIVA × 0.16
 */
function calcTotales(precio: number, litros: number, iepsRate: number) {
  const ieps     = litros * iepsRate
  const total    = precio * litros
  const biva     = (total - ieps) / 1.16
  const subtotal = biva + ieps
  const iva      = biva * 0.16
  const r2 = (n: number) => Math.round(n * 100) / 100
  return { subtotal: r2(subtotal), iva: r2(iva), total: r2(total) }
}

// ─── Cache de configuración de BD ────────────────────────────────────────────

/** Cache en memoria para no llamar la API en cada operación. */
const dbConfigCache = new Map<string, DbConfig>() // clave: direccionIP

/**
 * Obtiene la DbConfig de la BD "SG" para una sucursal.
 *
 * Flujo:
 *  1. GET /api/v1/Sucursales/GetBasesDatos?id=-1&idSucursal=-1&direccionIP={ip}
 *  2. Busca el registro con nombre="SG" e identificador="ReimpresionTicketsGasolineras"
 *  3. Parsea referencia3 (connection string en texto plano)
 *  4. Usa el campo nombre="SG" como nombre de base de datos si no está en la cadena
 */
async function getSgDbConfig(direccionIP: string, database: string): Promise<DbConfig> {
  const cacheKey = `${direccionIP}/${database}`
  if (dbConfigCache.has(cacheKey)) return dbConfigCache.get(cacheKey)!

  const bases = await getBasesDatos(direccionIP)

  log.info(`[Handlers] Registros BD recibidos: ${JSON.stringify(
    bases.map(b => ({ nombre: b.nombre, id: b.id, ref3: b.referencia3?.substring(0, 30) ?? '' }))
  )}`)

  // ── Encontrar la cadena de conexión ───────────────────────────────────────
  // La cadena puede estar en referencia3 de cualquier registro.
  // Estrategia: buscar primero en el registro SG, luego en el resto.
  // La cadena apunta al mismo servidor que la IP de la sucursal (direccionIP).
  // Recolecta todas las cadenas candidatas (ref3 y ref2 de todos los registros)
  // para poder loguearlas y elegir la correcta.
  const candidatos: { fuente: string; cadena: string }[] = []

  for (const b of bases) {
    if (b.referencia3?.trim()) candidatos.push({ fuente: `id=${b.id} nombre=${b.nombre} ref3`, cadena: b.referencia3.trim() })
    if (b.referencia2?.trim()) candidatos.push({ fuente: `id=${b.id} nombre=${b.nombre} ref2`, cadena: b.referencia2.trim() })
  }

  log.info(`[Handlers] Candidatos de conexión encontrados: ${candidatos.length}`)
  candidatos.forEach((c, i) => log.info(`  [${i}] ${c.fuente} → "${c.cadena}"`))

  // Prioridad: cadena que contiene la IP de la sucursal (ref3 primero, ref2 después)
  const connectionString =
    candidatos.find(c => c.cadena.includes(direccionIP) && c.fuente.includes('ref3'))?.cadena ??
    candidatos.find(c => c.cadena.includes(direccionIP))?.cadena ??
    candidatos[0]?.cadena

  if (!connectionString) {
    // Log completo para diagnóstico
    log.error('[Handlers] No se encontró cadena de conexión. Registros recibidos:')
    bases.forEach(b => log.error(`  id=${b.id} nombre=${b.nombre} ref2=${b.referencia2} ref3=${b.referencia3}`))
    throw new Error(
      `No se encontró cadena de conexión para la BD SG en la API.\n` +
      `Registros recibidos: ${bases.map(b => b.nombre).join(', ')}`
    )
  }

  // ── Paso 3: parsear y construir DbConfig ───────────────────────────────────
  // Usamos el database que viene de sucursal.referencia4 (ej. "P08165")
  const parsed = parsearConnectionString(connectionString, database)

  const config: DbConfig = {
    server:   parsed.server,
    database: parsed.database || database,
    user:     parsed.user,
    password: parsed.password,
    port:     parsed.port
  }

  log.info(`[Handlers] DbConfig final → server="${config.server}" database="${config.database}" user="${config.user}"`)
  dbConfigCache.set(cacheKey, config)
  log.info(`[Handlers] DbConfig SG → ${config.server}/${config.database} (usuario: ${config.user})`)
  return config
}

// ─── Registro de handlers ─────────────────────────────────────────────────────

export function registerHandlers(): void {

  // ── Ventana ────────────────────────────────────────────────────────────────
  ipcMain.on('window:minimize', () => BrowserWindow.getFocusedWindow()?.minimize())
  ipcMain.on('window:close',    () => BrowserWindow.getFocusedWindow()?.close())
  ipcMain.handle('app:version', () => app.getVersion())

  ipcMain.handle('app:printers', () => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    return win?.webContents.getPrintersAsync() ?? []
  })

  // ── Sucursal (por IP de la máquina) ────────────────────────────────────────
  ipcMain.handle('sucursal:get', async () => {
    try {
      const ip = getLocalIp()
      log.info(`[IPC] sucursal:get — IP local: ${ip}`)
      //const sucursales = await getSucursalPorIp(ip)
      const sucursales = await getSucursalPorIp('10.4.20.3')
      return { ip, sucursales }
    } catch (error) {
      log.error('[IPC] sucursal:get error:', error)
      throw error
    }
  })

  // ── Vista Previa del ticket ────────────────────────────────────────────────
  ipcMain.handle('ticket:vistaPrevia', async (
    _event,
    opciones: {
      idControlGas:   number   // sucursal.idControlGas (codGas en BD)
      direccionIP:    string   // sucursal.direccionIP  (servidor SQL)
      database:       string   // sucursal.referencia4  (nombre de la BD, ej. "P08165")
      folio:          number
      fecha:          string   // ISO date del formulario
      pagoTarjeta:    boolean
      formatoCredito: boolean
    }
  ) => {
    try {
      const { idControlGas, direccionIP, database, folio, fecha, pagoTarjeta } = opciones

      // ── 1. Obtener configuración de BD desde la API ─────────────
      const config = await getSgDbConfig(direccionIP, database)

      // ── 2. Convertir fecha del formulario a OLE ─────────────────
      const oleHoy      = isoToOle(fecha)
      const oleFechaMin = oleHoy - 999  // rango amplio como en el C# original
      const oleFechaMax = oleHoy + 1

      // ── 3. Verificar que el despacho sea de crédito ─────────────
      const nroTrn = folio * 10
      const despachosCredito = await getDespachosCredito(
        config, oleFechaMin, oleFechaMax, idControlGas
      )
      const esCredito = despachosCredito.some((d: any) => d.NROTRN === nroTrn)

      if (!esCredito) {
        return { ok: false as const, mensaje: 'El ticket no es de crédito' }
      }

      // ── 4. Obtener datos completos del despacho ─────────────────
      const registros = await getDatosDespacho(
        config, oleFechaMin - 1, oleFechaMax + 1, nroTrn
      )

      if (!registros.length) {
        return { ok: false as const, mensaje: `El folio ${folio} no es válido` }
      }

      const d = registros[0]

      // ── 5. Obtener IEPS y calcular totales (fórmula del C#) ─────
      const iepsRate = await getIeps(config, d.Fecha, d.CodProd, d.CodigoGas)
      const totales  = calcTotales(
        Number(d.Precio ?? 0),
        Number(d.Litros ?? 0),
        iepsRate
      )

      // ── 6. Validar restricción de tiempo (10 horas, igual que C#)
      const epoch = new Date(1899, 11, 30).getTime()
      const fechaDespacho = new Date(epoch + (d.Fecha + 1) * 86400000)
      const [hh, mm] = horaIntToStr(d.Hora).split(':').map(Number)
      fechaDespacho.setHours(hh, mm, 0, 0)

      const horasTranscurridas = (Date.now() - fechaDespacho.getTime()) / 3_600_000
      if (horasTranscurridas > 10) {
        return {
          ok: false as const,
          mensaje: `El despacho excede el tiempo permitido (${Math.floor(horasTranscurridas)}h transcurridas, máximo 10h)`
        }
      }

      // ── 7. Retornar datos normalizados al renderer ──────────────
      return {
        ok:         true as const,
        folio,
        pagoTarjeta,
        despacho: {
          nroTrn,
          fecha:          oleToDateStr(d.Fecha),
          hora:           horaIntToStr(d.Hora),
          posicion:       d.Posicion      ?? 0,
          terminal:       d.Terminal      ?? 0,
          nota:           d.Nota          ?? 0,
          // Header de la gasolinera — 100% dinámico desde la BD SG
          codEstacion:    d.CodEstacion   ?? 0,
          codigoGas:      d.CodigoGas     ?? 0,
          gasolinera:     (d.Estacion     ?? '').trim(),
          permiso:        (d.Permiso      ?? '').trim(),
          claveEst:       (d.ClaveEst     ?? '').trim(),
          // Producto
          producto:       (d.Producto     ?? '').trim(),
          claveProd:      (d.ClaveProd    ?? '').trim(),
          litros:         Number(d.Litros  ?? 0),
          precio:         Number(d.Precio  ?? 0),
          ...totales,
          // Cliente
          codExt:         Number(d.CodExt              ?? 0),
          nombreCliente:  (d.NombreCliente              ?? '').trim(),
          domicilio:      (d.DomicilioCliente           ?? '').trim(),
          colonia:        (d.ColoniaCliente             ?? '').trim(),
          ciudad:         (d.CiudadCliente              ?? '').trim(),
          estado:         (d.EstadoCliente              ?? '').trim(),
          rfc:            (d.Rfc                        ?? '').trim(),
          codigoPostal:   (d.CodPostCliente             ?? '').trim(),
          // Vehículo / tarjeta
          tarjeta:        Number(d.Tarjeta              ?? 0),
          ruta:           (d.TipoDeRegistro             ?? '').trim(),
          nroPat:         (d.NumeroPAT                  ?? '').trim(),
          vehiculo:       (d.NombreVehiculo             ?? '').trim(),
          odometro:       Number(d.Odometro             ?? 0),
          acumMes:        Number(d.AcumMes              ?? 0),
          saldo:          Number(d.DebSaldo             ?? 0),
          montoAsignado:  Number(d.MontoAsignado        ?? 0),
          nroEco:         (d.NumeroEconomico            ?? '').trim()
        }
      }

    } catch (error) {
      log.error('[IPC] ticket:vistaPrevia error:', error)
      throw error
    }
  })

  // ── Despachos (uso directo con config explícita) ───────────────────────────
  ipcMain.handle('despachos:getCredito', async (_event, config: DbConfig, fechaInicial: number, fechaFinal: number, codGas: number) => {
    try {
      return await getDespachosCredito(config, fechaInicial, fechaFinal, codGas)
    } catch (error) {
      log.error('[IPC] despachos:getCredito error:', error)
      throw error
    }
  })

  ipcMain.handle('despachos:getDatos', async (_event, config: DbConfig, fechaDesde: number, fechaHasta: number, numTrn: number) => {
    try {
      return await getDatosDespacho(config, fechaDesde, fechaHasta, numTrn)
    } catch (error) {
      log.error('[IPC] despachos:getDatos error:', error)
      throw error
    }
  })

  // ── Tickets (auditoría de reimpresiones) ──────────────────────────────────
  ipcMain.handle('tickets:getRegistros', async (_event, config: DbConfig, fechaIni: number, fechaFin: number, todasFechas: number, todosIds: number, despacho: number, todosDespachos: number) => {
    try {
      return await getVerRegistrosTicket(config, fechaIni, fechaFin, todasFechas, todosIds, despacho, todosDespachos)
    } catch (error) {
      log.error('[IPC] tickets:getRegistros error:', error)
      throw error
    }
  })

  ipcMain.handle('tickets:insertar', async (_event, config: DbConfig, datos: {
    turno: number; despacho: number; cajero: string; fecha: string
    usuario: string; numImpresiones: number; numVehiculo: number
    motivo: string; cliente: string; litros: number; importe: number
  }) => {
    try {
      await insertarRegTicket(
        config,
        datos.turno, datos.despacho, datos.cajero,
        new Date(datos.fecha), datos.usuario,
        datos.numImpresiones, datos.numVehiculo,
        datos.motivo, datos.cliente, datos.litros, datos.importe
      )
      return { success: true }
    } catch (error) {
      log.error('[IPC] tickets:insertar error:', error)
      throw error
    }
  })

  // ── Verificar folio → GET /api/v1/Sucursales/VerificarFolio ──────────────────
  // Retorna la lista tal cual viene de la API.
  // Lista vacía = nunca impreso. Lista con datos = ya existe registro.
  ipcMain.handle('reimpresion:verificar', async (
    _event,
    folio:        number,
    idControlGas: number
  ) => {
    try {
      const lista = await verificarFolio(folio, idControlGas)
      return lista   // VerificarFolioItem[]
    } catch (error) {
      log.error('[IPC] reimpresion:verificar error:', error)
      throw error
    }
  })

  // ── Validar credenciales para autorizar reimpresión ──────────────────────────
  // Credenciales fijas mientras se implementa el endpoint de usuarios.
  // TODO: reemplazar por llamada al API cuando esté disponible.
  ipcMain.handle('reimpresion:validarUsuario', async (
    _event,
    usuario:  string,
    password: string
  ) => {
    const USUARIO_AUTORIZADO  = 'ADMIN'
    const PASSWORD_AUTORIZADO = 'ADMIN'

    log.info(`[IPC] validarUsuario → recibido: usuario="${usuario}" password="${password}"`)
    log.info(`[IPC] validarUsuario → esperado: usuario="${USUARIO_AUTORIZADO}" password="${PASSWORD_AUTORIZADO}"`)

    const autorizado =
      usuario.trim().toUpperCase()  === USUARIO_AUTORIZADO &&
      password.trim().toUpperCase() === PASSWORD_AUTORIZADO

    log.info(`[IPC] validarUsuario → resultado: ${autorizado ? '✅ AUTORIZADO' : '❌ RECHAZADO'}`)

    return {
      autorizado,
      mensaje: autorizado ? 'Autorizado' : 'Usuario o contraseña incorrectos'
    }
  })

  // ── Insertar/actualizar folio → GET /api/v1/Sucursales/InsertarFolio ─────────
  ipcMain.handle('reimpresion:insertar', async (
    _event,
    folio:          number,
    idControlGas:   number,
    nombreSucursal: string,
    usuario:        string
  ) => {
    try {
      const data = await insertarFolio(folio, idControlGas, nombreSucursal, usuario)
      const item = data[0]
      log.info(`[IPC] reimpresion:insertar → folio=${folio} NUM_IMPRESIONES=${item?.NUM_IMPRESIONES}`)
      return { success: true, numImpresiones: item?.NUM_IMPRESIONES ?? 1 }
    } catch (error) {
      log.error('[IPC] reimpresion:insertar error:', error)
      throw error
    }
  })

  log.info('[IPC] Handlers registrados correctamente')
}

export default registerHandlers
