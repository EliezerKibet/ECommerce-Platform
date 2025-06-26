using ECommerce.API.DTOs;
using ECommerce.API.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace ECommerce.API.Services
{
    public static class OrderServiceExtensions
    {
        /// <summary>
        /// Safe wrapper around CreateOrderFromCartAsync that handles potential null cart properties
        /// </summary>
        public static async Task<Order> SafeCreateOrderAsync(
            this IOrderService orderService,
            ICartService cartService,
            string userId,
            CheckoutDto checkoutDto,
            ILogger logger)
        {
            logger.LogInformation("Starting safe order creation for user {UserId}", userId);

            // Get the cart and validate it
            var cart = await cartService.GetCartAsync(userId);

            // Validate cart is not null
            if (cart == null)
            {
                logger.LogError("Cart is null for user {UserId}", userId);
                throw new InvalidOperationException("Your shopping cart could not be found. Please try refreshing the page.");
            }

            // Validate cart.Items is not null
            if (cart.Items == null)
            {
                logger.LogError("Cart.Items is null for user {UserId}", userId);
                throw new InvalidOperationException("Your shopping cart appears to be corrupted. Please try adding items again.");
            }

            // Validate cart has items
            if (cart.Items.Count == 0)
            {
                logger.LogWarning("Empty cart for user {UserId}", userId);
                throw new InvalidOperationException("Your shopping cart is empty. Please add items before checking out.");
            }

            logger.LogInformation("Cart validated for user {UserId}, contains {ItemCount} items with total {Total}",
                userId, cart.Items.Count, cart.Total);

            // Try to set customer email if it's missing
            if (string.IsNullOrEmpty(checkoutDto.CustomerEmail) && !string.IsNullOrEmpty(checkoutDto.ShippingAddress?.Email))
            {
                checkoutDto.CustomerEmail = checkoutDto.ShippingAddress.Email;
                logger.LogInformation("Set CustomerEmail from ShippingAddress.Email: {Email}", checkoutDto.CustomerEmail);
            }

            // Now call the original service with confidence that the cart is valid
            try
            {
                return await orderService.CreateOrderFromCartAsync(userId, checkoutDto);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("empty cart"))
            {
                // If still failing despite our validation, do a deep check
                var recheck = await cartService.GetCartAsync(userId);
                if (recheck?.Items?.Count > 0)
                {
                    logger.LogError("Cart validation issue: Service reports empty cart but validation found {Count} items",
                        recheck.Items.Count);
                    throw new InvalidOperationException(
                        "There was a discrepancy between the cart validation and checkout process. " +
                        "Please try adding items to your cart again.");
                }
                throw; // Otherwise rethrow the original exception
            }
        }
    }
}