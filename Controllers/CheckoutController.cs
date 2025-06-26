using ECommerce.API.DTOs;
using ECommerce.API.Interfaces;
using ECommerce.API.Models;
using ECommerce.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ECommerce.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CheckoutController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly IEmailService _emailService;
        private readonly ICartService _cartService;
        private readonly ILogger<CheckoutController> _logger;
        private readonly CartPatchService _cartPatchService;
        private readonly IShippingAddressService _addressService;
        private readonly IWebHostEnvironment _environment;
        private readonly IPromotionService _promotionService;
        private readonly ICouponService _couponService;

        public CheckoutController(
            IOrderService orderService,
            IEmailService emailService,
            ICartService cartService,
            ILogger<CheckoutController> logger,
            IShippingAddressService addressService,
            IWebHostEnvironment environment,
            IPromotionService promotionService,
            ICouponService couponService = null,
            CartPatchService cartPatchService = null) // Optional to maintain backward compatibility
        {
            _orderService = orderService;
            _cartService = cartService;
            _emailService = emailService;
            _logger = logger;
            _cartPatchService = cartPatchService;
            _addressService = addressService;
            _environment = environment;
            _promotionService = promotionService;
            _couponService = couponService;
        }



        // Add this new endpoint for calculating cart promotions
        [HttpPost("calculate-cart-promotions")]
        public async Task<ActionResult> CalculateCartPromotions()
        {
            string requestId = Guid.NewGuid().ToString().Substring(0, 8);

            try
            {
                string userId = GetCurrentUserId();
                _logger.LogInformation("[{RequestId}] Calculating cart promotions for user {UserId}", requestId, userId);

                var cart = await _cartService.GetCartAsync(userId);
                if (cart == null || cart.Items == null || cart.Items.Count == 0)
                {
                    return Ok(new
                    {
                        promotionDiscount = 0,
                        appliedPromotions = new List<object>(),
                        message = "No cart items found"
                    });
                }

                decimal totalPromotionDiscount = 0;
                var appliedPromotions = new List<object>();

                foreach (var item in cart.Items)
                {
                    try
                    {
                        // Use your existing promotion service method
                        var promotion = await _promotionService.GetProductPromotionAsync(item.ProductId);
                        if (promotion != null)
                        {
                            decimal discountPerItem = item.ProductPrice * (promotion.DiscountPercentage / 100m);
                            decimal itemDiscount = discountPerItem * item.Quantity;
                            totalPromotionDiscount += itemDiscount;

                            appliedPromotions.Add(new
                            {
                                id = promotion.Id,
                                name = promotion.Name,
                                description = promotion.Description,
                                discountPercentage = promotion.DiscountPercentage,
                                type = promotion.Type.ToString(),
                                appliedDiscount = itemDiscount,
                                productId = item.ProductId,
                                productName = item.ProductName
                            });

                            _logger.LogInformation("[{RequestId}] Applied promotion '{PromotionName}' to {ProductName}: ${DiscountAmount}",
                                requestId, promotion.Name, item.ProductName, itemDiscount);
                        }
                    }
                    catch (KeyNotFoundException)
                    {
                        // No promotion for this product, continue
                        _logger.LogDebug("[{RequestId}] No promotion found for product {ProductId}", requestId, item.ProductId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "[{RequestId}] Error checking promotion for product {ProductId}", requestId, item.ProductId);
                    }
                }

                _logger.LogInformation("[{RequestId}] Total promotion discount calculated: ${TotalDiscount} from {PromotionCount} promotions",
                    requestId, totalPromotionDiscount, appliedPromotions.Count);

                return Ok(new
                {
                    promotionDiscount = totalPromotionDiscount,
                    appliedPromotions = appliedPromotions,
                    cartItemCount = cart.Items.Count,
                    originalSubtotal = cart.Subtotal,
                    calculatedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[{RequestId}] Error calculating cart promotions", requestId);
                return StatusCode(500, new
                {
                    error = "Error calculating promotions",
                    message = ex.Message,
                    promotionDiscount = 0,
                    appliedPromotions = new List<object>()
                });
            }
        }

        // Enhanced SimpleCheckout method that includes promotion details
        [HttpPost("simple")]
        public async Task<ActionResult<Order>> SimpleCheckout([FromBody] object rawData)
        {
            string requestId = Guid.NewGuid().ToString().Substring(0, 8);

            try
            {
                _logger.LogInformation("[{RequestId}] Starting checkout process with promotion integration", requestId);

                // Get current user ID first
                string userId = GetCurrentUserId();
                bool isGuest = userId.StartsWith("guest-");
                _logger.LogInformation("[{RequestId}] User ID for checkout: {UserId} (Guest: {IsGuest})",
                            requestId, userId, isGuest);

                // Verify cart has items before proceeding
                CartDto cart;
                if (_cartPatchService != null)
                {
                    cart = await _cartPatchService.EnsureValidCartAsync(userId);
                    if (cart.Items.Count == 0)
                    {
                        _logger.LogWarning("[{RequestId}] Checkout attempted with empty cart for user {UserId}", requestId, userId);
                        return BadRequest("Cannot create order from empty cart. Please add items to your cart first.");
                    }
                }
                else
                {
                    cart = await _cartService.GetCartAsync(userId);
                    if (cart == null || cart.Items == null || cart.Items.Count == 0)
                    {
                        _logger.LogWarning("[{RequestId}] Checkout attempted with empty cart for user {UserId}", requestId, userId);
                        return BadRequest("Cannot create order from empty cart. Please add items to your cart first.");
                    }
                }

                _logger.LogInformation("[{RequestId}] Cart found with {ItemCount} items, total: {Total}",
                    requestId, cart.ItemCount, cart.Total);

                // ADD DETAILED CART LOGGING
                _logger.LogInformation("[{RequestId}] === DETAILED CART CONTENTS ===", requestId);
                foreach (var item in cart.Items)
                {
                    _logger.LogInformation("[{RequestId}] Product: {ProductName} (ID: {ProductId}) | Price: ${Price} | Qty: {Quantity} | LineTotal: ${LineTotal}",
                        requestId, item.ProductName, item.ProductId, item.ProductPrice, item.Quantity, item.LineTotal);
                }
                _logger.LogInformation("[{RequestId}] === END CART CONTENTS ===", requestId);

                // ✅ CONVERT RAW DATA TO DTO FIRST (BEFORE using checkoutDto)
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var json = JsonSerializer.Serialize(rawData);
                var checkoutDto = JsonSerializer.Deserialize<CheckoutDto>(json, options);

                if (checkoutDto == null)
                {
                    _logger.LogWarning("[{RequestId}] Invalid checkout data received", requestId);
                    return BadRequest("Invalid checkout data");
                }

                // Calculate promotions for the order
                decimal totalPromotionDiscount = 0;
                var appliedPromotions = new List<object>();
                var promotionSummary = new StringBuilder();

                _logger.LogInformation("[{RequestId}] === STARTING PROMOTION CALCULATION ===", requestId);
                foreach (var item in cart.Items)
                {
                    try
                    {
                        _logger.LogInformation("[{RequestId}] Checking promotion for: {ProductName} (ID: {ProductId})",
                            requestId, item.ProductName, item.ProductId);

                        var promotion = await _promotionService.GetProductPromotionAsync(item.ProductId);
                        if (promotion != null)
                        {
                            decimal discountPerItem = item.ProductPrice * (promotion.DiscountPercentage / 100m);
                            decimal itemDiscount = discountPerItem * item.Quantity;
                            totalPromotionDiscount += itemDiscount;

                            appliedPromotions.Add(new
                            {
                                name = promotion.Name,
                                discountPercentage = promotion.DiscountPercentage,
                                discountAmount = itemDiscount,
                                productName = item.ProductName
                            });

                            _logger.LogInformation("[{RequestId}] ✅ PROMOTION APPLIED: '{PromotionName}' | Product: {ProductName} | {DiscountPercent}% off ${ItemPrice} x {Qty} = ${DiscountAmount}",
                                requestId, promotion.Name, item.ProductName, promotion.DiscountPercentage, item.ProductPrice, item.Quantity, itemDiscount);
                        }
                        else
                        {
                            _logger.LogInformation("[{RequestId}] ❌ NO PROMOTION for {ProductName} (ID: {ProductId})",
                                requestId, item.ProductName, item.ProductId);
                        }
                    }
                    catch (KeyNotFoundException)
                    {
                        _logger.LogInformation("[{RequestId}] ❌ KeyNotFoundException - No promotion for product {ProductId}", requestId, item.ProductId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "[{RequestId}] ❌ ERROR checking promotion for product {ProductId}: {ErrorMessage}", requestId, item.ProductId, ex.Message);
                    }
                }
                _logger.LogInformation("[{RequestId}] === TOTAL PROMOTION DISCOUNT: ${TotalDiscount} ===", requestId, totalPromotionDiscount);

                // ✅ HANDLE COUPON DISCOUNT (NOW checkoutDto is available)
                decimal couponDiscount = 0;
                string appliedCouponCode = null;

                if (!string.IsNullOrEmpty(checkoutDto.CouponCode) && _couponService != null)
                {
                    try
                    {
                        _logger.LogInformation("[{RequestId}] Processing coupon: {CouponCode}", requestId, checkoutDto.CouponCode);

                        // 🔧 FIX: Use original subtotal for coupon validation (not after promotions)
                        // This matches your updated frontend logic
                        var validateCouponDto = new ValidateCouponDto
                        {
                            Code = checkoutDto.CouponCode.Trim().ToUpper(),
                            OrderAmount = cart.Subtotal, // Use original subtotal
                            PromotionDiscount = totalPromotionDiscount // Pass promotion context
                        };

                        var couponValidation = await _couponService.ValidateCouponAsync(validateCouponDto);

                        if (couponValidation.IsValid)
                        {
                            couponDiscount = couponValidation.DiscountAmount;
                            appliedCouponCode = checkoutDto.CouponCode.Trim().ToUpper();

                            _logger.LogInformation("[{RequestId}] ✅ COUPON APPLIED: {CouponCode} = ${CouponDiscount}",
                                requestId, appliedCouponCode, couponDiscount);

                            // Increment usage count for the coupon
                            try
                            {
                                await _couponService.IncrementUsageAsync(appliedCouponCode);
                                _logger.LogInformation("[{RequestId}] Incremented usage count for coupon {CouponCode}",
                                    requestId, appliedCouponCode);
                            }
                            catch (Exception usageEx)
                            {
                                _logger.LogWarning(usageEx, "[{RequestId}] Failed to increment usage for coupon {CouponCode}",
                                    requestId, appliedCouponCode);
                                // Don't fail the order if usage increment fails
                            }
                        }
                        else
                        {
                            _logger.LogWarning("[{RequestId}] ❌ INVALID COUPON: {CouponCode} - {Message}",
                                requestId, checkoutDto.CouponCode, couponValidation.Message);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "[{RequestId}] Error validating coupon {CouponCode}", requestId, checkoutDto.CouponCode);
                    }
                }
                else if (!string.IsNullOrEmpty(checkoutDto.CouponCode))
                {
                    _logger.LogWarning("[{RequestId}] Coupon service not available for coupon {CouponCode}", requestId, checkoutDto.CouponCode);
                }

                // ✅ LOG COUPON DISCOUNT DETAILS
                _logger.LogInformation("[{RequestId}] === COUPON CALCULATION RESULTS ===", requestId);
                _logger.LogInformation("[{RequestId}] Coupon Code: {CouponCode}", requestId, appliedCouponCode ?? "None");
                _logger.LogInformation("[{RequestId}] Coupon Discount: ${CouponDiscount}", requestId, couponDiscount);

                // ✅ CALCULATE EXPECTED TOTALS (Updated to match frontend exactly)
                decimal expectedSubtotal = cart.Subtotal;
                decimal expectedTax = cart.Tax > 0 ? cart.Tax : (expectedSubtotal * 0.08m);
                decimal expectedShipping = 0; // Always free shipping
                decimal expectedTotal = Math.Max(0, expectedSubtotal + expectedTax + expectedShipping - totalPromotionDiscount - couponDiscount);

                _logger.LogInformation("[{RequestId}] === EXPECTED TOTALS (CORRECTED) ===", requestId);
                _logger.LogInformation("[{RequestId}] Subtotal: ${Subtotal}", requestId, expectedSubtotal);
                _logger.LogInformation("[{RequestId}] Tax: ${Tax}", requestId, expectedTax);
                _logger.LogInformation("[{RequestId}] Shipping: ${Shipping} (FREE)", requestId, expectedShipping);
                _logger.LogInformation("[{RequestId}] Promotion Discount: ${PromotionDiscount}", requestId, totalPromotionDiscount);
                _logger.LogInformation("[{RequestId}] Coupon Discount: ${CouponDiscount}", requestId, couponDiscount);
                _logger.LogInformation("[{RequestId}] Expected Final Total: ${ExpectedTotal}", requestId, expectedTotal);

                // Handle saved address logic (your existing code)
                if (checkoutDto.SavedAddressId.HasValue)
                {
                    try
                    {
                        var address = await _addressService.GetAddressByIdAsync(checkoutDto.SavedAddressId.Value);
                        if (address.UserId != userId.Replace("guest-", ""))
                        {
                            return BadRequest("The selected address does not belong to your account");
                        }
                        checkoutDto.ShippingAddress = address;
                        await _addressService.UpdateAddressUsageAsync(address.Id);
                    }
                    catch (KeyNotFoundException)
                    {
                        return BadRequest("The selected address was not found");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error retrieving saved address {AddressId}", checkoutDto.SavedAddressId.Value);
                    }
                }

                // Validate shipping address (your existing validation)
                if (checkoutDto.ShippingAddress == null)
                {
                    return BadRequest("A valid shipping address is required");
                }

                if (string.IsNullOrEmpty(checkoutDto.ShippingAddress.FullName) ||
                    string.IsNullOrEmpty(checkoutDto.ShippingAddress.AddressLine1) ||
                    string.IsNullOrEmpty(checkoutDto.ShippingAddress.City) ||
                    string.IsNullOrEmpty(checkoutDto.ShippingAddress.ZipCode) ||
                    string.IsNullOrEmpty(checkoutDto.ShippingAddress.Country))
                {
                    return BadRequest("Required address fields are missing");
                }

                // Set default values
                checkoutDto.OrderNotes ??= "";
                checkoutDto.CouponCode ??= "";
                checkoutDto.ShippingAddress.AddressLine2 ??= "";

                // ✅ ADD COMPREHENSIVE DISCOUNT DETAILS TO ORDER NOTES
                var discountSummary = new StringBuilder();
                bool hasDiscounts = false;

                if (totalPromotionDiscount > 0)
                {
                    discountSummary.AppendLine("🎉 PROMOTIONS APPLIED:");
                    foreach (var promo in appliedPromotions)
                    {
                        var promotion = (dynamic)promo;
                        discountSummary.AppendLine($"• {promotion.name} ({promotion.discountPercentage}% off) = -${promotion.discountAmount:F2}");
                    }
                    discountSummary.AppendLine($"💰 TOTAL PROMOTION SAVINGS: ${totalPromotionDiscount:F2}");
                    hasDiscounts = true;
                }

                if (couponDiscount > 0 && !string.IsNullOrEmpty(appliedCouponCode))
                {
                    if (hasDiscounts) discountSummary.AppendLine();
                    discountSummary.AppendLine("🎫 COUPON APPLIED:");
                    discountSummary.AppendLine($"• {appliedCouponCode} = -${couponDiscount:F2}");
                    hasDiscounts = true;
                }

                if (hasDiscounts)
                {
                    discountSummary.AppendLine();
                    discountSummary.AppendLine($"🏷️ TOTAL SAVINGS: ${totalPromotionDiscount + couponDiscount:F2}");
                    discountSummary.AppendLine($"💸 FINAL TOTAL: ${expectedTotal:F2}");

                    // Append to existing order notes
                    string existingNotes = checkoutDto.OrderNotes ?? "";
                    checkoutDto.OrderNotes = string.IsNullOrEmpty(existingNotes)
                        ? discountSummary.ToString()
                        : $"{existingNotes}\n\n{discountSummary}";

                    _logger.LogInformation("[{RequestId}] Added discount details to order notes: Promotion=${PromotionSavings}, Coupon=${CouponSavings}",
                        requestId, totalPromotionDiscount, couponDiscount);
                }

                // Handle customer email (your existing logic)
                if (PropertyExists(checkoutDto, "CustomerEmail"))
                {
                    var emailProp = checkoutDto.GetType().GetProperty("CustomerEmail");
                    if (emailProp != null && emailProp.GetValue(checkoutDto) == null)
                    {
                        string email = null;
                        var shipEmailProp = checkoutDto.ShippingAddress.GetType().GetProperty("Email");
                        if (shipEmailProp != null)
                        {
                            email = shipEmailProp.GetValue(checkoutDto.ShippingAddress) as string;
                        }
                        email ??= "customer@example.com";
                        emailProp.SetValue(checkoutDto, email);
                    }
                }

                // Create order
                Order order;
                try
                {
                    if (typeof(OrderServiceExtensions).GetMethod("SafeCreateOrderAsync") != null)
                    {
                        order = await _orderService.SafeCreateOrderAsync(_cartService, userId, checkoutDto, _logger);
                    }
                    else
                    {
                        order = await _orderService.CreateOrderFromCartAsync(userId, checkoutDto);
                    }

                    // ✅ OVERRIDE ORDER TOTAL WITH CALCULATED VALUE
                    decimal originalOrderTotal = order.TotalAmount;
                    order.TotalAmount = expectedTotal;

                    _logger.LogInformation("[{RequestId}] Order created successfully: OrderId={OrderId}", requestId, order.Id);
                    _logger.LogInformation("[{RequestId}] Order totals: Original=${OriginalTotal}, Calculated=${CalculatedTotal}",
                        requestId, originalOrderTotal, expectedTotal);
                    _logger.LogInformation("[{RequestId}] Discounts applied: Promotions=${PromotionSavings}, Coupon=${CouponSavings}",
                        requestId, totalPromotionDiscount, couponDiscount);
                }
                catch (InvalidOperationException ex) when (ex.Message.Contains("empty cart"))
                {
                    _logger.LogError(ex, "[{RequestId}] Order service reports empty cart despite validation", requestId);
                    return BadRequest("Your cart appears to have been emptied. Please check your cart and try again.");
                }

                // Save address if requested (your existing logic)
                if (checkoutDto.SaveAddress && checkoutDto.ShippingAddress != null)
                {
                    try
                    {
                        if (isGuest)
                        {
                            await _addressService.SaveGuestAddressAsync(userId, checkoutDto.ShippingAddress);
                        }
                        else
                        {
                            await _addressService.SaveAddressAsync(userId, checkoutDto.ShippingAddress);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error saving address during checkout for user {UserId}", userId);
                    }
                }

                // ✅ Generate enhanced receipt with ALL discount data
                var receipt = await GenerateEnhancedReceiptAsync(
                    order.Id, 
                    totalPromotionDiscount,
                    appliedPromotions,
                    couponDiscount,
                    appliedCouponCode
                    );

                await SendOrderConfirmationEmail(order, receipt);

                return CreatedAtAction(nameof(GetReceipt), new { id = order.Id }, order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[{RequestId}] Checkout failed with exception: {ExceptionMessage}", requestId, ex.Message);
                return StatusCode(500, $"Checkout failed: {ex.Message}");
            }
        }


        // Helper method to check if a property exists on an object
        private bool PropertyExists(object obj, string propertyName)
        {
            return obj.GetType().GetProperty(propertyName) != null;
        }

        [HttpPost("set-guest-id")]
        public ActionResult SetGuestId([FromBody] string guestId)
        {
            if (string.IsNullOrEmpty(guestId))
            {
                return BadRequest("Guest ID cannot be empty");
            }

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(1),
                IsEssential = true,
                SameSite = SameSiteMode.Lax
            };

            Response.Cookies.Append("GuestId", guestId, cookieOptions);

            return Ok(new { message = $"Guest ID set to: {guestId}", guestId = "guest-" + guestId });
        }

        [HttpGet("debug")]
        public async Task<ActionResult> DebugCheckout()
        {
            try
            {
                var userId = GetCurrentUserId();

                // Check cart with proper error handling
                CartDto cart = null;
                string cartError = null;
                try
                {
                    cart = await _cartService.GetCartAsync(userId);
                }
                catch (Exception ex)
                {
                    cartError = ex.Message;
                    _logger.LogError(ex, "Error retrieving cart during debug for user {UserId}", userId);
                }

                // Check if cart or cart.Items is null
                string cartStatus = null;
                if (cart == null)
                {
                    cartStatus = "Cart is null";
                }
                else if (cart.Items == null)
                {
                    cartStatus = "Cart.Items is null";
                }
                else if (cart.Items.Count == 0)
                {
                    cartStatus = "Cart is empty (0 items)";
                }
                else
                {
                    cartStatus = $"Cart is valid with {cart.Items.Count} items";
                }

                // Collect all cookies
                var cookies = new Dictionary<string, string>();
                foreach (var cookie in Request.Cookies)
                {
                    cookies.Add(cookie.Key, cookie.Value);
                }

                var authStatus = User.Identity?.IsAuthenticated ?? false;
                var userClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();

                // Try different user ID formats to see if cart exists
                CartDto alternativeCart = null;
                string alternativeUserId = null;

                if (userId.StartsWith("guest-"))
                {
                    // Try without prefix
                    alternativeUserId = userId.Substring(6);
                }
                else
                {
                    // Try with prefix
                    alternativeUserId = "guest-" + userId;
                }

                try
                {
                    alternativeCart = await _cartService.GetCartAsync(alternativeUserId);
                }
                catch
                {
                    // Ignore errors for alternative cart check
                }

                // Get server information for troubleshooting
                var serverInfo = new Dictionary<string, string>
                {
                    { "Time", DateTime.UtcNow.ToString("o") },
                    { "Machine", Environment.MachineName },
                    { "OS", Environment.OSVersion.ToString() }
                };

                return Ok(new
                {
                    UserId = userId,
                    IsAuthenticated = authStatus,
                    CartStatus = cartStatus,
                    Cart = cart,
                    CartError = cartError,
                    AlternativeUserId = alternativeUserId,
                    AlternativeCart = alternativeCart,
                    Cookies = cookies,
                    Claims = userClaims,
                    ServerInfo = serverInfo,
                    Headers = Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString())
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Debug failed: {ex.Message}");
            }
        }

        [HttpGet("verify-cart")]
        public async Task<ActionResult> VerifyCart()
        {
            string userId = GetCurrentUserId();

            try
            {
                var cart = await _cartService.GetCartAsync(userId);

                if (cart == null)
                {
                    return NotFound(new
                    {
                        UserId = userId,
                        CartStatus = "Not Found",
                        Message = "No cart was found for this user ID."
                    });
                }

                if (cart.Items == null)
                {
                    return Ok(new
                    {
                        UserId = userId,
                        CartStatus = "Invalid",
                        Message = "Cart exists but Items collection is null."
                    });
                }

                if (cart.Items.Count == 0)
                {
                    return Ok(new
                    {
                        UserId = userId,
                        CartStatus = "Empty",
                        Message = "Your cart exists but contains no items."
                    });
                }

                return Ok(new
                {
                    UserId = userId,
                    CartStatus = "Valid",
                    ItemCount = cart.Items.Count,
                    Total = cart.Total,
                    Items = cart.Items
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    UserId = userId,
                    CartStatus = "Error",
                    Error = ex.Message
                });
            }
        }

        // Add a test endpoint for easily adding items to cart
        [HttpGet("test-add-to-cart")]
        public async Task<ActionResult> TestAddToCart(int productId = 1, int quantity = 1)
        {
            string userId = GetCurrentUserId();

            try
            {
                // Create a basic AddToCartDto
                var addToCartDto = new AddToCartDto
                {
                    ProductId = productId,
                    Quantity = quantity,
                    IsGiftWrapped = false,
                    GiftMessage = ""
                };

                // Try adding to cart
                var cart = await _cartService.AddToCartAsync(userId, addToCartDto);

                return Ok(new
                {
                    UserId = userId,
                    Action = "Add to cart",
                    Result = "Success",
                    CartStatus = cart.Items?.Count > 0 ? "Has items" : "Empty",
                    ItemCount = cart.Items?.Count ?? 0,
                    Total = cart.Total
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    UserId = userId,
                    Action = "Add to cart",
                    Result = "Failed",
                    Error = ex.Message
                });
            }
        }

        [HttpGet("receipt/{id}")]
        public async Task<ActionResult<ReceiptDto>> GetReceipt(int id)
        {
            try
            {
                var receipt = await _orderService.GenerateReceiptAsync(id);
                return Ok(receipt);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error generating receipt: {ex.Message}");
            }
        }

        [HttpGet("receipt/{id}/html")]
        public async Task<ActionResult> GetReceiptHtml(int id)
        {
            try
            {
                var receipt = await _orderService.GenerateReceiptAsync(id);
                string html = GenerateReceiptHtml(receipt);
                return Content(html, "text/html");
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error generating receipt: {ex.Message}");
            }
        }

        [HttpGet("order-ids")]
        public async Task<ActionResult> GetOrderIds()
        {
            try
            {
                var orderIds = await _orderService.GetOrderIds();
                return Ok(orderIds);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving order IDs: {ex.Message}");
            }
        }

        [HttpPost("orders/{id}/cancel")]
        public async Task<ActionResult<Order>> CancelOrder(int id)
        {
            try
            {
                string userId = GetCurrentUserId();

                // Check if the order belongs to the current user
                var order = await _orderService.GetOrderByIdAsync(id);
                if (order.UserId != userId)
                {
                    return Forbid("You do not have permission to cancel this order");
                }

                // Check if the order can be cancelled
                if (order.Status != "Pending" && order.Status != "Processing")
                {
                    return BadRequest("This order cannot be cancelled because it has already been shipped or delivered");
                }

                var updatedOrder = await _orderService.UpdateOrderStatusAsync(id, "Cancelled");
                return Ok(updatedOrder);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error cancelling order: {ex.Message}");
            }
        }

        [HttpGet("orders")]
        public async Task<ActionResult> GetOrders(string guestId = null)
        {
            try
            {
                string userId;

                // If a specific guestId is provided, use it to look up orders
                if (!string.IsNullOrEmpty(guestId))
                {
                    // Handle if guestId already includes "guest-" prefix
                    userId = guestId.StartsWith("guest-") ? guestId : "guest-" + guestId;
                }
                else
                {
                    // Otherwise use the current user ID from cookies/auth
                    userId = GetCurrentUserId();
                }

                var orders = await _orderService.GetUserOrdersAsync(userId);

                // If no orders found for current user, show available guest IDs
                if (orders.Count == 0 && string.IsNullOrEmpty(guestId))
                {
                    var guestOrderIds = await _orderService.GetGuestIdsWithOrderCounts();
                    return Ok(new
                    {
                        Message = "No orders found for this session. If you've placed orders before, they might be associated with a different browser session.",
                        AvailableGuestIds = guestOrderIds,
                        HowToView = "To view orders for a specific guest ID, use: GET /api/Checkout/orders?guestId=YOUR_GUEST_ID",
                        Orders = orders
                    });
                }

                return Ok(orders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving orders: {ex.Message}");
            }
        }

        [HttpGet("find")]
        public async Task<ActionResult<Order>> FindOrder(string orderNumber)
        {
            try
            {
                var order = await _orderService.FindOrderByNumberAsync(orderNumber);
                if (order == null)
                {
                    return NotFound($"Order {orderNumber} not found");
                }
                return Ok(order);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error finding order: {ex.Message}");
            }
        }

        [HttpGet("orders/{id}")]
        public async Task<ActionResult<Order>> GetOrder(int id)
        {
            try
            {
                var order = await _orderService.GetOrderByIdAsync(id);
                return Ok(order);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving order: {ex.Message}");
            }
        }

        [HttpPut("orders/{id}/status")]
        public async Task<ActionResult<Order>> UpdateOrderStatus(int id, [FromBody] string status)
        {
            try
            {
                var order = await _orderService.UpdateOrderStatusAsync(id, status);
                return Ok(order);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating order status: {ex.Message}");
            }
        }

        [HttpGet("test-auth")]
        [Authorize] // This requires authentication
        public ActionResult TestAuth()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var isAuth = User.Identity?.IsAuthenticated ?? false;

            return Ok(new
            {
                IsAuthenticated = isAuth,
                UserId = userId,
                Email = email,
                AllClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList(),
                JwtDebug = new
                {
                    HasAuthHeader = Request.Headers.ContainsKey("Authorization"),
                    AuthHeader = Request.Headers["Authorization"].ToString()
                }
            });
        }

        [HttpGet("debug-totals")]
        public async Task<ActionResult> DebugTotals()
        {
            try
            {
                var userId = GetCurrentUserId();
                var cart = await _cartService.GetCartAsync(userId);

                if (cart == null)
                    return NotFound("No cart found");

                // Calculate promotion discounts
                decimal promotionDiscount = 0;
                var promotionDetails = new List<object>();

                foreach (var item in cart.Items)
                {
                    try
                    {
                        var promotion = await _promotionService.GetProductPromotionAsync(item.ProductId);
                        if (promotion != null)
                        {
                            decimal itemDiscount = (item.ProductPrice * (promotion.DiscountPercentage / 100m)) * item.Quantity;
                            promotionDiscount += itemDiscount;
                            promotionDetails.Add(new
                            {
                                ProductName = item.ProductName,
                                DiscountPercentage = promotion.DiscountPercentage,
                                ItemDiscount = itemDiscount
                            });
                        }
                    }
                    catch { /* Ignore promotion errors for debugging */ }
                }

                // Calculate like frontend
                decimal subtotal = cart.Subtotal;
                decimal tax = cart.Tax > 0 ? cart.Tax : (subtotal * 0.08m);
                decimal shipping = 0; // Free
                decimal total = Math.Max(0, subtotal + tax + shipping - promotionDiscount);

                return Ok(new
                {
                    UserId = userId,
                    Frontend = new
                    {
                        subtotal,
                        tax,
                        shipping,
                        promotionDiscount,
                        total
                    },
                    Backend = new
                    {
                        CartSubtotal = cart.Subtotal,
                        CartTax = cart.Tax,
                        CartTotal = cart.Total
                    },
                    PromotionDetails = promotionDetails,
                    CartItems = cart.Items.Select(i => new {
                        i.ProductName,
                        i.ProductPrice,
                        i.Quantity,
                        i.LineTotal
                    })
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Debug failed: {ex.Message}");
            }
        }

        private string GetCurrentUserId()
        {
            // FIRST: Check for authenticated user
            if (User.Identity?.IsAuthenticated == true)
            {
                var authenticatedId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(authenticatedId))
                {
                    return authenticatedId; // Return authenticated user ID directly
                }
            }

            // ONLY if not authenticated, use guest logic
            string guestId = Request.Cookies["GuestId"];

            // Also check for X-Guest-Id header (sent by frontend)
            if (string.IsNullOrEmpty(guestId))
            {
                if (Request.Headers.TryGetValue("X-Guest-Id", out var headerGuestId))
                {
                    guestId = headerGuestId.FirstOrDefault();
                }
            }

            if (string.IsNullOrEmpty(guestId))
            {
                guestId = "guest-" + Guid.NewGuid().ToString("N")[..8];

                // Fixed cookie options for localhost development
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = false,    // Allow JavaScript access
                    Expires = DateTime.UtcNow.AddDays(30),
                    IsEssential = true,
                    SameSite = SameSiteMode.Lax,  // Changed from None
                    Secure = false,               // Changed from true for localhost
                    Path = "/"
                };

                Response.Cookies.Append("GuestId", guestId, cookieOptions);
            }

            // Ensure the guestId has the proper prefix
            return guestId.StartsWith("guest-") ? guestId : "guest-" + guestId;
        }

        private string GenerateReceiptHtml(ReceiptDto receipt)
        {
            var html = new StringBuilder();

            html.AppendLine("<!DOCTYPE html>");
            html.AppendLine("<html>");
            html.AppendLine("<head>");
            html.AppendLine("  <title>Order Receipt</title>");
            html.AppendLine("  <style>");
            html.AppendLine("    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f9f9f9; }");
            html.AppendLine("    .receipt { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }");
            html.AppendLine("    .header { text-align: center; border-bottom: 2px solid #5c4033; padding-bottom: 20px; margin-bottom: 20px; }");
            html.AppendLine("    .logo { font-size: 24px; font-weight: bold; color: #5c4033; }");
            html.AppendLine("    .details { display: flex; justify-content: space-between; margin-bottom: 20px; }");
            html.AppendLine("    .customer { flex: 1; }");
            html.AppendLine("    .order-info { flex: 1; text-align: right; }");
            html.AppendLine("    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }");
            html.AppendLine("    th { background-color: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }");
            html.AppendLine("    td { padding: 10px; border-bottom: 1px solid #eee; }");
            html.AppendLine("    .totals { text-align: right; }");
            html.AppendLine("    .total { font-size: 18px; font-weight: bold; background-color: #f0f8f0; padding: 10px; border-radius: 4px; margin-top: 10px; }");
            html.AppendLine("    .promotion-savings { color: #28a745; font-weight: bold; }");
            html.AppendLine("    .promotion-details { background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin: 15px 0; }");
            html.AppendLine("    .coupon-details { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 15px 0; }");
            html.AppendLine("    .free-shipping { color: #28a745; font-weight: bold; }");
            html.AppendLine("    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }");
            html.AppendLine("  </style>");
            html.AppendLine("</head>");
            html.AppendLine("<body>");

            html.AppendLine("  <div class=\"receipt\">");
            html.AppendLine("    <div class=\"header\">");
            html.AppendLine("      <div class=\"logo\">🍫 Chocolate Haven</div>");
            html.AppendLine("      <div>Premium Handcrafted Chocolates</div>");
            html.AppendLine("    </div>");

            html.AppendLine("    <div class=\"details\">");
            html.AppendLine("      <div class=\"customer\">");
            html.AppendLine("        <h3>📦 Shipping Details</h3>");
            html.AppendLine($"        <p><strong>Name:</strong> {receipt.CustomerName}</p>");
            html.AppendLine($"        <p><strong>Address:</strong> {receipt.ShippingAddressLine1}</p>");
            if (!string.IsNullOrEmpty(receipt.ShippingAddressLine2))
            {
                html.AppendLine($"        <p>{receipt.ShippingAddressLine2}</p>");
            }
            html.AppendLine($"        <p>{receipt.ShippingCity}, {receipt.ShippingState} {receipt.ShippingZipCode}</p>");
            html.AppendLine($"        <p>{receipt.ShippingCountry}</p>");
            html.AppendLine("      </div>");

            html.AppendLine("      <div class=\"order-info\">");
            html.AppendLine("        <h3>📋 Order Information</h3>");
            html.AppendLine($"        <p><strong>Order #:</strong> {receipt.OrderNumber}</p>");
            html.AppendLine($"        <p><strong>Date:</strong> {receipt.OrderDate.ToString("MMM dd, yyyy 'at' h:mm tt")}</p>");
            html.AppendLine($"        <p><strong>Status:</strong> <span style=\"color: #28a745; font-weight: bold;\">{receipt.OrderStatus}</span></p>");
            html.AppendLine($"        <p><strong>Est. Delivery:</strong> {receipt.EstimatedDelivery}</p>");
            html.AppendLine("      </div>");
            html.AppendLine("    </div>");

            // ✅ ENHANCED PROMOTION DISPLAY
            if (receipt.AppliedPromotions != null && receipt.AppliedPromotions.Any())
            {
                html.AppendLine("    <div class=\"promotion-details\">");
                html.AppendLine("      <h3>🎉 Applied Promotions</h3>");

                foreach (var promotion in receipt.AppliedPromotions)
                {
                    html.AppendLine($"      <p><strong>• {promotion.Name}</strong> ({promotion.DiscountPercentage}% off {promotion.ProductName})</p>");
                    html.AppendLine($"      <p style=\"margin-left: 20px; color: #28a745;\">Savings: <strong>${promotion.AppliedDiscount:F2}</strong></p>");
                }

                html.AppendLine($"      <p class=\"promotion-savings\" style=\"font-size: 16px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #c3e6cb;\">💰 TOTAL PROMOTION SAVINGS: ${receipt.PromotionDiscount:F2}</p>");
                html.AppendLine("    </div>");
            }

            // ✅ COUPON DISPLAY
            if (receipt.CouponDiscount > 0 && !string.IsNullOrEmpty(receipt.CouponCode))
            {
                html.AppendLine("    <div class=\"coupon-details\">");
                html.AppendLine("      <h3>🎫 Coupon Applied</h3>");
                html.AppendLine($"      <p><strong>Code:</strong> {receipt.CouponCode}</p>");
                html.AppendLine($"      <p style=\"color: #856404; font-weight: bold;\">Discount: ${receipt.CouponDiscount:F2}</p>");
                html.AppendLine("    </div>");
            }

            // Product table
            html.AppendLine("    <table>");
            html.AppendLine("      <thead>");
            html.AppendLine("        <tr>");
            html.AppendLine("          <th>Product</th>");
            html.AppendLine("          <th>Origin</th>");
            html.AppendLine("          <th>Cocoa %</th>");
            html.AppendLine("          <th>Price</th>");
            html.AppendLine("          <th>Qty</th>");
            html.AppendLine("          <th>Subtotal</th>");
            html.AppendLine("        </tr>");
            html.AppendLine("      </thead>");
            html.AppendLine("      <tbody>");

            foreach (var item in receipt.Items)
            {
                html.AppendLine("        <tr>");
                html.AppendLine($"          <td><strong>{item.ProductName}</strong></td>");
                html.AppendLine($"          <td>{item.Origin ?? "N/A"}</td>");
                html.AppendLine($"          <td>{item.CocoaPercentage ?? "N/A"}</td>");
                html.AppendLine($"          <td>${item.Price.ToString("0.00")}</td>");
                html.AppendLine($"          <td>{item.Quantity}</td>");
                html.AppendLine($"          <td><strong>${item.Subtotal.ToString("0.00")}</strong></td>");
                html.AppendLine("        </tr>");
            }

            html.AppendLine("      </tbody>");
            html.AppendLine("    </table>");

            // ✅ TOTALS SECTION (FIXED - no duplicates)
            html.AppendLine("    <div class=\"totals\">");
            html.AppendLine($"      <p><strong>Subtotal:</strong> ${receipt.Subtotal.ToString("0.00")}</p>");
            html.AppendLine("      <p><strong>Shipping:</strong> <span class=\"free-shipping\">FREE</span></p>");
            html.AppendLine($"      <p><strong>Tax:</strong> ${receipt.Tax.ToString("0.00")}</p>");

            // Show discounts
            if (receipt.PromotionDiscount > 0)
            {
                html.AppendLine($"      <p class=\"promotion-savings\"><strong>Promotion Savings:</strong> -${receipt.PromotionDiscount.ToString("0.00")}</p>");
            }

            if (receipt.CouponDiscount > 0)
            {
                html.AppendLine($"      <p class=\"promotion-savings\"><strong>Coupon Discount ({receipt.CouponCode}):</strong> -${receipt.CouponDiscount.ToString("0.00")}</p>");
            }

            // ✅ FINAL TOTAL WITH SAVINGS
            html.AppendLine("      <div class=\"total\">");
            html.AppendLine($"        <p style=\"margin: 0;\"><strong>Final Total: ${receipt.Total.ToString("0.00")}</strong></p>");
            if (receipt.PromotionDiscount > 0 || receipt.CouponDiscount > 0)
            {
                decimal totalSavings = receipt.PromotionDiscount + receipt.CouponDiscount;
                html.AppendLine($"        <p style=\"margin: 5px 0 0 0; font-size: 14px; color: #28a745;\">You saved ${totalSavings:F2}!</p>");
            }
            html.AppendLine("      </div>");

            html.AppendLine($"      <p style=\"margin-top: 15px;\"><strong>Payment Status:</strong> <span style=\"color: #28a745;\">{receipt.PaymentStatus}</span></p>");
            html.AppendLine("    </div>");

            // Order notes
            if (!string.IsNullOrEmpty(receipt.OrderNotes))
            {
                html.AppendLine("    <div class=\"notes\" style=\"background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;\">");
                html.AppendLine("      <h3>📝 Order Notes</h3>");
                var formattedNotes = receipt.OrderNotes.Replace("\n", "<br>");
                html.AppendLine($"      <p>{formattedNotes}</p>");
                html.AppendLine("    </div>");
            }

            // Footer
            html.AppendLine("    <div class=\"footer\">");
            html.AppendLine("      <p><strong>Thank you for your purchase!</strong></p>");
            html.AppendLine("      <p>Questions? Contact us at <a href=\"mailto:support@chocolatehaven.com\">support@chocolatehaven.com</a></p>");
            html.AppendLine("      <p style=\"margin-top: 15px; font-size: 12px; color: #999;\">This receipt was generated automatically. Please keep for your records.</p>");
            html.AppendLine("    </div>");

            html.AppendLine("  </div>");
            html.AppendLine("</body>");
            html.AppendLine("</html>");

            return html.ToString();
        }

        private async Task<ReceiptDto> GenerateEnhancedReceiptAsync(int orderId, decimal promotionDiscount = 0, List<object> appliedPromotions = null, decimal couponDiscount = 0, string couponCode = null)
        {
            try
            {
                // Get the base receipt from order service
                var receipt = await _orderService.GenerateReceiptAsync(orderId);

                // ✅ FORCE FREE SHIPPING (to match frontend)
                receipt.ShippingCost = 0;
                receipt.ShippingMethod = "FREE Standard Shipping";

                // ✅ ADD PROMOTION DATA
                if (promotionDiscount > 0 && appliedPromotions != null)
                {
                    receipt.PromotionDiscount = promotionDiscount;
                    receipt.AppliedPromotions = appliedPromotions.Select(p =>
                    {
                        var promotion = (dynamic)p;
                        return new AppliedPromotionDto
                        {
                            Name = promotion.name ?? "",
                            DiscountPercentage = promotion.discountPercentage ?? 0,
                            AppliedDiscount = promotion.discountAmount ?? 0,
                            ProductName = promotion.productName ?? ""
                        };
                    }).ToList();
                }

                // ✅ ADD COUPON DATA
                if (couponDiscount > 0)
                {
                    receipt.CouponDiscount = couponDiscount;
                    receipt.CouponCode = couponCode ?? "";
                    // Also set the legacy field for backward compatibility
                    receipt.DiscountAmount = couponDiscount;
                }

                // ✅ RECALCULATE TOTAL TO MATCH FRONTEND EXACTLY
                decimal calculatedTotal = receipt.Subtotal + receipt.Tax + receipt.ShippingCost - receipt.PromotionDiscount - receipt.CouponDiscount;
                receipt.Total = Math.Max(0, calculatedTotal);

                _logger.LogInformation("Enhanced receipt totals: Subtotal=${Subtotal}, Tax=${Tax}, Shipping=${Shipping}, PromotionDiscount=${PromotionDiscount}, CouponDiscount=${CouponDiscount}, FinalTotal=${Total}",
                    receipt.Subtotal, receipt.Tax, receipt.ShippingCost, receipt.PromotionDiscount, receipt.CouponDiscount, receipt.Total);

                return receipt;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating enhanced receipt for order {OrderId}", orderId);
                throw;
            }
        }
        
        private async Task SendOrderConfirmationEmail(Order order, ReceiptDto receipt)
        {
            string requestId = Guid.NewGuid().ToString("N").Substring(0, 8);
            _logger.LogInformation("[{RequestId}] Processing order confirmation email for order {OrderId}", requestId, order.Id);

            try
            {
                // Check if email service is available
                if (_emailService == null)
                {
                    _logger.LogWarning("[{RequestId}] Email service not configured, skipping confirmation for order {OrderId}",
                        requestId, order.Id);
                    return;
                }

                // Get a valid recipient email
                string recipientEmail = DetermineRecipientEmail(order, requestId);
                if (string.IsNullOrEmpty(recipientEmail))
                {
                    // Already logged in DetermineRecipientEmail
                    return;
                }

                // Prepare email
                string subject = FormatEmailSubject(order);
                string message = GenerateReceiptHtml(receipt);

                // Send with retry logic
                await SendWithRetryAsync(recipientEmail, subject, message, order.Id, requestId);

                _logger.LogInformation("[{RequestId}] Order confirmation email successfully processed for order {OrderId}",
                    requestId, order.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[{RequestId}] Failed to send confirmation email for order {OrderId}: {ErrorMessage}",
                    requestId, order.Id, ex.Message);

                // Important: Don't rethrow - we don't want the order creation to fail due to email issues
            }
        }

        private string DetermineRecipientEmail(Order order, string requestId)
        {
            // Try to get the customer email from the order
            string recipientEmail = order.CustomerEmail;

            if (string.IsNullOrEmpty(recipientEmail))
            {
                _logger.LogWarning("[{RequestId}] No customer email found for order {OrderId}", requestId, order.Id);

                // Fall back to something reasonable in development
            #if DEBUG
                recipientEmail = "test-order@example.com";
                _logger.LogInformation("[{RequestId}] Using test email address for order {OrderId}", requestId, order.Id);
                #else
        _logger.LogError("[{RequestId}] Cannot send email: no valid recipient for order {OrderId}", requestId, order.Id);
        return null;
            #endif
            }

            // Simple validation
            if (!IsValidEmailFormat(recipientEmail))
            {
                _logger.LogError("[{RequestId}] Invalid email format: '{Email}' for order {OrderId}",
                    requestId, recipientEmail, order.Id);
                return null;
            }

            return recipientEmail;
        }

        private bool IsValidEmailFormat(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            try
            {
                var mailAddress = new System.Net.Mail.MailAddress(email);
                return mailAddress.Address == email;
            }
            catch
            {
                return false;
            }
        }

        private string FormatEmailSubject(Order order)
        {
            return $"Your Chocolate Haven Order Confirmation - {order.OrderNumber}";
        }

        private async Task SendWithRetryAsync(string email, string subject, string message, int orderId, string requestId)
        {
            const int MaxRetries = 3;
            int attempt = 0;
            TimeSpan delay = TimeSpan.FromSeconds(1);

            while (true)
            {
                attempt++;

                try
                {
                    _logger.LogInformation("[{RequestId}] Sending email attempt {Attempt}/{MaxRetries} for order {OrderId}",
                        requestId, attempt, MaxRetries, orderId);

                    var stopwatch = Stopwatch.StartNew();
                    await _emailService.SendEmailAsync(email, subject, message);
                    stopwatch.Stop();

                    _logger.LogInformation("[{RequestId}] Email sent successfully in {ElapsedMs}ms (attempt {Attempt}) for order {OrderId}",
                        requestId, stopwatch.ElapsedMilliseconds, attempt, orderId);

                    // Success - exit the retry loop
                    return;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[{RequestId}] Email send attempt {Attempt}/{MaxRetries} failed for order {OrderId}: {ErrorMessage}",
                        requestId, attempt, MaxRetries, orderId, ex.Message);

                    // Check if we should retry
                    if (attempt >= MaxRetries)
                    {
                        _logger.LogError("[{RequestId}] Giving up after {Attempt} failed attempts to send email for order {OrderId}",
                            requestId, attempt, orderId);
                        throw; // Rethrow to be caught by outer handler
                    }

                    // Wait before retry with exponential backoff
                    await Task.Delay(delay);
                    delay = TimeSpan.FromMilliseconds(delay.TotalMilliseconds * 2); // Double the delay for each retry
                }
            }
        }

        // Add this method to your CheckoutController.cs

        [HttpPost("create-guest-session")]
        public ActionResult CreateGuestSession()
        {
            try
            {
                // Generate a unique guest ID
                var guestId = "guest-" + Guid.NewGuid().ToString("N")[..8] + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString()[..6];

                _logger.LogInformation("Creating new guest session: {GuestId}", guestId);

                // Set cookie with proper options for your environment
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = false, // Allow JavaScript access so frontend can read it
                    Expires = DateTime.UtcNow.AddDays(7), // 7 days
                    IsEssential = true,
                    SameSite = SameSiteMode.Lax, // Changed from None to Lax for localhost
                    Secure = false, // Set to false for localhost development
                    Path = "/"
                };

                Response.Cookies.Append("GuestId", guestId, cookieOptions);

                _logger.LogInformation("Guest session cookie set: {GuestId}", guestId);

                return Ok(new
                {
                    guestId = guestId,
                    message = "Guest session created successfully",
                    expires = cookieOptions.Expires
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating guest session");
                return StatusCode(500, new { error = "Failed to create guest session", message = ex.Message });
            }
        }

        // Add this method to your CheckoutController.cs for testing

        [HttpGet("debug-guest-session")]
        public async Task<ActionResult> DebugGuestSession()
        {
            try
            {
                var userId = GetCurrentUserId();
                var isAuthenticated = User.Identity?.IsAuthenticated ?? false;

                // Get all cookies
                var cookies = new Dictionary<string, string>();
                foreach (var cookie in Request.Cookies)
                {
                    cookies.Add(cookie.Key, cookie.Value);
                }

                // Get all headers
                var headers = new Dictionary<string, string>();
                foreach (var header in Request.Headers)
                {
                    headers.Add(header.Key, string.Join(", ", header.Value.ToArray()));
                }

                // Try to get the cart for this user/guest
                CartDto cart = null;
                string cartError = null;
                try
                {
                    cart = await _cartService.GetCartAsync(userId);
                }
                catch (Exception ex)
                {
                    cartError = ex.Message;
                }

                return Ok(new
                {
                    Timestamp = DateTime.UtcNow,
                    UserId = userId,
                    IsAuthenticated = isAuthenticated,
                    Cookies = cookies,
                    Headers = headers,
                    Cart = new
                    {
                        Exists = cart != null,
                        ItemCount = cart?.Items?.Count ?? 0,
                        Total = cart?.Total ?? 0,
                        Error = cartError
                    },
                    AuthInfo = new
                    {
                        HasAuthHeader = Request.Headers.ContainsKey("Authorization"),
                        HasGuestHeader = Request.Headers.ContainsKey("X-Guest-Id"),
                        UserClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList()
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message, StackTrace = ex.StackTrace });
            }
        }
    }
}