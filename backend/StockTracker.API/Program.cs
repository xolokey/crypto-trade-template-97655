using Serilog;
using StockTracker.Core.Interfaces;
using StockTracker.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/stocktracker-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database - commented out for now, add when needed
// builder.Services.AddDbContext<StockTrackerDbContext>(options =>
//     options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
            ?? new[] { "http://localhost:8080" };
        
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Caching
builder.Services.AddMemoryCache();
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "StockTracker_";
});

// HTTP Clients
builder.Services.AddHttpClient<IAlphaVantageService, AlphaVantageService>();
builder.Services.AddHttpClient<ITwelveDataService, TwelveDataService>();
builder.Services.AddHttpClient<INSEService, NSEService>();

// Services
builder.Services.AddScoped<IMarketDataService, MarketDataService>();
builder.Services.AddSingleton<ICacheService, CacheService>();
// Add these when implemented:
// builder.Services.AddScoped<IPriceAlertService, PriceAlertService>();
// builder.Services.AddScoped<IPortfolioService, PortfolioService>();
// builder.Services.AddScoped<IWatchlistService, WatchlistService>();

// Health Checks - simplified
builder.Services.AddHealthChecks();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

// app.UseAuthentication();
// app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// WebSocket endpoint
app.UseWebSockets();
app.Map("/ws/market-data", async context =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        var marketDataService = context.RequestServices.GetRequiredService<IMarketDataService>();
        await marketDataService.HandleWebSocketConnection(webSocket);
    }
    else
    {
        context.Response.StatusCode = 400;
    }
});

try
{
    Log.Information("Starting Stock Tracker API");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application start-up failed");
}
finally
{
    Log.CloseAndFlush();
}
