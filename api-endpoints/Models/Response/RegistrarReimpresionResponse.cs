namespace TuApi.Models.Response;

/// <summary>
/// Respuesta del POST /api/v1/ReimpresionTickets/RegistrarReimpresion
/// Refleja exactamente lo que retorna SP_InsertarRegReimpresion.
/// </summary>
public class RegistrarReimpresionResponse
{
    /// <summary>ID del registro en REG_REIMPRESION_TICKETS.</summary>
    public int Id             { get; set; }

    public int Folio          { get; set; }

    /// <summary>Número total de impresiones después de este registro.</summary>
    public int NumImpresiones { get; set; }
}
