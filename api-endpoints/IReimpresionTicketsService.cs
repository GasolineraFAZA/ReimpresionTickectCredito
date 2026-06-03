// ════════════════════════════════════════════════════════════════════════════════
//  ARCHIVO: Services/IReimpresionTicketsService.cs
// ════════════════════════════════════════════════════════════════════════════════

using ReimpresionTickets.Api.DTOs;

namespace ReimpresionTickets.Api.Services;

public interface IReimpresionTicketsService
{
    Task<VerificarFolioResponse>       VerificarFolioAsync(int folio, int idControlGas);
    Task<ValidarUsuarioResponse>       ValidarUsuarioAsync(string usuario, string password);
    Task<RegistrarReimpresionResponse> RegistrarReimpresionAsync(RegistrarReimpresionRequest request);
}
