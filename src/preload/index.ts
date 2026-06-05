import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', electronAPI)

    contextBridge.exposeInMainWorld('electron', {
      // Ventana
      minimize:   () => ipcRenderer.send('window:minimize'),
      close:      () => ipcRenderer.send('window:close'),
      getVersion:  () => ipcRenderer.invoke('app:version'),
      getPrinters: () => ipcRenderer.invoke('app:printers'),
      imprimirTicketTermico: (html: string, printer: string, copies: number) =>
        ipcRenderer.invoke('ticket:imprimir', { html, printer, copies }),

      // Sucursal (detectada por IP de la máquina)
      getSucursal: () => ipcRenderer.invoke('sucursal:get'),

      // Vista previa del ticket
      vistaPrevia: (opciones: {
        idControlGas:   number
        direccionIP:    string
        database:       string
        folio:          number
        fecha:          string
        pagoTarjeta:    boolean
        formatoCredito: boolean
      }) => ipcRenderer.invoke('ticket:vistaPrevia', opciones),

      // Reimpresiones (vía API)
      verificarReimpresion: (folio: number, idControlGas: number) =>
        ipcRenderer.invoke('reimpresion:verificar', folio, idControlGas),
      validarUsuarioReimpresion: (usuario: string, password: string) =>
        ipcRenderer.invoke('reimpresion:validarUsuario', usuario, password),
      insertarReimpresion: (folio: number, idControlGas: number, nombreSucursal: string, usuario: string) =>
        ipcRenderer.invoke('reimpresion:insertar', folio, idControlGas, nombreSucursal, usuario),

      // Despachos
      getDespachoCredito: (config, fechaInicial, fechaFinal, codGas) =>
        ipcRenderer.invoke('despachos:getCredito', config, fechaInicial, fechaFinal, codGas),
      getDatosDespacho: (config, fechaDesde, fechaHasta, numTrn) =>
        ipcRenderer.invoke('despachos:getDatos', config, fechaDesde, fechaHasta, numTrn),

      // Tickets (auditoría)
      getRegistrosTicket: (config, fechaIni, fechaFin, todasFechas, todosIds, despacho, todosDespachos) =>
        ipcRenderer.invoke('tickets:getRegistros', config, fechaIni, fechaFin, todasFechas, todosIds, despacho, todosDespachos),
      insertarTicket: (config, datos) =>
        ipcRenderer.invoke('tickets:insertar', config, datos)
    })
  } catch (error) {
    console.error('[Preload] Error al exponer APIs:', error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
}
