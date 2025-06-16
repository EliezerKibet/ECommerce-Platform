// Interfaces/IOrderRepository.cs
using ECommerce.API.Models;

namespace ECommerce.API.Interfaces
{
    public interface IOrderRepository : IRepository<Order>
    {
        // Additional order-specific operations
        Task<IEnumerable<Order>> GetOrdersByUserIdAsync(string userId);
        Task<Order> GetOrderWithItemsAsync(int id);
    }
}