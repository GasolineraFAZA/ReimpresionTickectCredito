// ════════════════════════════════════════════════════════════════════════════════
//  Agregar estas líneas en tu Program.cs existente
// ════════════════════════════════════════════════════════════════════════════════

using TuApi.Repositories;
using TuApi.Services;

var builder = WebApplication.CreateBuilder(args);

// ... (tu código existente) ...

// ── Registrar repositorio y servicio de Reimpresión de Tickets ───────────────
builder.Services.AddScoped<IReimpresionTicketsRepository, ReimpresionTicketsRepository>();
builder.Services.AddScoped<IReimpresionTicketsService,    ReimpresionTicketsService>();

// ════════════════════════════════════════════════════════════════════════════════
//  Agregar en appsettings.json
// ════════════════════════════════════════════════════════════════════════════════

/*
"ConnectionStrings": {
  "ERPFaza": "Server=10.10.0.245;Database=ERPFaza;User Id=sa;Password=F.D3v0luc10n3s.F;TrustServerCertificate=True;"
}
*/
