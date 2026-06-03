import React from 'react'
import type { DespachoPreview } from '../../../preload/index.d'
import { numeroALetras } from '../utils/numeroALetras'

// ─── Helpers de formato ───────────────────────────────────────────────────────

const fmt2    = (n: number) => n.toFixed(2)
const fmtMny  = (n: number) => `$${n.toFixed(2)}`
const padId   = (n: number) => String(n).padStart(9, '0')
const sep = '-'.repeat(41)

// ─── Subcomponentes internos ──────────────────────────────────────────────────

function Line({ children, center, bold, style }: {
  children:  React.ReactNode
  center?:   boolean
  bold?:     boolean
  style?:    React.CSSProperties
}) {
  return (
    <p style={{
      margin:     '1px 0',
      textAlign:  center ? 'center' : 'left',
      fontWeight: bold   ? 'bold'   : 'normal',
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
}

/**
 * Template ÚNICO y dinámico para todos los tickets de crédito.
 * Los datos del encabezado (gasolinera, permiso, clave CRE) vienen
 * directamente de la BD SG a través del campo GASOLINERAS — sin
 * ningún switch/enum hardcodeado.
 */
export function TicketPreview({ folio, pagoTarjeta, d }: Props) {
  const totalLetras = numeroALetras(d.total)

  const style: React.CSSProperties = {
    fontFamily:  '"MS Gothic", "Courier New", monospace',
    fontSize:    '11px',
    width:       '230px',
    margin:      '0 auto',
    background:  '#fff',
    padding:     '10px 8px',
    lineHeight:  '1.5'
  }

  return (
    <div style={style}>

      {/* ── ENCABEZADO GASOLINERA (dinámico desde BD) ──────────────── */}
      {d.claveEst && <Line center bold>{d.claveEst}</Line>}
      <Line center bold>{d.gasolinera}</Line>
      {d.permiso  && <Line center>PERMISO C.R.E.: {d.permiso}</Line>}
      <Line center>Regimen Fiscal</Line>
      <Line center>601 General de Ley de Personas Morales</Line>
      <Line center>{sep}</Line>

      {/* ── ORIGINAL / NOTA ──────────────────────────────────────────── */}
      <Line center bold>*****        ORIGINAL       *****</Line>
      <Line center bold>NOTA #{d.nota}</Line>
      <Line center>***********************</Line>

      {/* ── DATOS DE TRANSACCIÓN ─────────────────────────────────────── */}
      <Line>FOLIO    : {folio}</Line>
      <Line>FECHA    : {d.fecha} {d.hora} ({d.nroTrn})</Line>
      <Line>POSICIÓN : {d.posicion}</Line>
      <Line>TERMINAL : {d.terminal}</Line>
      <Line center>{sep}</Line>

      {/* ── TIPO CRÉDITO ─────────────────────────────────────────────── */}
      <Line center bold>&gt;&gt;&gt;&gt;&gt;&gt;        CRÉDITO        &lt;&lt;&lt;&lt;&lt;&lt;</Line>

      {pagoTarjeta && (
        <Line center bold>&gt;      PAGO     CON     TARJETA    &lt;</Line>
      )}
      <Line center>{sep}</Line>

      {/* ── DATOS CLIENTE ────────────────────────────────────────────── */}
      <Line bold>CLIENTE          {padId(d.codExt)}</Line>
      <Line>{d.nombreCliente}</Line>
      {d.domicilio  && <Line>{d.domicilio}</Line>}
      {d.colonia    && <Line>{d.colonia}</Line>}
      <Line>
        {d.codigoPostal ? `${d.codigoPostal}-` : ''}{d.ciudad}, {d.estado}
      </Line>
      <Line>{d.rfc}</Line>
      <Line center>&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</Line>
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
      <Line center>+========(F I R M A)=========+</Line>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        height: '60px', borderLeft: '1px solid #333', borderRight: '1px solid #333'
      }} />
      <Line center>+=========================+</Line>

    </div>
  )
}
