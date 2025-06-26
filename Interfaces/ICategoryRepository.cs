// Interfaces/ICategoryRepository.cs
using ECommerce.API.Models;
using System.Threading.Tasks;

namespace ECommerce.API.Interfaces
{
    public interface ICategoryRepository : IRepository<Category>
    {
        // Additional category-specific operations
        Task<Category> GetCategoryWithProductsAsync(int id);
    }
}