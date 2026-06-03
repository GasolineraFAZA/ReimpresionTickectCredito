using Dapper;
using Microsoft.Data.SqlClient;
using TuApi.Models;
using TuApi.Models.Request;
using TuApi.Models.Response;

namespace TuApi.Repositories;

public class ReimpresionTicketsRepository : IReimpresionTicketsRepository
{
    private readonly string _connectionString;

    public ReimpresionTicketsRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("ERPFaza")
            ?? throw new InvalidOperationException(
                "Cadena de conexión 'ERPFaza' no encontrada en appsettings.json");
    }

    // ─── VerificarFolioAsync ──────────────────────────────────────────────────

    public async Task<RegReimpresionTicketModel?> VerificarFolioAsync(
        int folio, int idControlGas)
    {
        await using var db = new SqlConnection(_connectionString);

        var row = await db.QueryFirstOrDefaultAsync<SpVerificarFolioRow>(
            "SP_VerificarFolioReimpreso",
            new { FOLIO = folio, ID_CONTROL_GAS = idControlGas },
            commandType: System.Data.CommandType.StoredProcedure
        );

        if (row is null) return null;

        // YA_FUE_REIMPRESO = 0 cuando el ID es NULL (SP usa CASE WHEN)
        if (row.YA_FUE_REIMPRESO == 0) return null;

        return new RegReimpresionTicketModel
        {
            Id               = row.ID ?? 0,
            Folio            = row.FOLIO,
            NumImpresiones   = row.NUM_IMPRESIONES,
            UsuarioCreacion  = row.UsuarioCreacion  ?? string.Empty,
            UltimoUsuario    = row.UltimoUsuario    ?? string.Empty,
            FechaCreacion    = row.FechaCreacion    ?? DateTime.MinValue,
            Fum              = row.Fum              ?? DateTime.MinValue,
            IdControlGas     = row.ID_CONTROL_GAS,
            NombreGasolinera = row.NOMBRE_GASOLINERA ?? string.Empty
        };
    }

    // ─── InsertarRegReimpresionAsync ──────────────────────────────────────────

    public async Task<RegistrarReimpresionResponse> InsertarRegReimpresionAsync(
        RegistrarReimpresionRequest request)
    {
        await using var db = new SqlConnection(_connectionString);

        var row = await db.QueryFirstAsync<SpInsertarRow>(
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
            Id             = Convert.ToInt32(row.ID),
            Folio          = row.FOLIO,
            NumImpresiones = row.NUM_IMPRESIONES
        };
    }

    // ─── ValidarUsuarioAsync ──────────────────────────────────────────────────

    public async Task<bool> ValidarUsuarioAsync(string usuario, string password)
    {
        await using var db = new SqlConnection(_connectionString);

        // Ajusta tabla y columnas según tu esquema de usuarios
        const string sql = """
            SELECT COUNT(1)
            FROM   Usuarios
            WHERE  Usuario  = @Usuario
              AND  Password = @Password
              AND  Activo   = 1
            """;

        var count = await db.ExecuteScalarAsync<int>(
            sql, new { Usuario = usuario, Password = password });

        return count > 0;
    }

    // ─── Modelos internos de mapeo Dapper ─────────────────────────────────────
    // (privados — no salen del repositorio)

    private class SpVerificarFolioRow
    {
        public int?      ID                { get; set; }
        public int       FOLIO             { get; set; }
        public int       NUM_IMPRESIONES   { get; set; }
        public string?   UsuarioCreacion   { get; set; }
        public string?   UltimoUsuario     { get; set; }
        public DateTime? FechaCreacion     { get; set; }
        public DateTime? Fum               { get; set; }
        public int       ID_CONTROL_GAS    { get; set; }
        public string?   NOMBRE_GASOLINERA { get; set; }
        public int       YA_FUE_REIMPRESO  { get; set; }
    }

    private class SpInsertarRow
    {
        public object ID             { get; set; } = 0;
        public int    FOLIO          { get; set; }
        public int    NUM_IMPRESIONES { get; set; }
    }
}
