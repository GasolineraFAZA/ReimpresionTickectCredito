// ════════════════════════════════════════════════════════════════════════════════
//  AGREGAR en Program.cs o Startup.cs de tu API
// ════════════════════════════════════════════════════════════════════════════════

// 1. Registrar el servicio en el contenedor de dependencias:
builder.Services.AddScoped<IReimpresionTicketsService, ReimpresionTicketsService>();

// ════════════════════════════════════════════════════════════════════════════════
//  AGREGAR en appsettings.json de tu API
// ════════════════════════════════════════════════════════════════════════════════

/*
"ConnectionStrings": {
  "ERPFaza": "Server=10.10.0.245;Database=ERPFaza;User Id=sa;Password=F.D3v0luc10n3s.F;TrustServerCertificate=True;"
}
*/
