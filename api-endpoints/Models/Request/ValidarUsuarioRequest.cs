using System.ComponentModel.DataAnnotations;

namespace TuApi.Models.Request;

/// <summary>
/// Cuerpo del POST /api/v1/ReimpresionTickets/ValidarUsuario
/// </summary>
public class ValidarUsuarioRequest
{
    [Required]
    [MaxLength(100)]
    public string Usuario  { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;
}
