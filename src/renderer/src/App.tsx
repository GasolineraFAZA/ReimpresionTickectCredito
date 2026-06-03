import React, { useState, useEffect, useRef } from 'react'
import type { SucursalModel, DespachoPreview } from '../../preload/index.d'
import { TicketPreview } from './components/TicketPreview'

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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-80">
        <div className="bg-orange-500 text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between">
          <span className="font-semibold text-sm">Autorización requerida</span>
          <button onClick={onCancelar}
            className="w-5 h-5 bg-red-400 hover:bg-red-300 rounded text-xs leading-none">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-gray-700 bg-yellow-50 border border-yellow-300 rounded p-3">
            El folio <strong>{folio}</strong> ya fue impreso{' '}
            <strong>{numImpresiones}</strong> {numImpresiones === 1 ? 'vez' : 'veces'}.
            Se requiere autorización para reimprimir.
          </p>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Usuario</label>
            <input ref={inputRef} type="text" value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAceptar()}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña</label>
            <input type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAceptar()}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400" />
          </div>
          {errorMsg && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{errorMsg}</p>
          )}
        </div>
        <div className="px-5 pb-4 flex justify-end gap-2">
          <button onClick={onCancelar}
            className="px-4 py-1.5 text-sm border border-gray-300 bg-gray-50 hover:bg-gray-100 rounded">
            Cancelar
          </button>
          <button onClick={handleAceptar}
            className="px-4 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded font-semibold">
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Fila de formulario ───────────────────────────────────────────────────────
// Definido FUERA de App para que React no lo desmonte en cada re-render.

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 text-right text-sm font-semibold text-gray-600 shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-3">{children}</div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App(): React.JSX.Element {
  const [folio,          setFolio         ] = useState('')
  const [fecha,          setFecha         ] = useState(new Date().toISOString().split('T')[0])
  const [cantidad,       setCantidad      ] = useState('1')
  const [pagoTarjeta,    setPagoTarjeta   ] = useState(false)
  const [formatoCredito, setFormatoCredito] = useState(false)
  const [impresora,      setImpresora     ] = useState('')

  const [sucursal,   setSucursal  ] = useState<SucursalModel | null>(null)
  const [loadingSuc, setLoadingSuc] = useState(true)

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
    database:     sucursal!.referencia4,   // nombre de la BD local (ej. "P08165")
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
    window.electron.insertarReimpresion(
      Number(folio), sucursal!.idControlGas, gasolinera, usuario
    )

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
        setMensaje('')
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

  return (
    <div className="bg-gray-200 min-h-screen">
      <div className="flex justify-center pt-0">
        <div className="bg-gray-100 w-full shadow-xl border border-gray-300">

          {/* ── Barra de título ─────────────────────────────────────── */}
          <div className="bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-t-lg flex items-center justify-between select-none">
            <span>Impresión de Tickets de Crédito</span>
            <div className="flex gap-1.5">
              <button onClick={() => window.electron.minimize()} title="Minimizar"
                className="w-4 h-4 bg-orange-300 hover:bg-orange-200 rounded-sm text-xs leading-none">─</button>
              <button title="Maximizar"
                className="w-4 h-4 bg-orange-300 rounded-sm text-xs leading-none opacity-40 cursor-default">□</button>
              <button onClick={() => window.electron.close()} title="Cerrar"
                className="w-4 h-4 bg-red-400 hover:bg-red-300 rounded-sm text-xs leading-none">✕</button>
            </div>
          </div>

          <div className="p-4 space-y-2.5">

            {/* ── Logo ──────────────────────────────────────────────── */}
            <div className="flex justify-end">
              <div className="w-14 h-14 border-2 border-dashed border-orange-400 rounded-lg flex items-center justify-center">
                <span className="text-orange-500 font-bold text-xl">P+</span>
              </div>
            </div>

            {/* ── Sucursal ──────────────────────────────────────────── */}
            <Field label="SUCURSAL:">
              <input type="text" readOnly
                value={loadingSuc ? 'Detectando...' : (sucursal?.nombre ?? 'No encontrada')}
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm bg-gray-50 text-gray-600" />
            </Field>

            {/* ── Folio ─────────────────────────────────────────────── */}
            <Field label="FOLIO:">
              <input type="number" value={folio} onChange={(e) => setFolio(e.target.value)}
                className="w-36 border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-400" />
              <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
                <input type="checkbox" checked={pagoTarjeta} onChange={(e) => setPagoTarjeta(e.target.checked)}
                  className="accent-orange-500" />
                Pago con tarjeta
              </label>
            </Field>

            {/* ── Copias ────────────────────────────────────────────── */}
            <Field label="COPIAS A IMPRIMIR:">
              <input type="number" value={cantidad} min="1" max="5"
                onChange={(e) => setCantidad(e.target.value)}
                className="w-36 border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-400" />
              <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
                <input type="checkbox" checked={formatoCredito} onChange={(e) => setFormatoCredito(e.target.checked)}
                  className="accent-orange-500" />
                Formato de Crédito
              </label>
            </Field>

            {/* ── Impresoras ────────────────────────────────────────── */}
            <Field label="LISTA DE IMPRESORAS:">
              <select value={impresora} onChange={(e) => setImpresora(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-400">
                <option value="">Seleccionar impresora...</option>
              </select>
            </Field>

            {/* ── Mensajes ──────────────────────────────────────────── */}
            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs leading-relaxed">
                {error}
              </div>
            )}
            {!error && mensaje && (
              <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-xs">
                {mensaje}
              </div>
            )}

            {/* ── Botones ───────────────────────────────────────────── */}
            <div className="flex gap-2 pt-1">
              <button
                className="flex-1 border border-gray-300 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold py-2 rounded transition-colors">
                VERIFICAR IMPRESORA
              </button>
              <button onClick={handleImprimir} disabled={loadingPrint || loadingPreview}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-xs font-semibold py-2 rounded transition-colors">
                {loadingPrint ? 'PROCESANDO...' : 'IMPRIMIR TICKET'}
              </button>
              <button onClick={handleVistaPrevia} disabled={loadingPreview || loadingPrint}
                className="flex-1 border border-gray-300 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 text-xs font-semibold py-2 rounded transition-colors">
                {loadingPreview ? 'CARGANDO...' : 'VISTA PREVIA'}
              </button>
            </div>

            <div>
              <a href="#" className="text-orange-500 hover:text-orange-600 text-xs underline">Ayuda?</a>
            </div>

          </div>
        </div>
      </div>

      {/* ── Modal Autorización ──────────────────────────────────────────── */}
      {authState.visible && (
        <ModalAuth
          numImpresiones={authState.numImpresiones}
          folio={Number(folio)}
          onAceptar={handleAuthAceptar}
          onCancelar={handleAuthCancelar}
        />
      )}

      {/* ── Modal Vista Previa ──────────────────────────────────────────── */}
      {preview && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={() => setPreview(null)}>
          <div className="bg-white rounded-lg shadow-2xl flex flex-col max-h-[90vh] w-72"
            onClick={(e) => e.stopPropagation()}>
            <div className="bg-orange-500 text-white px-4 py-2 rounded-t-lg flex items-center justify-between shrink-0">
              <span className="font-semibold text-sm">Vista Previa — Folio {preview.folio}</span>
              <button onClick={() => setPreview(null)}
                className="w-5 h-5 bg-red-400 hover:bg-red-300 rounded text-xs leading-none">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-3 bg-gray-50">
              <TicketPreview folio={preview.folio} pagoTarjeta={preview.pagoTarjeta} d={preview.despacho} />
            </div>
            <div className="px-4 py-3 border-t flex justify-end gap-2 shrink-0">
              <button onClick={() => setPreview(null)}
                className="px-4 py-1.5 text-sm border border-gray-300 bg-gray-50 hover:bg-gray-100 rounded">
                Cerrar
              </button>
              <button onClick={() => window.print()}
                className="px-4 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded">
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
