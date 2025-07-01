using ECommerce.API.DTOs;
using ECommerce.API.Interfaces;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.API.Services
{
    public class CartPatchService
    {
        private readonly ICartService _cartService;
        private readonly ILogger<CartPatchService> _logger;

        public CartPatchService(ICartService cartService, ILogger<CartPatchService> logger)
        {
            _cartService = cartService;
            _logger = logger;
        }

        public async Task<CartDto> EnsureValidCartAsync(string userId)
        {
            try
            {
                _logger.LogInformation("Validating cart for user {UserId}", userId);

                var cart = await _cartService.GetCartAsync(userId);

                if (cart == null)
                {
                    _logger.LogWarning("Cart is null for user {UserId}, creating a new cart", userId);

                    try
                    {
                        cart = await _cartService.CreateCartAsync(userId);
                        _logger.LogInformation("New cart created for user {UserId}", userId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to create new cart for user {UserId}", userId);
                        return new CartDto
                        {
                            UserId = userId,
                            Items = new List<CartItemDto>(),
                            Subtotal = 0,
                            Tax = 0,
                            Total = 0,
                            ItemCount = 0
                        };
                    }
                }
                if (cart.Items == null)
                {
                    _logger.LogWarning("Cart.Items is null for user {UserId}, initializing empty collection", userId);

                    cart.Items = new List<CartItemDto>();
                }

                return cart;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in EnsureValidCart for user {UserId}", userId);
                throw;
            }
        }

        public async Task ValidateCartHasItemsAsync(string userId)
        {
            var cart = await EnsureValidCartAsync(userId);

            if (cart.Items.Count == 0)
            {
                _logger.LogWarning("Attempted to process an empty cart for user {UserId}", userId);
                throw new InvalidOperationException("Your shopping cart is empty. Please add items before checking out.");
            }

            _logger.LogInformation("Cart validated for user {UserId}, contains {ItemCount} items",
                userId, cart.Items.Count);
        }
    }
}