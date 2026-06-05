// ════════════════════════════════════════════════════════════════════════════════
//  ARCHIVO: Services/ReimpresionTicketsService.cs
//
//  Dependencias NuGet necesarias:
//    - Dapper
//    - Microsoft.Data.SqlClient  (o System.Data.SqlClient)
// ════════════════════════════════════════════════════════════════════════════════

using Dapper;
using Microsoft.Data.SqlClient;
using ReimpresionTickets.Api.DTOs;

namespace ReimpresionTickets.Api.Services;

public class ReimpresionTicketsService : IReimpresionTicketsService
{
    private readonly string _connectionString;

    // Inyectar IConfiguration para leer la cadena de conexión de appsettings.json
    public ReimpresionTicketsService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("ERPFaza")
            ?? throw new InvalidOperationException(
                "No se encontró la cadena de conexión 'ERPFaza' en appsettings.json");
    }

    // ─── VerificarFolio ───────────────────────────────────────────────────────

    /// <summary>
    /// Ejecuta SP_VerificarFolioReimpreso en ERPFaza.
    /// Si no existe registro, retorna un objeto con YaFueReimpreso=false y NumImpresiones=0.
    /// </summary>
    public async Task<VerificarFolioResponse> VerificarFolioAsync(int folio, int idControlGas)
    {
        await using var db = new SqlConnection(_connectionString);

        var resultado = await db.QueryFirstOrDefaultAsync<VerificarFolioDbRow>(
            "SP_VerificarFolioReimpreso",
            new { FOLIO = folio, ID_CONTROL_GAS = idControlGas },
            commandType: System.Data.CommandType.StoredProcedure
        );

        if (resultado is null)
        {
            // El folio nunca fue reimpreso
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
            Id               = resultado.ID,
            Folio            = resultado.FOLIO,
            NumImpresiones   = resultado.NUM_IMPRESIONES,
            UsuarioCreacion  = resultado.UsuarioCreacion,
            UltimoUsuario    = resultado.UltimoUsuario,
            FechaCreacion    = resultado.FechaCreacion,
            Fum              = resultado.Fum,
            IdControlGas     = resultado.ID_CONTROL_GAS,
            NombreGasolinera = resultado.NOMBRE_GASOLINERA,
            YaFueReimpreso   = resultado.YA_FUE_REIMPRESO == 1
        };
    }

    // ─── ValidarUsuario ───────────────────────────────────────────────────────

    /// <summary>
    /// Valida que el usuario y contraseña existan en la tabla Usuarios de ERPFaza.
    /// Ajusta la query según tu modelo de usuarios.
    /// </summary>
    public async Task<ValidarUsuarioResponse> ValidarUsuarioAsync(
        string usuario, string password)
    {
        await using var db = new SqlConnection(_connectionString);

        // Ajusta el nombre de tabla/columnas según tu esquema de usuarios
        const string sql = """
            SELECT COUNT(1)
            FROM   Usuarios
            WHERE  Usuario  = @Usuario
              AND  Password = @Password
              AND  Activo   = 1
            """;

        var count = await db.ExecuteScalarAsync<int>(
            sql, new { Usuario = usuario, Password = password });

        return count > 0
            ? new ValidarUsuarioResponse { Autorizado = true,  Mensaje = "Autorizado" }
            : new ValidarUsuarioResponse { Autorizado = false, Mensaje = "Usuario o contraseña incorrectos" };
    }

    // ─── RegistrarReimpresion ─────────────────────────────────────────────────

    /// <summary>
    /// Ejecuta SP_InsertarRegReimpresion en ERPFaza.
    /// Incrementa NUM_IMPRESIONES si ya existe, inserta si no.
    /// </summary>
    public async Task<RegistrarReimpresionResponse> RegistrarReimpresionAsync(
        RegistrarReimpresionRequest request)
    {
        await using var db = new SqlConnection(_connectionString);

        var resultado = await db.QueryFirstAsync<RegistrarReimpresionDbRow>(
            "SP_InsertarRegReimpresion",
            new
            {
                FOLIO             = request.Folio,
                ID_CONTROL_GAS    = request.IdControlGas,
                NOMBRE_GASOLINERA = request.NombreGasolinera,
                UsuarioCreacion   = request.Usuario,
                UltimoUsuario     = request.Usuario
            },
            commandType: System.Data.CommandType.StoredProcedure
        );

        return new RegistrarReimpresionResponse
        {
            Id             = Convert.ToInt32(resultado.ID),
            Folio          = resultado.FOLIO,
            NumImpresiones = resultado.NUM_IMPRESIONES
        };
    }

    // ─── Modelos internos de mapeo Dapper ─────────────────────────────────────

    private class VerificarFolioDbRow
    {
        public int?      ID               { get; set; }
        public int       FOLIO            { get; set; }
        public int       NUM_IMPRESIONES  { get; set; }
        public string?   UsuarioCreacion  { get; set; }
        public string?   UltimoUsuario    { get; set; }
        public DateTime? FechaCreacion    { get; set; }
        public DateTime? Fum              { get; set; }
        public int       ID_CONTROL_GAS   { get; set; }
        public string?   NOMBRE_GASOLINERA { get; set; }
        public int       YA_FUE_REIMPRESO  { get; set; }
    }

    private class RegistrarReimpresionDbRow
    {
        public object ID             { get; set; } = 0;
        public int    FOLIO          { get; set; }
        public int    NUM_IMPRESIONES { get; set; }
    }
}
