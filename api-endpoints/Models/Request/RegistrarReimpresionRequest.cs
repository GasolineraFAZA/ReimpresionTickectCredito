using System.ComponentModel.DataAnnotations;

namespace TuApi.Models.Request;

/// <summary>
/// Cuerpo del POST /api/v1/ReimpresionTickets/RegistrarReimpresion
/// </summary>
public class RegistrarReimpresionRequest
{
    [Required]
    public int    Folio            { get; set; }

    [Required]
    public int    IdControlGas     { get; set; }

    [Required]
    [MaxLength(200)]
    public string NombreGasolinera { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Usuario          { get; set; } = string.Empty;
}
