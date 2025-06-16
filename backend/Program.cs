using ECommerce.API.Data;
using ECommerce.API.Helpers;
using ECommerce.API.Interfaces;
using ECommerce.API.Middleware;
using ECommerce.API.Models;
using ECommerce.API.Repositories;
using ECommerce.API.Services;
using FluentAssertions.Common;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using EmailService = ECommerce.API.Services.EmailService;

namespace ECommerce.API
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
                });
            builder.Services.AddEndpointsApiExplorer();

            // Configure Swagger
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "Chocolate E-Commerce API",
                    Version = "v1",
                    Description = "API for managing a chocolate e-commerce store",
                    Contact = new OpenApiContact
                    {
                        Name = "Eliezer Kibet",
                        Email = "elieserkibet@gmail.com"
                    }
                });

                // Add JWT authentication to Swagger
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        new string[] {}
                    }
                });
            });

            // Register DbContext as scoped (for regular operations)
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            // Create a custom DbContextFactory that doesn't depend on singleton-scoped mismatch
            builder.Services.AddScoped<IDbContextFactory<ApplicationDbContext>>(serviceProvider =>
            {
                // Get the options from the service provider
                var options = serviceProvider.GetRequiredService<DbContextOptions<ApplicationDbContext>>();
                return new CustomDbContextFactory(options);
            });

            // Then update the Analytics service registration
            builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();

            // Add Identity services
            builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                // Password settings
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = true;
                options.Password.RequiredLength = 6;

                // Lockout settings
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.AllowedForNewUsers = true;

                // User settings
                options.User.RequireUniqueEmail = true;
                options.SignIn.RequireConfirmedEmail = true;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

            // Register repositories
            builder.Services.AddScoped<IProductRepository, ProductRepository>();
            builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
            builder.Services.AddScoped<IOrderRepository, OrderRepository>();

            // Register services
            builder.Services.AddScoped<IProductService, ProductService>();
            builder.Services.AddScoped<ICategoryService, CategoryService>();
            builder.Services.AddScoped<IOrderService, OrderService>();
            builder.Services.AddScoped<ICartService, CartService>();
            builder.Services.AddScoped<IEmailService, EmailService>();

            // Add AutoMapper
            builder.Services.AddAutoMapper(typeof(MappingProfiles));

            // Configure static files for image uploads
            builder.Services.AddDirectoryBrowser();

            // Configure CORS - FIXED: Remove duplicate CORS configuration
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowNextJS", policy =>
                {
                    policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });

                // Keep your existing policy as well
                options.AddPolicy("CorsPolicy", builder =>
                {
                    builder.AllowAnyOrigin()
                           .AllowAnyMethod()
                           .AllowAnyHeader();
                });
            });

            builder.Services.AddScoped<IReviewService, ReviewService>();
            builder.Services.AddTransient<CartPatchService>();
            builder.Services.AddScoped<IShippingAddressService, ShippingAddressService>();
            builder.Services.AddScoped<ICouponService, CouponService>();
            builder.Services.AddScoped<IPromotionService, PromotionService>();
            builder.Services.AddScoped<ISearchService, SearchService>();

            // Configure JWT Authentication
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = "Chocolate E-Commerce",
                    ValidAudience = "Customers",
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                        "CHOCOLATEECOMMERCESUPERSECRETAPIKEYTHATNOONEKNOWSANDSHOUDLNOTSHARE"))
                };

                // Add this for debugging
                options.Events = new JwtBearerEvents
                {
                    OnAuthenticationFailed = context =>
                    {
                        Console.WriteLine($"JWT Authentication failed: {context.Exception.Message}");
                        return Task.CompletedTask;
                    },
                    OnTokenValidated = context =>
                    {
                        Console.WriteLine("JWT Token validated successfully");
                        return Task.CompletedTask;
                    }
                };
            });


            // Add authorization
            builder.Services.AddAuthorization();

            // FIXED: Build the app AFTER all services are configured
            var app = builder.Build();

            // Configure the HTTP request pipeline
            if (app.Environment.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseSwagger();
                app.UseSwaggerUI(c => {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Chocolate API v1");
                    c.RoutePrefix = "swagger"; // This ensures swagger is available at /swagger
                });

                // Add redirect from root to Swagger
                app.MapGet("/", () => Results.Redirect("/swagger"));
            }

            app.UseHttpsRedirection();

            // Configure static files for uploads
            app.UseStaticFiles();

            // Create uploads directory if it doesn't exist
            var uploadsPath = Path.Combine(builder.Environment.WebRootPath ??
                Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");

            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            // Configure directory browsing for uploads folder
            app.UseDirectoryBrowser(new DirectoryBrowserOptions
            {
                FileProvider = new PhysicalFileProvider(uploadsPath),
                RequestPath = "/uploads"
            });

            // FIXED: Use CORS middleware in correct order
            app.UseCors("AllowNextJS");

            // Guest cart middleware should be before authentication
            app.UseGuestCart();

            // Authentication and Authorization middleware
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            // Seed the database
            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                try
                {
                    var context = services.GetRequiredService<ApplicationDbContext>();
                    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
                    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

                    await DataSeeder.SeedData(context, roleManager, userManager);

                    // Execute raw SQL to add missing columns if they don't exist
                    context.Database.ExecuteSqlRaw(@"
                        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'ShippingName')
                            ALTER TABLE Orders ADD ShippingName NVARCHAR(MAX) NULL;
                            
                        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'ShippingAddressLine1')
                            ALTER TABLE Orders ADD ShippingAddressLine1 NVARCHAR(MAX) NULL;
                            
                        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'ShippingAddressLine2')
                            ALTER TABLE Orders ADD ShippingAddressLine2 NVARCHAR(MAX) NULL;
                            
                        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'ShippingCity')
                            ALTER TABLE Orders ADD ShippingCity NVARCHAR(MAX) NULL;
                            
                        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'ShippingState')
                            ALTER TABLE Orders ADD ShippingState NVARCHAR(MAX) NULL;
                            
                        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'ShippingZipCode')
                            ALTER TABLE Orders ADD ShippingZipCode NVARCHAR(MAX) NULL;
                            
                        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'ShippingCountry')
                            ALTER TABLE Orders ADD ShippingCountry NVARCHAR(MAX) NULL;
                            
                        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'ShippingPhoneNumber')
                            ALTER TABLE Orders ADD ShippingPhoneNumber NVARCHAR(MAX) NULL;
                            
                        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'PaymentMethod')
                            ALTER TABLE Orders ADD PaymentMethod NVARCHAR(MAX) NULL;
                    ");

                    Console.WriteLine("Database schema updated with shipping columns");
                }
                catch (Exception ex)
                {
                    var logger = services.GetRequiredService<ILogger<Program>>();
                    logger.LogError(ex, "An error occurred during database seeding");
                }
            }

            // Run the application
            await app.RunAsync();
        }
    }
}