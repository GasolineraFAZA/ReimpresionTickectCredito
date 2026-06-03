using TuApi.Models.Request;
using TuApi.Models.Response;

namespace TuApi.Services;

public interface IReimpresionTicketsService
{
    Task<VerificarFolioResponse>       VerificarFolioAsync(int folio, int idControlGas);
    Task<ValidarUsuarioResponse>       ValidarUsuarioAsync(ValidarUsuarioRequest request);
    Task<RegistrarReimpresionResponse> RegistrarReimpresionAsync(RegistrarReimpresionRequest request);
}
