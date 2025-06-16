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

        /// <summary>
        /// Ensures a cart exists and has a valid Items collection
        /// </summary>
        public async Task<CartDto> EnsureValidCartAsync(string userId)
        {
            try
            {
                _logger.LogInformation("Validating cart for user {UserId}", userId);

                var cart = await _cartService.GetCartAsync(userId);

                // Check if cart is null
                if (cart == null)
                {
                    _logger.LogWarning("Cart is null for user {UserId}, creating a new cart", userId);

                    // Some cart implementations might return null rather than empty cart
                    // Create a new cart in this case
                    try
                    {
                        cart = await _cartService.CreateCartAsync(userId);
                        _logger.LogInformation("New cart created for user {UserId}", userId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to create new cart for user {UserId}", userId);
                        // Return a minimal valid cart to prevent null reference exceptions
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

                // Check if Items is null
                if (cart.Items == null)
                {
                    _logger.LogWarning("Cart.Items is null for user {UserId}, initializing empty collection", userId);

                    // Initialize an empty collection to prevent null reference exceptions
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

        /// <summary>
        /// Checks if a cart has items and throws a user-friendly exception if not
        /// </summary>
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