import React from 'react'
import type { DespachoPreview } from '../../../preload/index.d'
import { numeroALetras } from '../utils/numeroALetras'
import logoPunto from '../assets/logo-punto.png'

// ─── Helpers de formato ───────────────────────────────────────────────────────

const fmt2    = (n: number) => n.toFixed(2)
const fmtMny  = (n: number) => `$${n.toFixed(2)}`
const padId   = (n: number) => String(n).padStart(9, '0')
const sep = '-'.repeat(32)

// ─── Subcomponentes internos ──────────────────────────────────────────────────

function Line({ children, center, style }: {
  children:  React.ReactNode
  center?:   boolean
  bold?:     boolean
  style?:    React.CSSProperties
}) {
  return (
    <p style={{
      margin:     '1px 0',
      textAlign:  center ? 'center' : 'left',
      fontWeight: 'bold',   // todo el ticket en negrita para que imprima nítido
      whiteSpace: 'pre-wrap',
      wordBreak:  'break-word',
      ...style
    }}>
      {children}
    </p>
  )
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1px 0' }}>
      <span style={{ fontWeight: 'bold' }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}

// ─── Ticket Principal ─────────────────────────────────────────────────────────

interface Props {
  folio:       number
  pagoTarjeta: boolean
  d:           DespachoPreview
  /** Datos de la estación que vienen de la API de Sucursales. */
  estacion?: {
    clave:     string   // referencia4 (ej. "P04667")
    nombre:    string   // nombre (ej. "Santa Anita")
    direccion: string   // direccion (ej. "Av Tecnologico 14919")
  }
  /** Sobrescribe el logo (para impresión se inyecta como base64). */
  logoSrc?:    string
}

/**
 * Template ÚNICO y dinámico para todos los tickets de crédito.
 * Los datos del encabezado (gasolinera, permiso, clave CRE) vienen
 * directamente de la BD SG a través del campo GASOLINERAS — sin
 * ningún switch/enum hardcodeado.
 */
export function TicketPreview({ folio, pagoTarjeta, d, estacion, logoSrc }: Props) {
  const totalLetras = numeroALetras(d.total)
  const logo = logoSrc ?? logoPunto

  const style: React.CSSProperties = {
    fontFamily:  '"Courier New", monospace',
    fontSize:    '11px',
    fontWeight:  'bold',
    color:       '#000',
    width:       '180px',
    margin:      '0 auto',
    background:  '#fff',
    padding:     '6px 6px',
    lineHeight:  '1.4'
  }

  return (
    <div style={style}>

      {/* ── LOGO PUNTO+ ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
        <img
          src={logo}
          alt="Punto+"
          style={{
            width: '165px',
            height: 'auto',
            filter: 'brightness(0) contrast(200%)' // negro sólido para impresión térmica
          }}
        />
      </div>

      {/* ── ENCABEZADO ESTACIÓN (solo datos disponibles de la API) ──── */}
      <Line center bold>
        {[estacion?.clave, (estacion?.nombre ?? d.gasolinera)].filter(Boolean).join(' ').toUpperCase()}
      </Line>
      <Line center bold>GASOLINERA FAZA, S.A. de C.V.</Line>
      {estacion?.direccion && <Line center>{estacion.direccion}</Line>}
      {d.permiso  && <Line center>PERMISO C.R.E.: {d.permiso}</Line>}
      <Line center>Regimen Fiscal</Line>
      <Line center>601 General de Ley de Personas Morales</Line>
      <Line center>Lugar de Expedicion</Line>
      <Line center>{sep}</Line>

      {/* ── ORIGINAL / NOTA ──────────────────────────────────────────── */}
      <Line center bold>***** ORIGINAL R *****</Line>
      <Line center bold>NOTA #{d.nota}</Line>
      <Line center>***********************</Line>

      {/* ── DATOS DE TRANSACCIÓN ─────────────────────────────────────── */}
      <Line>FOLIO    : {folio}</Line>
      <Line>FECHA    : {d.fecha} {d.hora} ({d.nroTrn})</Line>
      <Line>POSICIÓN : {d.posicion}</Line>
      <Line>TERMINAL : {d.terminal}</Line>
      <Line center>{sep}</Line>

      {/* ── FORMA DE PAGO ────────────────────────────────────────────── */}
      <Line center bold>&gt;&gt;&gt; FORMA DE PAGO &lt;&lt;&lt;</Line>
      <Line center bold>&gt;&gt;&gt;&gt; CREDITO &lt;&lt;&lt;&lt;</Line>
      {pagoTarjeta && (
        <Line center bold>&gt; PAGO CON TARJETA &lt;</Line>
      )}

      {/* ── DATOS CLIENTE ────────────────────────────────────────────── */}
      <Line bold>CLIENTE          {padId(d.codExt)}</Line>
      <Line>{d.nombreCliente}</Line>
      {d.domicilio  && <Line>{d.domicilio}</Line>}
      {d.colonia    && <Line>{d.colonia}</Line>}
      <Line>
        {d.codigoPostal ? `${d.codigoPostal}-` : ''}{d.ciudad}, {d.estado}
      </Line>
      <Line>{d.rfc}</Line>
      <Line center>{sep}</Line>
      <Line>{sep}</Line>

      {/* ── PRODUCTO ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px' }}>
        <span>PRODUCTO</span>
        <span>CANT</span>
        <span>U.M.</span>
        <span>PRECIO</span>
        <span>IMPORTE</span>
      </div>
      <Line>{sep}</Line>
      <Line>{d.producto}</Line>
      {d.claveProd && <Line style={{ fontSize: '9px', color: '#555' }}>(CLAVE PEMEX {d.claveProd})</Line>}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
        <span></span>
        <span>{d.litros.toFixed(3)}</span>
        <span>LTR</span>
        <span>{d.precio}</span>
        <span>{fmt2(d.total)}</span>
      </div>
      <Line>{sep}</Line>

      {/* ── TOTALES ──────────────────────────────────────────────────── */}
      <Row label="SUBTOTAL:" value={fmt2(d.subtotal)} />
      <Row label="IVA:"      value={fmt2(d.iva)}      />
      <Row label="TOTAL:"    value={fmt2(d.total)}    />
      <Line>{sep}</Line>

      {/* ── IMPORTE EN LETRAS ─────────────────────────────────────────── */}
      <Line style={{ fontSize: '9px', wordBreak: 'break-word' }}>{totalLetras} M.N.</Line>
      <Line>{sep}</Line>

      {/* ── DATOS VEHÍCULO / TARJETA ─────────────────────────────────── */}
      <Row label="TARJETA:"  value={d.tarjeta}            />
      <Row label="RUTA:"     value={d.ruta}               />
      <Row label="NRO.ECO:"  value={d.nroEco}             />
      <Row label="NRO PAT:"  value={d.nroPat}             />
      <Row label="VEHICULO:" value={`${d.vehiculo} (CREDITO)`} />
      <Row label="ODÓMETRO:" value={d.odometro}           />
      <Row label="ACUM.MES:" value={fmtMny(d.acumMes)}   />
      <Row label="SALDO:"    value={fmtMny(d.saldo)}      />

      {/* ── FIRMA ─────────────────────────────────────────────────────── */}
      <Line center>+====(F I R M A)====+</Line>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        height: '60px', borderLeft: '1px solid #333', borderRight: '1px solid #333'
      }} />
      <Line center>+==================+</Line>

    </div>
  )
}
