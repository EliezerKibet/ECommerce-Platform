// Services/OrderService.cs
using ECommerce.API.Controllers;
using ECommerce.API.Data;
using ECommerce.API.DTOs;
using ECommerce.API.Interfaces;
using ECommerce.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Services
{
    public class OrderService : IOrderService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICartService _cartService;
        private readonly ICouponService _couponService;
        private readonly ILogger<OrderService> _logger;

        public OrderService(ApplicationDbContext context, ICartService cartService, ICouponService couponService, ILogger<OrderService> logger)
        {
            _context = context;
            _cartService = cartService;
            _couponService = couponService;
            _logger = logger;
        }

        public async Task<Order> CreateOrderFromCartAsync(string userId, CheckoutDto checkoutDto)
        {
            // Get user's cart
            var cart = await _cartService.GetCartAsync(userId);
            if (cart.Items.Count == 0)
            {
                throw new InvalidOperationException("Cannot create order from empty cart");
            }

            // Calculate shipping cost based on method
            decimal shippingCost = CalculateShippingCost(checkoutDto.ShippingMethod, cart.ItemCount);

            // Initialize discount and coupon variables
            decimal discount = 0;
            string appliedCouponCode = null;

            // Apply coupon if provided
            if (!string.IsNullOrEmpty(checkoutDto.CouponCode))
            {
                try
                {
                    // Validate the coupon using the coupon service
                    var couponValidation = await _couponService.ValidateCouponAsync(new ValidateCouponDto
                    {
                        Code = checkoutDto.CouponCode,
                        OrderAmount = cart.Subtotal // or include tax if your coupon applies to that
                    });

                    if (couponValidation.IsValid)
                    {
                        // Apply the discount
                        discount = couponValidation.DiscountAmount;
                        appliedCouponCode = checkoutDto.CouponCode;

                        // Log successful coupon application
                        _logger.LogInformation("Applied coupon {CouponCode} with discount {DiscountAmount} to order for user {UserId}",
                            checkoutDto.CouponCode, discount, userId);

                        // Increment coupon usage
                        await _couponService.IncrementUsageAsync(checkoutDto.CouponCode);
                    }
                    else
                    {
                        // Log invalid coupon, but continue with checkout
                        _logger.LogWarning("Invalid coupon {CouponCode} for user {UserId}: {Message}",
                            checkoutDto.CouponCode, userId, couponValidation.Message);
                    }
                }
                catch (Exception ex)
                {
                    // Log error but continue with checkout
                    _logger.LogError(ex, "Error applying coupon {CouponCode} for user {UserId}: {Message}",
                        checkoutDto.CouponCode, userId, ex.Message);
                }
            }

            // Calculate final total
            decimal subtotal = cart.Subtotal;
            decimal tax = Math.Round(subtotal * 0.08m, 2); // Assuming 8% tax
            decimal total = subtotal + tax + shippingCost - discount;

            // Create new order with shipping details
            var order = new Order
            {
                UserId = userId, // Store user ID as a string (can be guest or registered)
                OrderDate = DateTime.UtcNow,
                TotalAmount = total,
                Status = "Pending",

                // Add customer email (THIS IS MISSING IN YOUR CURRENT CODE)
                CustomerEmail = checkoutDto.CustomerEmail,

                // Add shipping method
                ShippingMethod = checkoutDto.ShippingMethod ?? "standard",

                // Add order notes
                OrderNotes = checkoutDto.OrderNotes,

                // Add shipping details from checkout DTO
                ShippingName = checkoutDto.ShippingAddress.FullName,
                ShippingAddressLine1 = checkoutDto.ShippingAddress.AddressLine1,
                ShippingAddressLine2 = checkoutDto.ShippingAddress.AddressLine2 ?? "",
                ShippingCity = checkoutDto.ShippingAddress.City,
                ShippingState = checkoutDto.ShippingAddress.State,
                ShippingZipCode = checkoutDto.ShippingAddress.ZipCode,
                ShippingCountry = checkoutDto.ShippingAddress.Country,
                ShippingPhoneNumber = checkoutDto.ShippingAddress.PhoneNumber,

                // Store payment method
                PaymentMethod = checkoutDto.BillingInfo?.PaymentMethod ?? "cod",

                // Add coupon and discount information
                CouponCode = appliedCouponCode,
                DiscountAmount = discount,

                // Add order amounts for better tracking
                Subtotal = subtotal,
                ShippingCost = shippingCost,
                Tax = tax,

                OrderItems = new List<OrderItem>()
            };

            // Add order items
            foreach (var cartItem in cart.Items)
            {
                var product = await _context.Products.FindAsync(cartItem.ProductId);
                if (product == null)
                {
                    throw new KeyNotFoundException($"Product with ID {cartItem.ProductId} not found");
                }

                // Create order item
                var orderItem = new OrderItem
                {
                    ProductId = cartItem.ProductId,
                    ProductName = product.Name,
                    ProductPrice = product.Price,
                    Quantity = cartItem.Quantity,
                    Subtotal = cartItem.LineTotal
                };
                order.OrderItems.Add(orderItem);

                // Update product stock
                product.StockQuantity -= cartItem.Quantity;
                _context.Products.Update(product);
            }

            // Save order to database
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Clear the cart
            await _cartService.ClearCartAsync(userId);

            return order;
        }
        public async Task<ReceiptDto> GenerateReceiptAsync(int orderId)
        {
            // Get order with items
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                throw new KeyNotFoundException($"Order with ID {orderId} not found");
            }

            // Create receipt with shipping information from the order
            var receipt = new ReceiptDto
            {
                OrderId = order.Id,
                OrderNumber = $"CHC-{order.Id:D6}",
                OrderDate = order.OrderDate,

                // Use shipping information from the order
                CustomerName = order.ShippingName ?? "Valued Customer",
                ShippingAddressLine1 = order.ShippingAddressLine1 ?? "Address not available in order record",
                ShippingAddressLine2 = order.ShippingAddressLine2,
                ShippingCity = order.ShippingCity ?? "",
                ShippingState = order.ShippingState ?? "",
                ShippingZipCode = order.ShippingZipCode ?? "",
                ShippingCountry = order.ShippingCountry ?? "",
                PhoneNumber = order.ShippingPhoneNumber ?? "",

                // Use payment method from the order
                PaymentMethod = order.PaymentMethod == "card" ? "Credit/Debit Card" : "Cash on Delivery",
                PaymentStatus = order.PaymentMethod == "card" ? "Payment completed" : "Payment due on delivery",

                // Use the order's stored values if available, otherwise calculate
                Subtotal = order.Subtotal > 0 ? order.Subtotal : order.OrderItems.Sum(i => i.Subtotal),
                ShippingCost = order.ShippingCost > 0 ? order.ShippingCost :
                    CalculateShippingCost(order.PaymentMethod ?? "standard", order.OrderItems.Sum(i => i.Quantity)),
                Tax = order.Tax > 0 ? order.Tax :
                    Math.Round(order.OrderItems.Sum(i => i.Subtotal) * 0.08m, 2),

                // Add coupon code and discount amount
                CouponCode = order.CouponCode,
                DiscountAmount = order.DiscountAmount,

                // Use the total from the order
                Total = order.TotalAmount,
                OrderStatus = order.Status,
                OrderNotes = order.OrderNotes,
                ShippingMethod = order.ShippingMethod ?? "standard",
                EstimatedDelivery = GetEstimatedDeliveryDate(order.OrderDate, order.ShippingMethod ?? "standard")
            };

            // Add receipt items
            foreach (var orderItem in order.OrderItems)
            {
                var receiptItem = new ReceiptItemDto
                {
                    ProductName = orderItem.ProductName,
                    ProductImage = orderItem.Product?.ImageUrl, // Use null conditional in case Product is null
                    CocoaPercentage = orderItem.Product?.CocoaPercentage ?? "Unknown",
                    Origin = orderItem.Product?.Origin ?? "Unknown",
                    Price = orderItem.ProductPrice,
                    Quantity = orderItem.Quantity,
                    Subtotal = orderItem.Subtotal,
                    IsGiftWrapped = false
                };
                receipt.Items.Add(receiptItem);
            }

            return receipt;
        }

        public async Task<List<Order>> GetUserOrdersAsync(string userId)
        {
            // Check if userId already includes "guest-" prefix
            if (!string.IsNullOrEmpty(userId) && !userId.StartsWith("guest-") && userId.Contains("guest-"))
            {
                // If the full ID was passed instead of just the ID part
                userId = userId; // Use as-is
            }

            if (string.IsNullOrEmpty(userId))
            {
                // Return an empty list if userId is null or empty
                return new List<Order>();
            }

            try
            {
                return await _context.Orders
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.Product)
                    .Where(o => o.UserId == userId)
                    .OrderByDescending(o => o.OrderDate)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving orders: {ex.Message}");
                // Return an empty list rather than throwing an exception
                return new List<Order>();
            }
        }

        // Services/OrderService.cs
        [HttpGet("order-ids")]
        // Replace this in OrderService.cs
        public async Task<List<object>> GetOrderIds()
        {
            try
            {
                // Just get the IDs and dates - avoid complex fields
                var orderIds = await _context.Orders
                    .Select(o => new {
                        o.Id,
                        o.OrderDate,
                        o.TotalAmount,
                        HasShipping = o.ShippingName != null
                    })
                    .OrderByDescending(o => o.OrderDate)
                    .ToListAsync();

                return orderIds.Cast<object>().ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving order IDs: {ex.Message}");
                return new List<object>();
            }
        }

        // Services/OrderService.cs
        public async Task<List<object>> GetGuestIdsWithOrderCounts()
        {
            try
            {
                var guestOrderIds = await _context.Orders
                    .Where(o => o.UserId.StartsWith("guest-"))
                    .Select(o => new {
                        FullId = o.UserId,
                        GuestId = o.UserId.Substring(6), // Remove "guest-" prefix
                        OrderId = o.Id
                    })
                    .GroupBy(g => g.GuestId)
                    .Select(g => new {
                        GuestId = g.Key,
                        OrderCount = g.Count(),
                        OrderIds = g.Select(x => x.OrderId).ToList()
                    })
                    .ToListAsync();

                return guestOrderIds.Cast<object>().ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving guest IDs: {ex.Message}");
                return new List<object>();
            }
        }

        // In OrderService.cs
        public async Task<Order> GetOrderByIdAsync(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                throw new KeyNotFoundException($"Order with ID {orderId} not found");
            }

            return order;
        }

        public async Task<Order> UpdateOrderStatusAsync(int orderId, string status)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Order with ID {orderId} not found");
            }

            order.Status = status;
            await _context.SaveChangesAsync();

            return order;
        }

        // Helper methods
        private decimal CalculateShippingCost(string shippingMethod, int itemCount)
        {
            // Calculate shipping cost based on method and number of items
            switch (shippingMethod.ToLower())
            {
                case "express":
                    return 12.99m + (itemCount > 5 ? (itemCount - 5) * 1.5m : 0);
                case "standard":
                default:
                    return 5.99m + (itemCount > 5 ? (itemCount - 5) * 0.75m : 0);
            }
        }

        private decimal ApplyCoupon(string couponCode, decimal subtotal)
        {
            // In a real application, you would check a database of valid coupons
            // For now, we'll just implement a few test coupons
            switch (couponCode.ToUpper())
            {
                case "WELCOME10":
                    return Math.Round(subtotal * 0.10m, 2); // 10% discount
                case "CHOCO5":
                    return 5.00m; // $5 off
                default:
                    return 0; // No discount for invalid coupons
            }
        }

        // Update this method in OrderService.cs
        public async Task<Order> FindOrderByNumberAsync(string orderNumber)
        {
            if (string.IsNullOrEmpty(orderNumber))
            {
                return null;
            }

            // Try to parse the format "CHC-000001" to get the order ID
            if (orderNumber.StartsWith("CHC-"))
            {
                string idPart = orderNumber.Substring(4).TrimStart('0');
                if (int.TryParse(idPart, out int orderId))
                {
                    return await _context.Orders
                        .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.Product)
                        .FirstOrDefaultAsync(o => o.Id == orderId);
                }
            }

            // If direct parsing fails, try as a direct ID
            if (int.TryParse(orderNumber, out int directId))
            {
                return await _context.Orders
                    .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                    .FirstOrDefaultAsync(o => o.Id == directId);
            }

            // Not a valid order number format
            return null;
        }

        private string GetEstimatedDeliveryDate(DateTime orderDate, string shippingMethod)
        {
            int minDays, maxDays;

            // Set delivery window based on shipping method
            switch (shippingMethod.ToLower())
            {
                case "express":
                    minDays = 1;
                    maxDays = 3;
                    break;
                case "standard":
                default:
                    minDays = 5;
                    maxDays = 7;
                    break;
            }

            // Calculate business days
            DateTime minDelivery = AddBusinessDays(orderDate, minDays);
            DateTime maxDelivery = AddBusinessDays(orderDate, maxDays);

            return $"{minDelivery.ToString("MMM dd")} - {maxDelivery.ToString("MMM dd, yyyy")}";
        }

        private DateTime AddBusinessDays(DateTime date, int days)
        {
            int daysAdded = 0;
            while (daysAdded < days)
            {
                date = date.AddDays(1);
                if (date.DayOfWeek != DayOfWeek.Saturday && date.DayOfWeek != DayOfWeek.Sunday)
                {
                    daysAdded++;
                }
            }
            return date;
        }
    }
}