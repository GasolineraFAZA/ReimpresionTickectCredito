// ════════════════════════════════════════════════════════════════════════════════
//  ARCHIVO: Controllers/ReimpresionTicketsController.cs
//  Agregar este archivo a tu proyecto de API (.NET)
// ════════════════════════════════════════════════════════════════════════════════

using Microsoft.AspNetCore.Mvc;
using ReimpresionTickets.Api.DTOs;
using ReimpresionTickets.Api.Services;

namespace ReimpresionTickets.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ReimpresionTicketsController : ControllerBase
{
    private readonly IReimpresionTicketsService _service;

    public ReimpresionTicketsController(IReimpresionTicketsService service)
    {
        _service = service;
    }

    /// <summary>
    /// Verifica si un folio ya fue reimpreso.
    /// Consulta SP_VerificarFolioReimpreso en ERPFaza.
    /// </summary>
    /// <param name="folio">Número de folio del ticket</param>
    /// <param name="idControlGas">idControlGas de la sucursal (sucursal.idControlGas)</param>
    [HttpGet("VerificarFolio")]
    public async Task<IActionResult> VerificarFolio(
        [FromQuery] int folio,
        [FromQuery] int idControlGas)
    {
        if (folio <= 0 || idControlGas <= 0)
            return BadRequest("Folio e idControlGas son requeridos.");

        var resultado = await _service.VerificarFolioAsync(folio, idControlGas);
        return Ok(resultado);
    }

    /// <summary>
    /// Valida usuario y contraseña para autorizar una reimpresión.
    /// </summary>
    [HttpPost("ValidarUsuario")]
    public async Task<IActionResult> ValidarUsuario([FromBody] ValidarUsuarioRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Usuario) ||
            string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Usuario y contraseña son requeridos.");

        var resultado = await _service.ValidarUsuarioAsync(request.Usuario, request.Password);
        return Ok(resultado);
    }

    /// <summary>
    /// Registra o actualiza la reimpresión de un folio.
    /// Llama a SP_InsertarRegReimpresion en ERPFaza.
    /// Si ya existe: incrementa NUM_IMPRESIONES.
    /// Si no existe: inserta con NUM_IMPRESIONES = 1.
    /// </summary>
    [HttpPost("RegistrarReimpresion")]
    public async Task<IActionResult> RegistrarReimpresion(
        [FromBody] RegistrarReimpresionRequest request)
    {
        if (request.Folio <= 0 || request.IdControlGas <= 0)
            return BadRequest("Folio e IdControlGas son requeridos.");

        var resultado = await _service.RegistrarReimpresionAsync(request);
        return Ok(resultado);
    }
}
