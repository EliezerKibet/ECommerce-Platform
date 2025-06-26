// Services/IOrderService.cs
using ECommerce.API.DTOs;
using ECommerce.API.Models;

namespace ECommerce.API.Services
{
    public interface IOrderService
    {
        Task<Order> CreateOrderFromCartAsync(string userId, CheckoutDto checkoutDto);
        Task<ReceiptDto> GenerateReceiptAsync(int orderId);
        Task<List<Order>> GetUserOrdersAsync(string userId);
        Task<Order> GetOrderByIdAsync(int orderId);
        Task<Order> UpdateOrderStatusAsync(int orderId, string status);
        Task<List<object>> GetOrderIds();
        Task<Order> FindOrderByNumberAsync(string orderNumber);

        Task<List<object>> GetGuestIdsWithOrderCounts();

    }
}