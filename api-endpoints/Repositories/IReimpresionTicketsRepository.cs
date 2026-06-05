using TuApi.Models;
using TuApi.Models.Request;
using TuApi.Models.Response;

namespace TuApi.Repositories;

public interface IReimpresionTicketsRepository
{
    /// <summary>
    /// Ejecuta SP_VerificarFolioReimpreso.
    /// Retorna NULL si el folio nunca fue impreso.
    /// </summary>
    Task<RegReimpresionTicketModel?> VerificarFolioAsync(int folio, int idControlGas);

    /// <summary>
    /// Ejecuta SP_InsertarRegReimpresion.
    /// Inserta o incrementa NUM_IMPRESIONES según exista o no el registro.
    /// </summary>
    Task<RegistrarReimpresionResponse> InsertarRegReimpresionAsync(
        RegistrarReimpresionRequest request);

    /// <summary>
    /// Valida usuario y contraseña contra la tabla de usuarios de ERPFaza.
    /// </summary>
    Task<bool> ValidarUsuarioAsync(string usuario, string password);
}
