// ════════════════════════════════════════════════════════════════════════════════
//  ARCHIVO: DTOs/ReimpresionTicketsDTOs.cs
// ════════════════════════════════════════════════════════════════════════════════

namespace ReimpresionTickets.Api.DTOs;

// ── Request DTOs ──────────────────────────────────────────────────────────────

public class ValidarUsuarioRequest
{
    public string Usuario  { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegistrarReimpresionRequest
{
    public int    Folio            { get; set; }
    public int    IdControlGas     { get; set; }
    public string NombreGasolinera { get; set; } = string.Empty;
    public string Usuario          { get; set; } = string.Empty;
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

public class VerificarFolioResponse
{
    public int?     Id               { get; set; }
    public int      Folio            { get; set; }
    public int      NumImpresiones   { get; set; }
    public string?  UsuarioCreacion  { get; set; }
    public string?  UltimoUsuario    { get; set; }
    public DateTime? FechaCreacion   { get; set; }
    public DateTime? Fum             { get; set; }
    public int      IdControlGas     { get; set; }
    public string?  NombreGasolinera { get; set; }
    public bool     YaFueReimpreso   { get; set; }
}

public class ValidarUsuarioResponse
{
    public bool   Autorizado { get; set; }
    public string Mensaje    { get; set; } = string.Empty;
}

public class RegistrarReimpresionResponse
{
    public int Id             { get; set; }
    public int Folio          { get; set; }
    public int NumImpresiones { get; set; }
}
