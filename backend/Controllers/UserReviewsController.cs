// Controllers/UserReviewsController.cs
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
    [Route("api/user/reviews")]
    [Authorize]
    public class UserReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly ILogger<UserReviewsController> _logger;

        public UserReviewsController(
            IReviewService reviewService,
            ILogger<UserReviewsController> logger)
        {
            _reviewService = reviewService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<ReviewDto>>> GetUserReviews()
        {
            try
            {
                string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var reviews = await _reviewService.GetUserReviewsAsync(userId);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user reviews");
                return StatusCode(500, "An error occurred while retrieving your reviews");
            }
        }
    }
}