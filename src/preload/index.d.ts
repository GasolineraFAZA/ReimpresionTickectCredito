import { ElectronAPI } from '@electron-toolkit/preload'

// ─── API: Sucursal ────────────────────────────────────────────────────────────

export interface SucursalModel {
  id:                  number
  idControlGas:        number
  nombre:              string
  tipo:                string
  activo:              boolean
  extension:           string
  anyDesk:             string
  anyDeskPass:         string
  teamViewer:          string
  teamViewerPass:      string
  direccionIP:         string
  direccionIPAdicional: string
  direccion:           string
  referencia1:         string
  referencia2:         string
  referencia3:         string
  referencia4:         string
  baseDatosLocal:      string
}

export interface SucursalResponse {
  ip:         string
  sucursales: SucursalModel[]
}

// ─── Vista Previa ─────────────────────────────────────────────────────────────

// ─── Reimpresiones ────────────────────────────────────────────────────────────

/** Modelo exacto que regresa GET /api/v1/Sucursales/VerificarFolio */
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

// ─── Vista Previa ─────────────────────────────────────────────────────────────

export interface DespachoPreview {
  // Transacción
  nroTrn:           number
  fecha:            string
  hora:             string
  posicion:         number
  terminal:         number
  nota:             number
  // Gasolinera (dinámico desde BD, sin hardcoding)
  codEstacion:      number
  codigoGas:        number
  gasolinera:       string
  permiso:          string
  claveEst:         string
  // Producto
  producto:         string
  claveProd:        string
  litros:           number
  precio:           number
  subtotal:         number
  iva:              number
  total:            number
  // Cliente
  codExt:           number
  nombreCliente:    string
  domicilio:        string
  colonia:          string
  ciudad:           string
  estado:           string
  rfc:              string
  codigoPostal:     string
  // Vehículo / tarjeta
  tarjeta:          number
  ruta:             string
  nroPat:           string
  vehiculo:         string
  odometro:         number
  acumMes:          number
  saldo:            number
  montoAsignado:    number
  nroEco:           string
}

export type VistaPreviaResult =
  | { ok: false;  mensaje: string }
  | { ok: true;   folio: number; pagoTarjeta: boolean; despacho: DespachoPreview }

// ─── Bridge completo ──────────────────────────────────────────────────────────

export interface ElectronBridge {
  // Ventana
  minimize:   () => void
  close:      () => void
  // Sucursal
  getSucursal: () => Promise<SucursalResponse>
  // Vista previa
  vistaPrevia: (opciones: {
    idControlGas:   number
    direccionIP:    string
    database:       string
    folio:          number
    fecha:          string
    pagoTarjeta:    boolean
    formatoCredito: boolean
  }) => Promise<VistaPreviaResult>
  // Reimpresiones (vía API)
  verificarReimpresion: (folio: number, idControlGas: number) => Promise<VerificarFolioItem[]>
  validarUsuarioReimpresion: (usuario: string, password: string) => Promise<{
    autorizado: boolean
    mensaje:    string
  }>
  insertarReimpresion: (folio: number, idControlGas: number, nombreSucursal: string, usuario: string) => Promise<{
    success:        boolean
    numImpresiones: number
  }>

  // Despachos
  getDespachoCredito: (config: unknown, fechaInicial: number, fechaFinal: number, codGas: number)   => Promise<unknown>
  getDatosDespacho:   (config: unknown, fechaDesde: number, fechaHasta: number, numTrn: number)     => Promise<unknown>
  // Tickets
  getRegistrosTicket: (config: unknown, fechaIni: number, fechaFin: number, todasFechas: number, todosIds: number, despacho: number, todosDespachos: number) => Promise<unknown>
  insertarTicket:     (config: unknown, datos: unknown) => Promise<{ success: boolean }>
}

declare global {
  interface Window {
    electron: ElectronBridge
    api:      ElectronAPI
  }
}
