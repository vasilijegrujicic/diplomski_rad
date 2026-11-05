FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY src/WoBistDu.Domain/WoBistDu.Domain.csproj src/WoBistDu.Domain/
COPY src/WoBistDu.Infrastructure/WoBistDu.Infrastructure.csproj src/WoBistDu.Infrastructure/
COPY src/WoBistDu.Infrastructure.Authentication/WoBistDu.Infrastructure.Authentication.csproj src/WoBistDu.Infrastructure.Authentication/
COPY src/WoBistDu.Api/WoBistDu.Api.csproj src/WoBistDu.Api/
RUN dotnet restore src/WoBistDu.Api/WoBistDu.Api.csproj

COPY src/ src/
RUN dotnet publish src/WoBistDu.Api/WoBistDu.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "WoBistDu.Api.dll"]
