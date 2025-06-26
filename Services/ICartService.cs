// Services/ICartService.cs
using ECommerce.API.DTOs;

namespace ECommerce.API.Services
{
    public interface ICartService
    {
        Task<CartDto> GetCartAsync(string userId);
        Task<CartDto> GetCartByIdAsync(int cartId);
        Task<CartDto> CreateCartAsync(string userId);
        Task<CartDto> AddToCartAsync(string userId, AddToCartDto addToCartDto);
        Task<CartDto> UpdateCartItemAsync(string userId, int cartItemId, UpdateCartItemDto updateCartItemDto);
        Task<CartDto> RemoveFromCartAsync(string userId, int cartItemId);
        Task<CartDto> ClearCartAsync(string userId);
        Task<bool> TransferGuestCartAsync(int guestCartId, string userId);
        Task<CartDto> MergeCartsAsync(string sourceUserId, string targetUserId);
    }
}