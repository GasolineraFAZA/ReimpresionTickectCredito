-- BD: SG | Datos completos de un despacho de crédito con cliente, vehículo y tarjeta
-- Params: @fechaDesde, @fechaHasta (fechas OLE), @numTrn
Select  d.nrotrn        As NumeroTransaccion,
        d.hratrn        As Hora,
        d.fchtrn        As Fecha,
        d.nrobom        As Posicion,
        t.nrotf1        As Terminal,
        d.tar           As Tarjeta,
        d.rut           As TipoDeRegistro,
        d.can           As Litros,
        d.nrocte        As Nota,
        d.mto           As Importe,
        d.codgas        As CodEstacion,
        g.den           As Estacion,
        d.codprd        As CodProd,
        p.cveprv        As ClaveProd,
        g.cveest        As ClaveEst,
        p.den           As Producto,
        c.den           As NombreCliente,
        c.cod           As CodigoCliente,
        c.codext        As CodExt,
        c.rfc           As Rfc,
        c.dom           As DomicilioCliente,
        c.col           As ColoniaCliente,
        c.ciu           As CiudadCliente,
        c.est           As EstadoCliente,
        c.codpos        As CodPostCliente,
        cv.plc          As Placas,
        d.Pre           As Precio,
        cv.nropat       As NumeroPAT,
        cv.plc          As NombreVehiculo,
        cv.grp          As Grupo,
        d.odm           As Odometro,
        cv.acumes       As AcumMes,
        c.cresdo        As DebSaldo,
        d.nrofac        As Factura,
        mt.nrotar       As NumeroTarjeta,
        mt.nroref       As ReferenciaTarjeta,
        mt.trxmsg       As AprobacionTarjeta,
        mt.tiptar       As TipoTarjeta,
        d.codgas        As CodigoGas,
        d.nroveh        As NumeroVehiculo,
        d.nrotur        As NumeroTurno,
        c.mtoasg        As MontoAsignado,
        cv.nroeco       As NumeroEconomico,
        g.nropcc        As Permiso,
        g.est           As Estado

From            Despachos           d
join            Gasolineras         g   on  g.cod     = d.codgas
join            Productos           p   on  p.cod     = d.codprd
join            Tanques             t   on  t.codgas  = d.codgas and
                                            d.codprd  = t.codprd
join            Bombas              b   on  d.codgas  = b.codgas and
                                            b.nro     = d.nrobom and
                                            b.codisl  = d.codisl and
                                            b.codtan  = t.cod
left join       Clientes            c   on  c.cod     = d.codcli
left join       ClientesVehiculos   cv  on  cv.codcli = d.codcli and
                                            d.nroveh  = cv.nroveh
left join       MovimientosTar      mt  on  mt.nrotrn = d.nrotrn

Where           d.fchcor Between @fechaDesde and @fechaHasta
                and d.nrotrn = @numTrn
                and c.tipval = 3

Order By d.hratrn Asc
