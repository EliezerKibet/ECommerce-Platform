// Interfaces/IProductRepository.cs
using ECommerce.API.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.API.Interfaces
{
    public interface IProductRepository : IRepository<Product>
    {
        // Additional product-specific operations
        Task<IEnumerable<Product>> GetProductsByCategoryAsync(int categoryId);
        Task<IEnumerable<Product>> SearchProductsAsync(string searchTerm);
    }
}