-- BD: SG | Tasa IEPS vigente a la fecha del despacho para un producto y gasolinera
-- Params: @fecha (OLE), @codprod, @CodGas
SELECT TOP 1 PREIIE As IEPS
FROM Precios
WHERE   fch    <= @fecha  AND
        codprd  = @codprod AND
        codgas  = @CodGas
ORDER BY fch DESC
