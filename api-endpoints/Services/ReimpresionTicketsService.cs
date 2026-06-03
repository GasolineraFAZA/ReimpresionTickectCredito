using TuApi.Models.Request;
using TuApi.Models.Response;
using TuApi.Repositories;

namespace TuApi.Services;

public class ReimpresionTicketsService : IReimpresionTicketsService
{
    private readonly IReimpresionTicketsRepository _repo;

    public ReimpresionTicketsService(IReimpresionTicketsRepository repo)
    {
        _repo = repo;
    }

    // ─── VerificarFolio ───────────────────────────────────────────────────────

    public async Task<VerificarFolioResponse> VerificarFolioAsync(
        int folio, int idControlGas)
    {
        var registro = await _repo.VerificarFolioAsync(folio, idControlGas);

        // Si no hay registro previo → primera impresión
        if (registro is null)
        {
            return new VerificarFolioResponse
            {
                Folio          = folio,
                IdControlGas   = idControlGas,
                NumImpresiones = 0,
                YaFueReimpreso = false
            };
        }

        return new VerificarFolioResponse
        {
            Id               = registro.Id,
            Folio            = registro.Folio,
            NumImpresiones   = registro.NumImpresiones,
            UsuarioCreacion  = registro.UsuarioCreacion,
            UltimoUsuario    = registro.UltimoUsuario,
            FechaCreacion    = registro.FechaCreacion,
            Fum              = registro.Fum,
            IdControlGas     = registro.IdControlGas,
            NombreGasolinera = registro.NombreGasolinera,
            YaFueReimpreso   = true
        };
    }

    // ─── ValidarUsuario ───────────────────────────────────────────────────────

    public async Task<ValidarUsuarioResponse> ValidarUsuarioAsync(
        ValidarUsuarioRequest request)
    {
        var autorizado = await _repo.ValidarUsuarioAsync(
            request.Usuario, request.Password);

        return new ValidarUsuarioResponse
        {
            Autorizado = autorizado,
            Mensaje    = autorizado
                ? "Autorizado correctamente"
                : "Usuario o contraseña incorrectos"
        };
    }

    // ─── RegistrarReimpresion ─────────────────────────────────────────────────

    public async Task<RegistrarReimpresionResponse> RegistrarReimpresionAsync(
        RegistrarReimpresionRequest request)
    {
        return await _repo.InsertarRegReimpresionAsync(request);
    }
}
