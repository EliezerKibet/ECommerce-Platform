// Controllers/ReviewsController.cs - Only Authenticated Users Can Review
using ECommerce.API.DTOs;
using ECommerce.API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ECommerce.API.Controllers
{
    [ApiController]
    [Route("api/products/{productId}/reviews")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly ILogger<ReviewsController> _logger;

        public ReviewsController(
            IReviewService reviewService,
            ILogger<ReviewsController> logger)
        {
            _reviewService = reviewService;
            _logger = logger;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<List<ReviewDto>>> GetProductReviews(int productId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var reviews = await _reviewService.GetProductReviewsAsync(productId, page, pageSize);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving reviews for product {ProductId}", productId);
                return StatusCode(500, "An error occurred while retrieving reviews");
            }
        }

        [HttpGet("summary")]
        [AllowAnonymous]
        public async Task<ActionResult<ProductRatingsSummaryDto>> GetProductRatingsSummary(int productId)
        {
            try
            {
                var summary = await _reviewService.GetProductRatingsSummaryAsync(productId);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving ratings summary for product {ProductId}", productId);
                return StatusCode(500, "An error occurred while retrieving ratings summary");
            }
        }

        [HttpPost]
        [Authorize] // CHANGED: Only authenticated users can create reviews
        public async Task<ActionResult<ReviewDto>> CreateReview(int productId, [FromBody] CreateReviewDto dto)
        {
            try
            {
                // Get userId from authenticated user claims ONLY
                string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                string userName = User.FindFirstValue(ClaimTypes.Name) ?? "User";

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("You must be logged in to submit a review");
                }

                _logger.LogInformation("Authenticated user {UserId} attempting to create review for product {ProductId}", userId, productId);

                // Check if user has already reviewed the product
                if (await _reviewService.HasUserReviewedProductAsync(productId, userId))
                {
                    return BadRequest("You have already reviewed this product");
                }

                // BYPASS PURCHASE CHECK FOR DEMO - Uncomment the lines below for production
                /*
                if (!await _reviewService.HasUserPurchasedProductAsync(productId, userId))
                {
                    return BadRequest("You can only review products you have purchased");
                }
                */

                var review = await _reviewService.CreateReviewAsync(productId, userId, userName, dto);
                return CreatedAtAction(nameof(GetReview), new { productId, id = review.Id }, review);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating review for product {ProductId}", productId);
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ReviewDto>> GetReview(int productId, int id)
        {
            try
            {
                var review = await _reviewService.GetReviewByIdAsync(id);

                if (review.ProductId != productId)
                {
                    return BadRequest("The review does not belong to the specified product");
                }

                return Ok(review);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving review {ReviewId}", id);
                return StatusCode(500, "An error occurred while retrieving the review");
            }
        }

        [HttpPut("{id}")]
        [Authorize] // CHANGED: Only authenticated users can update reviews
        public async Task<ActionResult<ReviewDto>> UpdateReview(int productId, int id, [FromBody] UpdateReviewDto dto)
        {
            try
            {
                // Get userId from authenticated user claims ONLY
                string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("You must be logged in to update a review");
                }

                _logger.LogInformation("Authenticated user {UserId} attempting to update review {ReviewId}", userId, id);

                var review = await _reviewService.UpdateReviewAsync(id, userId, dto);

                if (review.ProductId != productId)
                {
                    return BadRequest("The review does not belong to the specified product");
                }

                return Ok(review);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating review {ReviewId}", id);
                return StatusCode(500, "An error occurred while updating the review");
            }
        }

        [HttpDelete("{id}")]
        [Authorize] // CHANGED: Only authenticated users can delete reviews
        public async Task<ActionResult> DeleteReview(int productId, int id)
        {
            try
            {
                // Get userId from authenticated user claims ONLY
                string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("You must be logged in to delete a review");
                }

                _logger.LogInformation("Authenticated user {UserId} attempting to delete review {ReviewId}", userId, id);

                var result = await _reviewService.DeleteReviewAsync(id, userId);

                if (!result)
                {
                    return NotFound($"Review with ID {id} not found");
                }

                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting review {ReviewId}", id);
                return StatusCode(500, "An error occurred while deleting the review");
            }
        }

        [HttpGet("user")]
        public async Task<ActionResult<ReviewDto>> GetUserReview(int productId)
        {
            try
            {
                string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("Unauthorized attempt to get user review for product {ProductId} - no user ID in token", productId);
                    return Unauthorized(new { message = "You must be logged in to view your reviews" });
                }

                _logger.LogInformation("User {UserId} requesting their review for product {ProductId}", userId, productId);

                var review = await _reviewService.GetUserReviewForProductAsync(productId, userId);

                if (review == null)
                {
                    _logger.LogInformation("No review found for user {UserId} on product {ProductId}", userId, productId);
                    return NotFound(new { message = "You have not reviewed this product yet" });
                }

                _logger.LogInformation("Successfully retrieved review {ReviewId} for user {UserId} on product {ProductId}", review.Id, userId, productId);
                return Ok(review);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user review for product {ProductId}", productId);
                return StatusCode(500, new { message = "An error occurred while retrieving your review" });
            }
        }
    }
}