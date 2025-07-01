using ECommerce.API.Models;
using System.Threading.Tasks;

namespace ECommerce.API.Interfaces
{
    public interface ICategoryRepository : IRepository<Category>
    {
        Task<Category> GetCategoryWithProductsAsync(int id);
    }
}