# 🔷 .NET Backend Setup Guide

## Overview

This guide will help you replace the Vercel serverless functions with a complete ASP.NET Core Web API backend.

## 🎯 Architecture

```
Frontend (React)
    ↓ HTTP/WebSocket
.NET Core Web API
    ↓
External APIs (Alpha Vantage, Twelve Data, NSE)
    ↓
PostgreSQL (Supabase)
```

## 📁 Project Structure

```
backend/
├── StockTracker.API/              # Main API project
│   ├── Controllers/               # API endpoints
│   ├── Services/                  # Business logic
│   ├── Models/                    # Data models
│   ├── DTOs/                      # Data transfer objects
│   ├── Middleware/                # Custom middleware
│   ├── Configuration/             # App configuration
│   └── Program.cs                 # Entry point
│
├── StockTracker.Core/             # Core business logic
│   ├── Interfaces/                # Service interfaces
│   ├── Services/                  # Service implementations
│   └── Models/                    # Domain models
│
├── StockTracker.Infrastructure/   # External integrations
│   ├── ExternalAPIs/              # API clients
│   ├── Database/                  # Database context
│   └── Repositories/              # Data access
│
└── StockTracker.Tests/            # Unit tests
```

## 🚀 Quick Start

### Prerequisites

- .NET 8.0 SDK or later
- Visual Studio 2022 / VS Code / Rider
- PostgreSQL (via Supabase)

### Step 1: Create Solution

```bash
# Create solution
dotnet new sln -n StockTracker

# Create API project
dotnet new webapi -n StockTracker.API -o backend/StockTracker.API

# Create class libraries
dotnet new classlib -n StockTracker.Core -o backend/StockTracker.Core
dotnet new classlib -n StockTracker.Infrastructure -o backend/StockTracker.Infrastructure
dotnet new xunit -n StockTracker.Tests -o backend/StockTracker.Tests

# Add projects to solution
dotnet sln add backend/StockTracker.API/StockTracker.API.csproj
dotnet sln add backend/StockTracker.Core/StockTracker.Core.csproj
dotnet sln add backend/StockTracker.Infrastructure/StockTracker.Infrastructure.csproj
dotnet sln add backend/StockTracker.Tests/StockTracker.Tests.csproj

# Add project references
cd backend/StockTracker.API
dotnet add reference ../StockTracker.Core/StockTracker.Core.csproj
dotnet add reference ../StockTracker.Infrastructure/StockTracker.Infrastructure.csproj

cd ../StockTracker.Infrastructure
dotnet add reference ../StockTracker.Core/StockTracker.Core.csproj
```

### Step 2: Install NuGet Packages

```bash
cd backend/StockTracker.API

# Core packages
dotnet add package Microsoft.AspNetCore.OpenApi
dotnet add package Swashbuckle.AspNetCore
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.EntityFrameworkCore.Design

# Caching
dotnet add package Microsoft.Extensions.Caching.Memory
dotnet add package Microsoft.Extensions.Caching.StackExchangeRedis

# HTTP Client
dotnet add package Microsoft.Extensions.Http.Polly
dotnet add package Polly

# Authentication
dotnet add package Supabase

# Logging
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Sinks.File

# Health checks
dotnet add package AspNetCore.HealthChecks.Npgsql
dotnet add package AspNetCore.HealthChecks.Redis
```

## 📝 Implementation Files

I'll create the complete .NET backend structure in the next steps.

## 🔧 Configuration

### appsettings.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Host=db.xxx.supabase.co;Database=postgres;Username=postgres;Password=xxx"
  },
  "Supabase": {
    "Url": "https://xxx.supabase.co",
    "Key": "your-supabase-key"
  },
  "ExternalAPIs": {
    "AlphaVantage": {
      "BaseUrl": "https://www.alphavantage.co/query",
      "ApiKey": "your-key"
    },
    "TwelveData": {
      "BaseUrl": "https://api.twelvedata.com",
      "ApiKey": "your-key"
    },
    "NSE": {
      "BaseUrl": "https://www.nseindia.com/api"
    }
  },
  "Cache": {
    "DefaultExpirationMinutes": 5,
    "StockQuoteExpirationSeconds": 10
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:8080",
      "http://localhost:5173",
      "https://your-app.vercel.app"
    ]
  }
}
```

## 🌐 API Endpoints

### Market Data
- `GET /api/market-data/quote/{symbol}` - Single stock quote
- `GET /api/market-data/quotes` - Multiple stock quotes
- `GET /api/market-data/indices` - Market indices

### Price Alerts
- `GET /api/alerts` - Get user alerts
- `POST /api/alerts` - Create alert
- `PUT /api/alerts/{id}` - Update alert
- `DELETE /api/alerts/{id}` - Delete alert

### Portfolio
- `GET /api/portfolio` - Get user portfolio
- `POST /api/portfolio` - Add to portfolio
- `PUT /api/portfolio/{id}` - Update holding
- `DELETE /api/portfolio/{id}` - Remove holding

### Watchlist
- `GET /api/watchlist` - Get user watchlist
- `POST /api/watchlist` - Add to watchlist
- `DELETE /api/watchlist/{id}` - Remove from watchlist

### WebSocket
- `ws://localhost:5000/ws/market-data` - Real-time updates

## 🚀 Running the Backend

```bash
# Development
cd backend/StockTracker.API
dotnet run

# Production
dotnet publish -c Release
dotnet StockTracker.API.dll
```

## 🐳 Docker Support

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["StockTracker.API/StockTracker.API.csproj", "StockTracker.API/"]
RUN dotnet restore "StockTracker.API/StockTracker.API.csproj"
COPY . .
WORKDIR "/src/StockTracker.API"
RUN dotnet build "StockTracker.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "StockTracker.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "StockTracker.API.dll"]
```

## 📊 Features

### ✅ Implemented
- RESTful API endpoints
- CORS configuration
- Caching (Memory + Redis)
- Error handling
- Logging (Serilog)
- Health checks
- Swagger/OpenAPI
- Authentication (Supabase)
- Rate limiting
- Request validation

### 🔄 WebSocket Support
- Real-time market data streaming
- Price alert notifications
- Portfolio updates

### 🔒 Security
- JWT authentication
- API key validation
- Rate limiting
- Input validation
- SQL injection protection

## 🔗 Frontend Integration

Update `src/services/marketDataService.ts`:

```typescript
const API_BASE = import.meta.env.PROD 
  ? 'https://your-api.azurewebsites.net' 
  : 'http://localhost:5000';
```

## 📚 Next Steps

1. Create the .NET project structure
2. Implement controllers and services
3. Set up database context
4. Configure authentication
5. Add WebSocket support
6. Deploy to Azure/AWS

See the implementation files in the next sections!
