-- BD: SG | Retorna despachos de crédito (TIPVAL=3) en rango de fechas para una gasolinera
-- Params: @fechaInicial, @fechaFinal (OLE -1), @codGas
SELECT X.NROTRN,
       X.GASOLINERA,
       X.FCHTRN,
       X.HRATRN,
       X.PRODUCTO,
       X.CAN,
       X.MTO
FROM
(
    SELECT  D.NROTRN,
            G.DEN   GASOLINERA,
            D.FCHTRN,
            D.HRATRN,
            P.DEN   PRODUCTO,
            D.CAN,
            D.MTO
    FROM    DESPACHOS   D
    JOIN    GASOLINERAS G ON G.COD = D.CODGAS
    JOIN    CLIENTES    C ON C.COD = D.CODCLI
    JOIN    PRODUCTOS   P ON P.COD = D.CODPRD
    WHERE   D.CODGAS   = @codGas
      AND   NROTRN     > 0
      AND   C.TIPVAL   = 3
      AND   FCHTRN     BETWEEN @fechaInicial AND @fechaFinal

    UNION ALL

    SELECT  D.NROTRN,
            G.DEN   GASOLINERA,
            D.FCHTRN,
            D.HRATRN,
            P.DEN   PRODUCTO,
            D.CAN,
            D.MTO
    FROM    DESPACHOS   D
    JOIN    GASOLINERAS G ON G.COD = D.CODGAS
    JOIN    PRODUCTOS   P ON P.COD = D.CODPRD
    WHERE   CODCLI      < 0
      AND   D.CODGAS    = @codGas
      AND   FCHTRN      BETWEEN @fechaInicial AND @fechaFinal
      AND   (
                SELECT TOP 1 CL.TIPVAL
                FROM   DOCUMENTOSC DOC
                JOIN   CLIENTES    CL ON CL.COD = DOC.CODOPR
                WHERE  D.NROFAC    = DOC.NRO
                  AND  DOC.FCH     BETWEEN @fechaInicial AND @fechaFinal
                  AND  D.CODGAS    = DOC.CODGAS
            ) = 3

    UNION ALL

    SELECT  D.NROTRN,
            G.DEN   GASOLINERA,
            D.FCHTRN,
            D.HRATRN,
            P.DEN   PRODUCTO,
            D.CAN,
            D.MTO
    FROM    DESPACHOS   D
    JOIN    GASOLINERAS G ON G.COD = D.CODGAS
    JOIN    PRODUCTOS   P ON P.COD = D.CODPRD
    WHERE   CODCLI  = 0
      AND   CODGAS  = @codGas
      AND   FCHTRN  BETWEEN @fechaInicial AND @fechaFinal
      AND   NROTRN  > 0
      AND   (
                SELECT TOP 1 CL.TIPVAL
                FROM   DOCUMENTOSC DOC
                JOIN   CLIENTES    CL ON CL.COD = DOC.CODOPR
                WHERE  D.NROFAC    = DOC.NRO
                  AND  DOC.FCH     BETWEEN @fechaInicial AND @fechaFinal
                  AND  D.CODGAS    = DOC.CODGAS
            ) = 3
) X
ORDER BY X.NROTRN
