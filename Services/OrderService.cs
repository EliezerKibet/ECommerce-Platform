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


            decimal shippingCost = CalculateShippingCost(checkoutDto.ShippingMethod, cart.ItemCount);


            decimal discount = 0;
            string appliedCouponCode = null;


            if (!string.IsNullOrEmpty(checkoutDto.CouponCode))
            {
                try
                {
                    var couponValidation = await _couponService.ValidateCouponAsync(new ValidateCouponDto
                    {
                        Code = checkoutDto.CouponCode,
                        OrderAmount = cart.Subtotal
                    });

                    if (couponValidation.IsValid)
                    {
                        discount = couponValidation.DiscountAmount;
                        appliedCouponCode = checkoutDto.CouponCode;

                        _logger.LogInformation("Applied coupon {CouponCode} with discount {DiscountAmount} to order for user {UserId}",
                            checkoutDto.CouponCode, discount, userId);

                        await _couponService.IncrementUsageAsync(checkoutDto.CouponCode);
                    }
                    else
                    {
                        _logger.LogWarning("Invalid coupon {CouponCode} for user {UserId}: {Message}",
                            checkoutDto.CouponCode, userId, couponValidation.Message);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error applying coupon {CouponCode} for user {UserId}: {Message}",
                        checkoutDto.CouponCode, userId, ex.Message);
                }
            }

            decimal subtotal = cart.Subtotal;
            decimal tax = Math.Round(subtotal * 0.08m, 2); // Assuming 8% tax
            decimal total = subtotal + tax + shippingCost - discount;

            var order = new Order
            {
                UserId = userId,
                OrderDate = DateTime.UtcNow,
                TotalAmount = total,
                Status = "Pending",

                CustomerEmail = checkoutDto.CustomerEmail,

                ShippingMethod = checkoutDto.ShippingMethod ?? "standard",

                OrderNotes = checkoutDto.OrderNotes,

                ShippingName = checkoutDto.ShippingAddress.FullName,
                ShippingAddressLine1 = checkoutDto.ShippingAddress.AddressLine1,
                ShippingAddressLine2 = checkoutDto.ShippingAddress.AddressLine2 ?? "",
                ShippingCity = checkoutDto.ShippingAddress.City,
                ShippingState = checkoutDto.ShippingAddress.State,
                ShippingZipCode = checkoutDto.ShippingAddress.ZipCode,
                ShippingCountry = checkoutDto.ShippingAddress.Country,
                ShippingPhoneNumber = checkoutDto.ShippingAddress.PhoneNumber,

                PaymentMethod = checkoutDto.BillingInfo?.PaymentMethod ?? "cod",

                CouponCode = appliedCouponCode,
                DiscountAmount = discount,

                Subtotal = subtotal,
                ShippingCost = shippingCost,
                Tax = tax,

                OrderItems = new List<OrderItem>()
            };

            foreach (var cartItem in cart.Items)
            {
                var product = await _context.Products.FindAsync(cartItem.ProductId);
                if (product == null)
                {
                    throw new KeyNotFoundException($"Product with ID {cartItem.ProductId} not found");
                }

                var orderItem = new OrderItem
                {
                    ProductId = cartItem.ProductId,
                    ProductName = product.Name,
                    ProductPrice = product.Price,
                    Quantity = cartItem.Quantity,
                    Subtotal = cartItem.LineTotal
                };
                order.OrderItems.Add(orderItem);

                product.StockQuantity -= cartItem.Quantity;
                _context.Products.Update(product);
            }

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            await _cartService.ClearCartAsync(userId);

            return order;
        }
        public async Task<ReceiptDto> GenerateReceiptAsync(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                throw new KeyNotFoundException($"Order with ID {orderId} not found");
            }

            var receipt = new ReceiptDto
            {
                OrderId = order.Id,
                OrderNumber = $"CHC-{order.Id:D6}",
                OrderDate = order.OrderDate,

                CustomerName = order.ShippingName ?? "Valued Customer",
                ShippingAddressLine1 = order.ShippingAddressLine1 ?? "Address not available in order record",
                ShippingAddressLine2 = order.ShippingAddressLine2,
                ShippingCity = order.ShippingCity ?? "",
                ShippingState = order.ShippingState ?? "",
                ShippingZipCode = order.ShippingZipCode ?? "",
                ShippingCountry = order.ShippingCountry ?? "",
                PhoneNumber = order.ShippingPhoneNumber ?? "",

                PaymentMethod = order.PaymentMethod == "card" ? "Credit/Debit Card" : "Cash on Delivery",
                PaymentStatus = order.PaymentMethod == "card" ? "Payment completed" : "Payment due on delivery",

                Subtotal = order.Subtotal > 0 ? order.Subtotal : order.OrderItems.Sum(i => i.Subtotal),
                ShippingCost = order.ShippingCost > 0 ? order.ShippingCost :
                    CalculateShippingCost(order.PaymentMethod ?? "standard", order.OrderItems.Sum(i => i.Quantity)),
                Tax = order.Tax > 0 ? order.Tax :
                    Math.Round(order.OrderItems.Sum(i => i.Subtotal) * 0.08m, 2),

                CouponCode = order.CouponCode,
                DiscountAmount = order.DiscountAmount,
                Total = order.TotalAmount,
                OrderStatus = order.Status,
                OrderNotes = order.OrderNotes,
                ShippingMethod = order.ShippingMethod ?? "standard",
                EstimatedDelivery = GetEstimatedDeliveryDate(order.OrderDate, order.ShippingMethod ?? "standard")
            };

            foreach (var orderItem in order.OrderItems)
            {
                var receiptItem = new ReceiptItemDto
                {
                    ProductName = orderItem.ProductName,
                    ProductImage = orderItem.Product?.ImageUrl, 
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
            if (!string.IsNullOrEmpty(userId) && !userId.StartsWith("guest-") && userId.Contains("guest-"))
            {
                userId = userId;
            }

            if (string.IsNullOrEmpty(userId))
            {
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
                return new List<Order>();
            }
        }

        [HttpGet("order-ids")]
        public async Task<List<object>> GetOrderIds()
        {
            try
            {
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

        public async Task<List<object>> GetGuestIdsWithOrderCounts()
        {
            try
            {
                var guestOrderIds = await _context.Orders
                    .Where(o => o.UserId.StartsWith("guest-"))
                    .Select(o => new {
                        FullId = o.UserId,
                        GuestId = o.UserId.Substring(6), 
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

        private decimal CalculateShippingCost(string shippingMethod, int itemCount)
        {
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
            switch (couponCode.ToUpper())
            {
                case "WELCOME10":
                    return Math.Round(subtotal * 0.10m, 2); 
                case "CHOCO5":
                    return 5.00m;
                default:
                    return 0; 
            }
        }

        public async Task<Order> FindOrderByNumberAsync(string orderNumber)
        {
            if (string.IsNullOrEmpty(orderNumber))
            {
                return null;
            }

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

            if (int.TryParse(orderNumber, out int directId))
            {
                return await _context.Orders
                    .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                    .FirstOrDefaultAsync(o => o.Id == directId);
            }

            return null;
        }

        private string GetEstimatedDeliveryDate(DateTime orderDate, string shippingMethod)
        {
            int minDays, maxDays;
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