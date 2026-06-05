namespace TuApi.Models.Response;

/// <summary>
/// Respuesta del POST /api/v1/ReimpresionTickets/ValidarUsuario
/// </summary>
public class ValidarUsuarioResponse
{
    /// <summary>true → credenciales correctas, el usuario puede reimprimir.</summary>
    public bool   Autorizado { get; set; }

    /// <summary>Mensaje descriptivo para mostrar al usuario.</summary>
    public string Mensaje    { get; set; } = string.Empty;
}
