// CustomDbContextFactory.cs
using ECommerce.API.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API
{
    public class CustomDbContextFactory : IDbContextFactory<ApplicationDbContext>
    {
        private readonly DbContextOptions<ApplicationDbContext> _options;

        public CustomDbContextFactory(DbContextOptions<ApplicationDbContext> options)
        {
            _options = options;
        }

        public ApplicationDbContext CreateDbContext()
        {
            return new ApplicationDbContext(_options);
        }
    }
}