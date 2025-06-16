// Controllers/GuestReviewsController.cs
using ECommerce.API.DTOs;
using ECommerce.API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.API.Controllers
{
    [ApiController]
    [Route("api/guest/reviews")]
    [AllowAnonymous]
    public class GuestReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly ILogger<GuestReviewsController> _logger;

        public GuestReviewsController(
            IReviewService reviewService,
            ILogger<GuestReviewsController> logger)
        {
            _reviewService = reviewService;
            _logger = logger;
        }

        [HttpPost("products/{productId}")]
        public async Task<ActionResult<ReviewDto>> CreateGuestReview(int productId, [FromBody] CreateReviewDto dto)
        {
            try
            {
                // Get guest ID from cookie
                string guestId = GetGuestId();
                string guestName = "Guest User";

                // Check if guest has already reviewed the product
                if (await _reviewService.HasUserReviewedProductAsync(productId, guestId))
                {
                    return BadRequest("You have already reviewed this product");
                }

                // Check if guest has purchased the product
                if (!await _reviewService.HasUserPurchasedProductAsync(productId, guestId))
                {
                    return BadRequest("You can only review products you have purchased");
                }

                var review = await _reviewService.CreateReviewAsync(productId, guestId, guestName, dto);

                // For guest reviews, we might want to moderate them before they appear
                // So you could set IsApproved to false by default

                return CreatedAtAction("GetProductReview", "Reviews", new { productId, id = review.Id }, review);
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
                _logger.LogError(ex, "Error creating guest review for product {ProductId}", productId);
                return StatusCode(500, "An error occurred while creating the review");
            }
        }

        private string GetGuestId()
        {
            // Get guest ID from cookie
            if (Request.Cookies.TryGetValue("GuestId", out string guestId) && !string.IsNullOrEmpty(guestId))
            {
                return guestId.StartsWith("guest-") ? guestId : "guest-" + guestId;
            }

            // If no cookie exists, create a new guest ID
            guestId = Guid.NewGuid().ToString("N");

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
    }
}