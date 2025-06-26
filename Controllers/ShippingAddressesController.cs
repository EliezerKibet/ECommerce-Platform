using ECommerce.API.DTOs;
using ECommerce.API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ECommerce.API.Controllers
{
    // Controllers/ShippingAddressesController.cs
    //[Authorize]
    [ApiController]
    [Route("api/shipping-addresses")]
    public class ShippingAddressesController : ControllerBase
    {
        private readonly IShippingAddressService _addressService;
        private readonly ILogger<ShippingAddressesController> _logger;

        public ShippingAddressesController(
            IShippingAddressService addressService,
            ILogger<ShippingAddressesController> logger)
        {
            _addressService = addressService;
            _logger = logger;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<List<ShippingAddressDto>>> GetAddresses()
        {
            string userId = GetCurrentUserId();

            try
            {
                var addresses = await _addressService.GetUserAddressesAsync(userId);
                return Ok(addresses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shipping addresses for user {UserId}", userId);
                return StatusCode(500, "An error occurred while retrieving your addresses");
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ShippingAddressDto>> GetAddress(int id)
        {
            string userId = GetCurrentUserId();

            try
            {
                var address = await _addressService.GetAddressByIdAsync(id);

                // Security check
                if (address.UserId != userId)
                    return Forbid();

                return Ok(address);
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Address not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shipping address {AddressId} for user {UserId}", id, userId);
                return StatusCode(500, "An error occurred while retrieving the address");
            }
        }

        [HttpPost]
        [AllowAnonymous] // Allow both guest and authenticated users
        public async Task<ActionResult<ShippingAddressDto>> CreateAddress([FromBody] ShippingAddressDto addressDto)
        {
            string userId = GetCurrentUserId();
            bool isGuest = userId.StartsWith("guest-");

            try
            {
                ShippingAddressDto savedAddress;

                if (isGuest)
                {
                    savedAddress = await _addressService.SaveGuestAddressAsync(userId, addressDto);
                }
                else
                {
                    savedAddress = await _addressService.SaveAddressAsync(userId, addressDto);
                }

                return CreatedAtAction(nameof(GetAddress), new { id = savedAddress.Id }, savedAddress);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating shipping address for user {UserId}", userId);
                return StatusCode(500, "An error occurred while creating the address");
            }
        }

        // ADD THIS METHOD - Update/Edit Address
        [HttpPut("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ShippingAddressDto>> UpdateAddress(int id, [FromBody] ShippingAddressDto addressDto)
        {
            string userId = GetCurrentUserId();

            try
            {
                // First verify the address belongs to the current user
                var existingAddress = await _addressService.GetAddressByIdAsync(id);
                if (existingAddress.UserId != userId)
                {
                    return Forbid("You can only update your own addresses");
                }

                // Update the address
                var updatedAddress = await _addressService.UpdateAddressAsync(id, userId, addressDto);
                return Ok(updatedAddress);
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Address not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating shipping address {AddressId} for user {UserId}", id, userId);
                return StatusCode(500, "An error occurred while updating the address");
            }
        }

        [HttpPost("{id}/default")]
        [AllowAnonymous]
        public async Task<ActionResult<ShippingAddressDto>> SetDefaultAddress(int id)
        {
            string userId = GetCurrentUserId();

            try
            {
                var address = await _addressService.SetDefaultAddressAsync(userId, id);
                return Ok(address);
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Address not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting address {AddressId} as default for user {UserId}", id, userId);
                return StatusCode(500, "An error occurred while setting the default address");
            }
        }

        [HttpDelete("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> DeleteAddress(int id)
        {
            string userId = GetCurrentUserId();

            try
            {
                var result = await _addressService.DeleteAddressAsync(id, userId);

                if (!result)
                    return NotFound("Address not found");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting address {AddressId} for user {UserId}", id, userId);
                return StatusCode(500, "An error occurred while deleting the address");
            }
        }

        // Add the GetCurrentUserId method to handle both authenticated and guest users
        private string GetCurrentUserId()
        {
            // Log the authentication state for debugging
            _logger.LogInformation("Authentication check - IsAuthenticated: {IsAuthenticated}",
                User.Identity?.IsAuthenticated ?? false);

            // For authenticated users, ALWAYS use the user ID from claims
            if (User.Identity?.IsAuthenticated == true)
            {
                var id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(id))
                {
                    _logger.LogInformation("Using authenticated user ID: {UserId}", id);
                    return id; // Return the authenticated user ID
                }
            }

            // Only use guest ID if user is NOT authenticated
            if (Request.Cookies.TryGetValue("GuestId", out string guestId) && !string.IsNullOrEmpty(guestId))
            {
                _logger.LogInformation("Using guest ID: {GuestId}", guestId);
                // Check if the guestId already has the "guest-" prefix
                return guestId.StartsWith("guest-") ? guestId : "guest-" + guestId;
            }

            // If no cookie exists, create a new guest ID
            guestId = Guid.NewGuid().ToString("N");
            _logger.LogInformation("Created new guest ID: {GuestId}", guestId);

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(30),
                IsEssential = true,
                SameSite = SameSiteMode.Lax
            };

            Response.Cookies.Append("GuestId", guestId, cookieOptions);
            return "guest-" + guestId;
        }

        [HttpGet("debug")]
        [AllowAnonymous]
        public ActionResult DebugAddresses()
        {
            var userId = GetCurrentUserId();

            return Ok(new
            {
                UserId = userId,
                IsAuthenticated = User.Identity?.IsAuthenticated ?? false,
                Cookies = Request.Cookies.ToDictionary(c => c.Key, c => c.Value),
                Claims = User.Claims.ToDictionary(c => c.Type, c => c.Value)
            });
        }
    }
}