using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using WoBistDu.Domain.Interfaces;
using WoBistDu.Api.Bot;
using WoBistDu.Api.Security;
using WoBistDu.Api.Services;
using WoBistDu.Domain.Interfaces;
using WoBistDu.Infrastructure.Authentication;
using WoBistDu.Infrastructure.Persistence;
using WoBistDu.Infrastructure.Persistence.Repositories;
using WoBistDu.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// --- Infrastructure ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserFilterRepository, UserFilterRepository>();
builder.Services.AddScoped<IListingRepository, ListingRepository>();
builder.Services.AddScoped<IPendingRegistrationRepository, PendingRegistrationRepository>();
builder.Services.AddScoped<IPaymentService, StripePaymentService>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

// --- Application ---
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IMatchingService, MatchingService>();
builder.Services.AddScoped<IFinalizeRegistrationService, FinalizeRegistrationService>();

// --- API ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://flat-finder-xi.vercel.app")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
builder.Services.AddAuthRateLimiting();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });

builder.Services.AddHttpClient<ITelegramService, TelegramBotService>();
builder.Services.AddScoped<TelegramUpdateHandler>();
builder.Services.AddHttpClient(TelegramPollingService.HttpClientName, client => client.Timeout = TimeSpan.FromSeconds(60));
builder.Services.AddHostedService<TelegramPollingService>();

// Request URLs to api.telegram.org contain the bot token; never log them at Information.
builder.Logging.AddFilter("System.Net.Http.HttpClient", LogLevel.Warning);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseForwardedHeaders(RateLimiting.ForwardedHeadersBehindProxy());
app.UseMiddleware<InternalApiKeyMiddleware>();
app.UseCors("FrontendPolicy");
app.UseRateLimiter();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
