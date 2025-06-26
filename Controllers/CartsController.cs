// Controllers/CartsController.cs
using Azure.Core;
using ECommerce.API.DTOs;
using ECommerce.API.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ECommerce.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CartsController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartsController(ICartService cartService)
        {
            _cartService = cartService;
        }

        // Get current user's cart
        [HttpGet]
        public async Task<ActionResult<CartDto>> GetCart()
        {
            // For now, we'll use a hardcoded or guest user ID
            // Later, you'll get this from authentication
            string userId = GetCurrentUserId();

            try
            {
                var cart = await _cartService.GetCartAsync(userId);
                return Ok(cart);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // Add item to cart
        [HttpPost("items")]
        public async Task<ActionResult<CartDto>> AddToCart(AddToCartDto addToCartDto)
        {
            string userId = GetCurrentUserId();

            try
            {
                var cart = await _cartService.AddToCartAsync(userId, addToCartDto);
                return Ok(cart);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // Update cart item
        [HttpPut("items/{id}")]
        public async Task<ActionResult<CartDto>> UpdateCartItem(int id, UpdateCartItemDto updateCartItemDto)
        {
            string userId = GetCurrentUserId();

            try
            {
                var cart = await _cartService.UpdateCartItemAsync(userId, id, updateCartItemDto);
                return Ok(cart);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // Remove item from cart
        [HttpDelete("items/{id}")]
        public async Task<ActionResult<CartDto>> RemoveFromCart(int id)
        {
            string userId = GetCurrentUserId();

            try
            {
                var cart = await _cartService.RemoveFromCartAsync(userId, id);
                return Ok(cart);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // Clear cart
        [HttpDelete]
        public async Task<ActionResult<CartDto>> ClearCart()
        {
            string userId = GetCurrentUserId();

            try
            {
                var cart = await _cartService.ClearCartAsync(userId);
                return Ok(cart);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // Transfer guest cart to user cart (after login)
        [HttpPost("transfer")]
        public async Task<ActionResult> TransferCart(int guestCartId)
        {
            string userId = GetCurrentUserId();

            try
            {
                var result = await _cartService.TransferGuestCartAsync(guestCartId, userId);
                return Ok(new { Success = result });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }



        // Helper method to get the current user ID
        // Replace this with authentication when implemented
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
            if (string.IsNullOrEmpty(guestId))
            {
                guestId = "guest-" + Guid.NewGuid().ToString();
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Expires = DateTime.UtcNow.AddDays(30),
                    IsEssential = true,
                    SameSite = SameSiteMode.None, // Required for cross-origin
                    Secure = true                 // Required for SameSite=None
                };

                Response.Cookies.Append("GuestId", guestId, cookieOptions);
            }
            return guestId;
        }


        [HttpGet("test")]
        public async Task<ActionResult<string>> TestCartFunctionality()
        {
            try
            {
                // Get or create a test user ID
                string userId = "test-user-" + Guid.NewGuid().ToString().Substring(0, 8);

                // Step 1: Create a new cart
                var newCart = await _cartService.CreateCartAsync(userId);

                // Step 2: Add a chocolate product to the cart (use an existing product ID)
                var productId = 1; // Replace with an actual product ID from your database
                var addToCartDto = new AddToCartDto
                {
                    ProductId = productId,
                    Quantity = 2,
                    IsGiftWrapped = true,
                    GiftMessage = "Test gift message"
                };

                var cartWithItem = await _cartService.AddToCartAsync(userId, addToCartDto);

                // Step 3: Update the cart item
                var cartItemId = cartWithItem.Items.First().Id;
                var updateCartItemDto = new UpdateCartItemDto
                {
                    Quantity = 3,
                    IsGiftWrapped = true,
                    GiftMessage = "Updated gift message"
                };

                var updatedCart = await _cartService.UpdateCartItemAsync(userId, cartItemId, updateCartItemDto);

                // Step 4: Remove the item from the cart
                var emptyCart = await _cartService.RemoveFromCartAsync(userId, cartItemId);

                return Ok($"Cart test successful! Created cart ID: {newCart.Id}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Cart test failed: {ex.Message}\n{ex.StackTrace}");
            }
        }
    }
}