namespace TuApi.Models.Response;

/// <summary>
/// Respuesta del GET /api/v1/ReimpresionTickets/VerificarFolio
/// Refleja exactamente lo que retorna SP_VerificarFolioReimpreso.
/// </summary>
public class VerificarFolioResponse
{
    /// <summary>ID del registro. NULL si el folio nunca fue impreso.</summary>
    public int?      Id               { get; set; }

    public int       Folio            { get; set; }

    /// <summary>Cantidad de veces que se ha impreso este folio.</summary>
    public int       NumImpresiones   { get; set; }

    public string?   UsuarioCreacion  { get; set; }
    public string?   UltimoUsuario    { get; set; }
    public DateTime? FechaCreacion    { get; set; }
    public DateTime? Fum              { get; set; }
    public int       IdControlGas     { get; set; }
    public string?   NombreGasolinera { get; set; }

    /// <summary>
    /// true  → el folio ya tiene registro de impresión → pedir autorización.
    /// false → primera impresión → no requiere autorización.
    /// </summary>
    public bool YaFueReimpreso { get; set; }
}
