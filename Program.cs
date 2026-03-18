using Linear_v1.Data;
using Linear_v1.Models;
using Linear_v1.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Data;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");

    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorCodesToAdd: null);
    });
});

// Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 6;
    options.Password.RequireDigit = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.SignIn.RequireConfirmedEmail = true;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Cookie
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Account/Login";
    options.AccessDeniedPath = "/Account/AccessDenied";
    options.ExpireTimeSpan = TimeSpan.FromDays(7);
});

// App services
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddControllersWithViews();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// Critical startup step: migrate + seed, fail fast if broken
await InitializeDatabaseAsync(app.Services);

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Account}/{action=Login}/{id?}");

app.Run();

static async Task InitializeDatabaseAsync(IServiceProvider services)
{
    await using var scope = services.CreateAsyncScope();
    var provider = scope.ServiceProvider;

    var logger = provider.GetRequiredService<ILoggerFactory>()
        .CreateLogger("Startup.Database");

    try
    {
        var env = provider.GetRequiredService<IHostEnvironment>();
        var db = provider.GetRequiredService<ApplicationDbContext>();

        if (env.IsDevelopment())
        {
            await ReconcileInitialMigrationHistoryAsync(db, logger);
            await db.Database.MigrateAsync();
        }
        else
        {
            var pending = (await db.Database.GetPendingMigrationsAsync()).ToList();
            if (pending.Count > 0)
            {
                logger.LogCritical(
                    "Pending migrations found in {Environment}: {Migrations}",
                    env.EnvironmentName,
                    string.Join(", ", pending));

                throw new InvalidOperationException(
                    "Database schema is not up to date. Apply migrations before starting the app.");
            }
        }

        var roleManager = provider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = provider.GetRequiredService<UserManager<ApplicationUser>>();
        var config = provider.GetRequiredService<IConfiguration>();

        foreach (var role in new[] { "Admin", "User" })
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        var adminEmail = config["SeedUsers:Admin:Email"] ?? "admin@linearai.com";
        var adminName = config["SeedUsers:Admin:FullName"] ?? "Linear Admin";
        var adminPassword = config["SeedUsers:Admin:Password"];

        if (!string.IsNullOrWhiteSpace(adminPassword))
        {
            await EnsureUserAsync(userManager, adminEmail, adminName, adminPassword, "Admin");
        }
    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "Database initialization failed.");
        throw;
    }
}

static async Task EnsureUserAsync(
    UserManager<ApplicationUser> userManager,
    string email,
    string fullName,
    string password,
    string role)
{
    var existing = await userManager.FindByEmailAsync(email);
    if (existing != null) return;

    var user = new ApplicationUser
    {
        FullName = fullName,
        UserName = email,
        Email = email,
        EmailConfirmed = true,
        IsActive = true
    };

    var result = await userManager.CreateAsync(user, password);
    if (!result.Succeeded)
    {
        var errors = string.Join(", ", result.Errors.Select(e => e.Description));
        throw new InvalidOperationException($"Failed to create seed user '{email}': {errors}");
    }

    var roleResult = await userManager.AddToRoleAsync(user, role);
    if (!roleResult.Succeeded)
    {
        var errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
        throw new InvalidOperationException($"Failed to add seed user '{email}' to role '{role}': {errors}");
    }
}

static async Task ReconcileInitialMigrationHistoryAsync(ApplicationDbContext db, ILogger logger)
{
    var pendingMigrations = (await db.Database.GetPendingMigrationsAsync()).ToList();
    if (pendingMigrations.Count == 0)
    {
        return;
    }

    var initialPendingMigrations = pendingMigrations
        .Where(m => m.Contains("InitialCreate", StringComparison.OrdinalIgnoreCase))
        .ToList();

    if (initialPendingMigrations.Count == 0)
    {
        return;
    }

    var connection = db.Database.GetDbConnection();
    var shouldCloseConnection = connection.State != ConnectionState.Open;

    if (shouldCloseConnection)
    {
        await connection.OpenAsync();
    }

    try
    {
        await using var tableExistsCommand = connection.CreateCommand();
        tableExistsCommand.CommandText = @"
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = 'AspNetRoles');";

        var aspNetRolesExists = (bool)(await tableExistsCommand.ExecuteScalarAsync() ?? false);
        if (!aspNetRolesExists)
        {
            return;
        }

        await using var createHistoryTableCommand = connection.CreateCommand();
        createHistoryTableCommand.CommandText = @"
            CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
                ""MigrationId"" character varying(150) NOT NULL,
                ""ProductVersion"" character varying(32) NOT NULL,
                CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY (""MigrationId"")
            );";
        await createHistoryTableCommand.ExecuteNonQueryAsync();

        var efCoreAssemblyVersion = typeof(DbContext).Assembly.GetName().Version;
        var productVersion = efCoreAssemblyVersion is null
            ? "10.0.0"
            : $"{efCoreAssemblyVersion.Major}.{efCoreAssemblyVersion.Minor}.{efCoreAssemblyVersion.Build}";

        foreach (var migrationId in initialPendingMigrations)
        {
            await using var insertHistoryCommand = connection.CreateCommand();
            insertHistoryCommand.CommandText = @"
                INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                VALUES (@migrationId, @productVersion)
                ON CONFLICT (""MigrationId"") DO NOTHING;";

            var migrationIdParameter = insertHistoryCommand.CreateParameter();
            migrationIdParameter.ParameterName = "@migrationId";
            migrationIdParameter.Value = migrationId;
            insertHistoryCommand.Parameters.Add(migrationIdParameter);

            var productVersionParameter = insertHistoryCommand.CreateParameter();
            productVersionParameter.ParameterName = "@productVersion";
            productVersionParameter.Value = productVersion;
            insertHistoryCommand.Parameters.Add(productVersionParameter);

            await insertHistoryCommand.ExecuteNonQueryAsync();
            logger.LogWarning(
                "Migration history reconciled for pending initial migration '{MigrationId}' because Identity tables already exist.",
                migrationId);
        }
    }
    finally
    {
        if (shouldCloseConnection)
        {
            await connection.CloseAsync();
        }
    }
}
