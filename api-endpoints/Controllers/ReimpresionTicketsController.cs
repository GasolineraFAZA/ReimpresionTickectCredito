using Microsoft.AspNetCore.Mvc;
using TuApi.Models.Request;
using TuApi.Models.Response;
using TuApi.Services;

namespace TuApi.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ReimpresionTicketsController : ControllerBase
{
    private readonly IReimpresionTicketsService _service;

    public ReimpresionTicketsController(IReimpresionTicketsService service)
    {
        _service = service;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET api/v1/ReimpresionTickets/VerificarFolio?folio=12345&idControlGas=18
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>
    /// Verifica si un folio ya fue reimpreso anteriormente.
    /// Si <c>yaFueReimpreso = true</c> el cliente debe pedir autorización.
    /// </summary>
    /// <param name="folio">Número de folio del ticket</param>
    /// <param name="idControlGas">idControlGas de la sucursal</param>
    /// <response code="200">Resultado de la verificación</response>
    /// <response code="400">Parámetros inválidos</response>
    [HttpGet("VerificarFolio")]
    [ProducesResponseType(typeof(VerificarFolioResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerificarFolio(
        [FromQuery] int folio,
        [FromQuery] int idControlGas)
    {
        if (folio <= 0)        return BadRequest("El folio debe ser mayor a 0.");
        if (idControlGas <= 0) return BadRequest("El idControlGas debe ser mayor a 0.");

        var resultado = await _service.VerificarFolioAsync(folio, idControlGas);
        return Ok(resultado);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST api/v1/ReimpresionTickets/ValidarUsuario
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>
    /// Valida usuario y contraseña para autorizar una reimpresión.
    /// </summary>
    /// <response code="200">Resultado de la validación (autorizado true/false)</response>
    /// <response code="400">Datos de entrada inválidos</response>
    [HttpPost("ValidarUsuario")]
    [ProducesResponseType(typeof(ValidarUsuarioResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ValidarUsuario(
        [FromBody] ValidarUsuarioRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var resultado = await _service.ValidarUsuarioAsync(request);
        return Ok(resultado);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST api/v1/ReimpresionTickets/RegistrarReimpresion
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>
    /// Registra o actualiza una reimpresión en ERPFaza.
    /// Si el folio ya existe incrementa NUM_IMPRESIONES,
    /// si no existe lo inserta con NUM_IMPRESIONES = 1.
    /// </summary>
    /// <response code="200">Registro actualizado/creado con el nuevo NUM_IMPRESIONES</response>
    /// <response code="400">Datos de entrada inválidos</response>
    [HttpPost("RegistrarReimpresion")]
    [ProducesResponseType(typeof(RegistrarReimpresionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegistrarReimpresion(
        [FromBody] RegistrarReimpresionRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var resultado = await _service.RegistrarReimpresionAsync(request);
        return Ok(resultado);
    }
}
