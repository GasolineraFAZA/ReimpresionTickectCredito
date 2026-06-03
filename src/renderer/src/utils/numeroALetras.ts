/**
 * Convierte un número decimal a su representación en letras en español.
 * Portado directamente de CommonUtilities.NumeroALetras() del proyecto C# original.
 *
 * Ejemplos:
 *   2300.50 → "(dos mil trescientos pesos 50 /100 m.n.)"
 *   1       → "(uno pesos 0 /100 m.n.)"
 */

function _enteroALetras(value: number): string {
  value = Math.trunc(value)

  if (value === 0)  return 'CERO'
  if (value === 1)  return 'UNO'
  if (value === 2)  return 'DOS'
  if (value === 3)  return 'TRES'
  if (value === 4)  return 'CUATRO'
  if (value === 5)  return 'CINCO'
  if (value === 6)  return 'SEIS'
  if (value === 7)  return 'SIETE'
  if (value === 8)  return 'OCHO'
  if (value === 9)  return 'NUEVE'
  if (value === 10) return 'DIEZ'
  if (value === 11) return 'ONCE'
  if (value === 12) return 'DOCE'
  if (value === 13) return 'TRECE'
  if (value === 14) return 'CATORCE'
  if (value === 15) return 'QUINCE'
  if (value < 20)   return 'DIECI' + _enteroALetras(value - 10)
  if (value === 20) return 'VEINTE'
  if (value < 30)   return 'VEINTI' + _enteroALetras(value - 20)
  if (value === 30) return 'TREINTA'
  if (value === 40) return 'CUARENTA'
  if (value === 50) return 'CINCUENTA'
  if (value === 60) return 'SESENTA'
  if (value === 70) return 'SETENTA'
  if (value === 80) return 'OCHENTA'
  if (value === 90) return 'NOVENTA'
  if (value < 100)  return _enteroALetras(Math.trunc(value / 10) * 10) + ' Y ' + _enteroALetras(value % 10)
  if (value === 100) return 'CIEN'
  if (value < 200)   return 'CIENTO ' + _enteroALetras(value - 100)
  if ([200, 300, 400, 600, 800].includes(value)) return _enteroALetras(Math.trunc(value / 100)) + 'CIENTOS'
  if (value === 500) return 'QUINIENTOS'
  if (value === 700) return 'SETECIENTOS'
  if (value === 900) return 'NOVECIENTOS'
  if (value < 1000)  return _enteroALetras(Math.trunc(value / 100) * 100) + ' ' + _enteroALetras(value % 100)
  if (value === 1000) return 'MIL'
  if (value < 2000)   return 'MIL ' + _enteroALetras(value % 1000)
  if (value < 1_000_000) {
    let result = _enteroALetras(Math.trunc(value / 1000)) + ' MIL'
    if (value % 1000 > 0) result += ' ' + _enteroALetras(value % 1000)
    return result
  }
  if (value === 1_000_000)  return 'UN MILLON'
  if (value < 2_000_000)    return 'UN MILLON ' + _enteroALetras(value % 1_000_000)
  if (value < 1_000_000_000_000) {
    let result = _enteroALetras(Math.trunc(value / 1_000_000)) + ' MILLONES'
    const resto = value - Math.trunc(value / 1_000_000) * 1_000_000
    if (resto > 0) result += ' ' + _enteroALetras(resto)
    return result
  }
  if (value === 1_000_000_000_000) return 'UN BILLON'
  if (value < 2_000_000_000_000)   return 'UN BILLON ' + _enteroALetras(value - 1_000_000_000_000)
  const billones = Math.trunc(value / 1_000_000_000_000)
  let result = _enteroALetras(billones) + ' BILLONES'
  const resto = value - billones * 1_000_000_000_000
  if (resto > 0) result += ' ' + _enteroALetras(resto)
  return result
}

/**
 * Convierte un monto a letras para imprimir en el ticket.
 *   numeroALetras(2300.50)
 *   → "(dos mil trescientos pesos 50 /100 m.n.)"
 */
export function numeroALetras(monto: number): string {
  const entero    = Math.trunc(monto)
  const decimales = Math.round((monto - entero) * 100)
  const letras    = _enteroALetras(entero)
  const sufijo    = `PESOS ${decimales} /100`
  return `(${letras} ${sufijo})`.toLowerCase()
}
