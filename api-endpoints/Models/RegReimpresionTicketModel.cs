namespace TuApi.Models;

/// <summary>
/// Representa un registro de la tabla REG_REIMPRESION_TICKETS en ERPFaza.
/// </summary>
public class RegReimpresionTicketModel
{
    public int       Id               { get; set; }
    public int       Folio            { get; set; }
    public int       NumImpresiones   { get; set; }
    public string    UsuarioCreacion  { get; set; } = string.Empty;
    public string    UltimoUsuario    { get; set; } = string.Empty;
    public DateTime  FechaCreacion    { get; set; }
    public DateTime  Fum              { get; set; }
    public int       IdControlGas     { get; set; }
    public string    NombreGasolinera { get; set; } = string.Empty;
}
