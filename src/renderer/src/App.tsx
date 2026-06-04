import React, { useState, useEffect, useRef } from 'react'
import type { SucursalModel, DespachoPreview } from '../../preload/index.d'
import { TicketPreview } from './components/TicketPreview'
import logoPunto from './assets/logo-punto.png'

// ─── Iconos (SVG inline) ───────────────────────────────────────────────────────

const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
const IconPrinter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
)
const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const drag    = { WebkitAppRegion: 'drag' }    as React.CSSProperties
const noDrag  = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

// ─── Modal de Autorización ────────────────────────────────────────────────────

function ModalAuth({
  numImpresiones,
  folio,
  onAceptar,
  onCancelar
}: {
  numImpresiones: number
  folio:          number
  onAceptar:      (usuario: string, password: string) => void
  onCancelar:     () => void
}) {
  const [usuario,  setUsuario ] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleAceptar = () => {
    if (!usuario.trim())  { setErrorMsg('Ingrese el usuario');    return }
    if (!password.trim()) { setErrorMsg('Ingrese la contraseña'); return }
    setErrorMsg('')
    onAceptar(usuario.trim(), password.trim())
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-80 overflow-hidden">
        <div className="bg-orange-700 text-white px-5 py-3 flex items-center justify-between">
          <span className="font-semibold text-sm">Autorización requerida</span>
          <button onClick={onCancelar}
            className="w-6 h-6 hover:bg-orange-600 rounded text-sm leading-none">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
            El folio <strong>{folio}</strong> ya fue impreso{' '}
            <strong>{numImpresiones}</strong> {numImpresiones === 1 ? 'vez' : 'veces'}.
            Se requiere autorización para reimprimir.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Usuario</label>
            <input ref={inputRef} type="text" value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAceptar()}
              className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Contraseña</label>
            <input type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAceptar()}
              className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          {errorMsg && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{errorMsg}</p>
          )}
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onCancelar}
            className="px-4 py-2 text-sm border border-gray-200 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">
            Cancelar
          </button>
          <button onClick={handleAceptar}
            className="px-4 py-2 text-sm bg-orange-700 hover:bg-orange-800 text-white rounded-lg font-semibold">
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App(): React.JSX.Element {
  const [folio,          setFolio         ] = useState('')
  const [fecha] = useState(new Date().toISOString().split('T')[0])
  const [cantidad,       setCantidad      ] = useState('1')
  const [pagoTarjeta,    setPagoTarjeta   ] = useState(false)
  const [formatoCredito, setFormatoCredito] = useState(true)
  const [impresora,      setImpresora     ] = useState('')
  const [impresoras,     setImpresoras    ] = useState<{ name: string; isDefault: boolean }[]>([])

  const [sucursal,   setSucursal  ] = useState<SucursalModel | null>(null)
  const [loadingSuc, setLoadingSuc] = useState(true)
  const [version,    setVersion   ] = useState('')

  const [error,   setError  ] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [loadingPreview, setLoadingPreview] = useState(false)
  const [loadingPrint,   setLoadingPrint  ] = useState(false)

  const [authState, setAuthState] = useState<{
    visible:        boolean
    numImpresiones: number
    onApproved:     ((usuario: string) => void) | null
  }>({ visible: false, numImpresiones: 0, onApproved: null })

  const [preview, setPreview] = useState<{
    folio: number; pagoTarjeta: boolean; despacho: DespachoPreview
  } | null>(null)

  useEffect(() => {
    window.electron.getVersion().then(setVersion)
    window.electron.getPrinters().then((lista) => {
      setImpresoras(lista)
      const def = lista.find((p) => p.isDefault)
      if (def) setImpresora(def.name)
    })
    window.electron.getSucursal()
      .then(({ sucursales }) => {
        setSucursal(sucursales[0] ?? null)
        if (!sucursales.length) setError('No se encontró sucursal para esta IP')
      })
      .catch(() => setError('Error al conectar con la API'))
      .finally(() => setLoadingSuc(false))
  }, [])

  const limpiarMensajes = () => { setError(''); setMensaje('') }

  const validar = (): string | null => {
    if (!sucursal)               return 'No se pudo obtener la Estación de Gasolina'
    if (!folio.trim())           return 'Proporcione el folio'
    if (!cantidad.trim())        return 'Proporcione la cantidad de copias'
    if (isNaN(Number(cantidad))) return 'La cantidad de copias solo debe contener números'
    if (isNaN(Number(folio)))    return 'El folio solo debe contener números'
    return null
  }

  const buildOpciones = () => ({
    idControlGas: sucursal!.idControlGas,
    direccionIP:  sucursal!.direccionIP,
    database:     sucursal!.referencia4,
    folio:        Number(folio),
    fecha,
    pagoTarjeta,
    formatoCredito
  })

  const verificarYContinuar = async (onAuthorized: (usuario: string) => Promise<void>) => {
    const lista = await window.electron.verificarReimpresion(Number(folio), sucursal!.idControlGas)
    if (lista.length === 0 || lista[0].NUM_IMPRESIONES <= 1) {
      await onAuthorized('supervisor')
      return
    }
    setAuthState({
      visible:        true,
      numImpresiones: lista[0].NUM_IMPRESIONES,
      onApproved: (usuario) => {
        setAuthState((s) => ({ ...s, visible: false, onApproved: null }))
        onAuthorized(usuario)
      }
    })
  }

  const fetchTicketData = () => window.electron.vistaPrevia(buildOpciones())

  const registrarReimpresion = (gasolinera: string, usuario: string) =>
    window.electron.insertarReimpresion(Number(folio), sucursal!.idControlGas, gasolinera, usuario)

  const handleVistaPrevia = async () => {
    const errMsg = validar()
    if (errMsg) { setError(errMsg); return }
    limpiarMensajes()
    setLoadingPreview(true)
    try {
      await verificarYContinuar(async (usuario) => {
        setMensaje('Consultando ticket...')
        const resultado = await fetchTicketData()
        if (!resultado.ok) { setError(resultado.mensaje); return }
        await registrarReimpresion(resultado.despacho.gasolinera, usuario)
        setMensaje('')
        setPreview({ folio: resultado.folio, pagoTarjeta: resultado.pagoTarjeta, despacho: resultado.despacho })
      })
    } catch (e: any) {
      setError(`Error: ${e?.message ?? String(e)}`)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleImprimir = async () => {
    const errMsg = validar()
    if (errMsg) { setError(errMsg); return }
    limpiarMensajes()
    setLoadingPrint(true)
    try {
      await verificarYContinuar(async (usuario) => {
        setMensaje('Consultando ticket...')
        const resultado = await fetchTicketData()
        if (!resultado.ok) { setError(resultado.mensaje); return }
        await registrarReimpresion(resultado.despacho.gasolinera, usuario)
        setMensaje('Funcionalidad de impresión en desarrollo')
      })
    } catch (e: any) {
      setError(`Error: ${e?.message ?? String(e)}`)
    } finally {
      setLoadingPrint(false)
    }
  }

  const handleAuthAceptar = async (usuario: string, password: string) => {
    setMensaje('Validando...')
    try {
      const r = await window.electron.validarUsuarioReimpresion(usuario, password)
      setMensaje('')
      if (!r.autorizado) { setError(r.mensaje || 'Usuario o contraseña incorrectos'); return }
      authState.onApproved?.(usuario)
    } catch {
      setMensaje('')
      setError('Error al validar credenciales')
    }
  }

  const handleAuthCancelar = () => {
    setAuthState((s) => ({ ...s, visible: false, onApproved: null }))
    setLoadingPreview(false)
    setLoadingPrint(false)
  }

  // ── Stepper de copias ────────────────────────────────────────────────────────
  const cant    = Number(cantidad) || 1
  const decCant = () => setCantidad(String(Math.max(1, cant - 1)))
  const incCant = () => setCantidad(String(Math.min(5, cant + 1)))

  const enLinea = !loadingSuc && !!sucursal
  const cargando = loadingPreview || loadingPrint

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-white select-none">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={drag} className="relative shrink-0 bg-orange-100 px-7 pt-7 pb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-orange-800 leading-tight">Reimpresión de tickets</h1>
          <p className="text-sm text-orange-400 mt-0.5">Gestión de tickets de crédito corporativos</p>
        </div>

        {/* Logo Punto+ */}
        <div className="bg-white rounded-xl shadow-md border border-orange-200 px-4 py-3 mt-1 flex items-center">
          <img src={logoPunto} alt="Punto+" className="h-7 w-auto object-contain" />
        </div>

        {/* Controles de ventana */}
        <div style={noDrag} className="absolute top-2 right-3 flex gap-1.5">
          <button onClick={() => window.electron.minimize()} title="Minimizar"
            className="w-3.5 h-3.5 rounded-full bg-orange-300 hover:bg-orange-400" />
          <button onClick={() => window.electron.close()} title="Cerrar"
            className="w-3.5 h-3.5 rounded-full bg-red-400 hover:bg-red-500" />
        </div>
      </div>

      {/* ── Cuerpo ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col px-7 py-5">

        <div className="flex gap-5">

          {/* Columna izquierda */}
          <div className="flex-1 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Sucursal</label>
                <div className="relative">
                  <input type="text" readOnly
                    value={loadingSuc ? 'Detectando...' : (sucursal?.nombre ?? 'No encontrada')}
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 pr-8" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><IconLock /></span>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Folio</label>
                <input type="number" value={folio} onChange={(e) => setFolio(e.target.value)}
                  placeholder="Ej. 12345"
                  className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-gray-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-500">Lista de impresoras</label>
                <span className="flex items-center gap-1 text-xs font-medium">
                  <span className={`w-1.5 h-1.5 rounded-full ${enLinea ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className={enLinea ? 'text-green-600' : 'text-gray-400'}>
                    {enLinea ? 'En línea' : 'Sin conexión'}
                  </span>
                </span>
              </div>
              <select value={impresora} onChange={(e) => setImpresora(e.target.value)}
                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="">Seleccionar impresora...</option>
                {impresoras.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}{p.isDefault ? ' (predeterminada)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={pagoTarjeta} onChange={(e) => setPagoTarjeta(e.target.checked)}
                  className="w-4 h-4 accent-orange-600" />
                Pago con tarjeta
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={formatoCredito} onChange={(e) => setFormatoCredito(e.target.checked)}
                  className="w-4 h-4 accent-orange-600" />
                Formato de Crédito
              </label>
            </div>
          </div>

          {/* Columna derecha — copias */}
          <div className="w-52 bg-gray-100 rounded-xl p-4 flex flex-col">
            <label className="block text-xs font-medium text-gray-500 mb-2">Copias a imprimir</label>
            <div className="flex items-center gap-2">
              <button onClick={decCant}
                className="w-9 h-9 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-lg leading-none">−</button>
              <input type="number" value={cantidad} min="1" max="5"
                onChange={(e) => setCantidad(e.target.value)}
                className="flex-1 w-full text-center bg-white border border-gray-300 rounded-lg py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <button onClick={incCant}
                className="w-9 h-9 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-lg leading-none">+</button>
            </div>
            <p className="flex items-start gap-1.5 text-xs text-orange-700 mt-3 leading-snug">
              <span className="mt-0.5 shrink-0"><IconInfo /></span>
              Asegúrese de que el papel térmico esté correctamente alineado antes de iniciar la impresión masiva.
            </p>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">{error}</div>
        )}
        {!error && mensaje && (
          <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs">{mensaje}</div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 my-4" />

        {/* Botones */}
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
            <IconCheck /> Verificar Impresora
          </button>
          <button onClick={handleVistaPrevia} disabled={cargando}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
            <IconEye /> {loadingPreview ? 'Cargando...' : 'Vista Previa'}
          </button>
          <button onClick={handleImprimir} disabled={cargando}
            className="ml-auto flex items-center gap-2 px-7 py-2.5 bg-orange-700 hover:bg-orange-800 disabled:bg-orange-300 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
            <IconPrinter /> {loadingPrint ? 'Procesando...' : 'Imprimir Ticket'}
          </button>
        </div>

        {/* Versión */}
        <div className="mt-auto pt-3 flex justify-end">
          <span className="text-gray-300 text-xs">v{version}</span>
        </div>
      </div>

      {/* ── Modal Autorización ──────────────────────────────────────────────── */}
      {authState.visible && (
        <ModalAuth
          numImpresiones={authState.numImpresiones}
          folio={Number(folio)}
          onAceptar={handleAuthAceptar}
          onCancelar={handleAuthCancelar}
        />
      )}

      {/* ── Modal Vista Previa ──────────────────────────────────────────────── */}
      {preview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setPreview(null)}>
          <div className="bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] w-72 overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="bg-orange-700 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <span className="font-semibold text-sm">Vista Previa — Folio {preview.folio}</span>
              <button onClick={() => setPreview(null)}
                className="w-6 h-6 hover:bg-orange-600 rounded text-sm leading-none">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-3 bg-gray-50">
              <TicketPreview folio={preview.folio} pagoTarjeta={preview.pagoTarjeta} d={preview.despacho} />
            </div>
            <div className="px-4 py-3 border-t flex justify-end gap-2 shrink-0">
              <button onClick={() => setPreview(null)}
                className="px-4 py-2 text-sm border border-gray-200 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">
                Cerrar
              </button>
              <button onClick={() => window.print()}
                className="px-4 py-2 text-sm bg-orange-700 hover:bg-orange-800 text-white rounded-lg">
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
