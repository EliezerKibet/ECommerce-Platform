using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ECommerce.API.DTOs;
using ECommerce.API.Interfaces;

namespace ECommerce.API.Controllers
{
    [ApiController]
    [Route("api/favorites")]
    public class FavoritesController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly ILogger<FavoritesController> _logger;
        private const string FAVORITES_COOKIE_NAME = "ChocolateFavorites";

        public FavoritesController(
            IProductService productService,
            ILogger<FavoritesController> logger)
        {
            _productService = productService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<ProductDto>>> GetFavorites()
        {
            var requestId = Guid.NewGuid().ToString("N").Substring(0, 8);
            _logger.LogInformation("[{RequestId}] Getting favorites for user", requestId);

            try
            {
                // Get favorites from cookie
                var favoriteIds = GetFavoriteIdsFromCookie();

                if (favoriteIds.Count == 0)
                {
                    _logger.LogInformation("[{RequestId}] No favorites found", requestId);
                    return new List<ProductDto>();
                }

                _logger.LogInformation("[{RequestId}] Found {Count} favorites", requestId, favoriteIds.Count);

                // Get the product details for all favorite product IDs
                var products = await _productService.GetProductsByIdsAsync(favoriteIds);

                // Ensure products are returned in the same order as they were added to favorites
                return products
                    .OrderBy(p => favoriteIds.IndexOf(p.Id))
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[{RequestId}] Error retrieving favorites", requestId);
                return StatusCode(500, "An error occurred while retrieving favorites");
            }
        }

        [HttpPost("{productId}")]
        public async Task<ActionResult<FavoriteActionResultDto>> AddToFavorites(int productId)
        {
            var requestId = Guid.NewGuid().ToString("N").Substring(0, 8);
            _logger.LogInformation("[{RequestId}] Adding product {ProductId} to favorites", requestId, productId);

            try
            {
                // Verify the product exists
                var product = await _productService.GetProductByIdAsync(productId);
                if (product == null)
                {
                    _logger.LogWarning("[{RequestId}] Product {ProductId} not found", requestId, productId);
                    return NotFound(new FavoriteActionResultDto
                    {
                        Success = false,
                        Message = "Product not found"
                    });
                }

                // Get current favorites
                var favoriteIds = GetFavoriteIdsFromCookie();

                // Check if already in favorites
                if (favoriteIds.Contains(productId))
                {
                    _logger.LogInformation("[{RequestId}] Product {ProductId} already in favorites", requestId, productId);
                    return Ok(new FavoriteActionResultDto
                    {
                        Success = false,
                        Message = "Product already in favorites",
                        TotalFavorites = favoriteIds.Count
                    });
                }

                // Add to favorites
                favoriteIds.Add(productId);

                // Save updated favorites
                SaveFavoritesToCookie(favoriteIds);

                _logger.LogInformation("[{RequestId}] Added product {ProductId} to favorites. Total: {Count}",
                    requestId, productId, favoriteIds.Count);

                return Ok(new FavoriteActionResultDto
                {
                    Success = true,
                    Message = $"Added {product.Name} to favorites",
                    TotalFavorites = favoriteIds.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[{RequestId}] Error adding product {ProductId} to favorites",
                    requestId, productId);
                return StatusCode(500, "An error occurred while adding to favorites");
            }
        }

        [HttpDelete("{productId}")]
        public async Task<ActionResult<FavoriteActionResultDto>> RemoveFromFavorites(int productId)
        {
            var requestId = Guid.NewGuid().ToString("N").Substring(0, 8);
            _logger.LogInformation("[{RequestId}] Removing product {ProductId} from favorites", requestId, productId);

            try
            {
                // Get product name for the message
                var product = await _productService.GetProductByIdAsync(productId);
                var productName = product?.Name ?? "Product";

                // Get current favorites
                var favoriteIds = GetFavoriteIdsFromCookie();

                // Check if in favorites
                if (!favoriteIds.Contains(productId))
                {
                    _logger.LogInformation("[{RequestId}] Product {ProductId} not in favorites", requestId, productId);
                    return NotFound(new FavoriteActionResultDto
                    {
                        Success = false,
                        Message = "Product not in favorites",
                        TotalFavorites = favoriteIds.Count
                    });
                }

                // Remove from favorites
                favoriteIds.Remove(productId);

                // Save updated favorites
                SaveFavoritesToCookie(favoriteIds);

                _logger.LogInformation("[{RequestId}] Removed product {ProductId} from favorites. Total: {Count}",
                    requestId, productId, favoriteIds.Count);

                return Ok(new FavoriteActionResultDto
                {
                    Success = true,
                    Message = $"Removed {productName} from favorites",
                    TotalFavorites = favoriteIds.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[{RequestId}] Error removing product {ProductId} from favorites",
                    requestId, productId);
                return StatusCode(500, "An error occurred while removing from favorites");
            }
        }

        [HttpDelete]
        public IActionResult ClearFavorites()
        {
            var requestId = Guid.NewGuid().ToString("N").Substring(0, 8);
            _logger.LogInformation("[{RequestId}] Clearing all favorites", requestId);

            try
            {
                // Clear the favorites cookie
                Response.Cookies.Delete(FAVORITES_COOKIE_NAME);

                _logger.LogInformation("[{RequestId}] All favorites cleared", requestId);

                return Ok(new FavoriteActionResultDto
                {
                    Success = true,
                    Message = "All favorites cleared",
                    TotalFavorites = 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[{RequestId}] Error clearing favorites", requestId);
                return StatusCode(500, "An error occurred while clearing favorites");
            }
        }

        [HttpGet("check/{productId}")]
        public IActionResult CheckFavorite(int productId)
        {
            var favoriteIds = GetFavoriteIdsFromCookie();
            bool isFavorite = favoriteIds.Contains(productId);

            return Ok(new { isFavorite });
        }

        // Helper method to get favorites from cookie
        private List<int> GetFavoriteIdsFromCookie()
        {
            if (!Request.Cookies.TryGetValue(FAVORITES_COOKIE_NAME, out string favoritesJson))
            {
                return new List<int>();
            }

            try
            {
                return JsonSerializer.Deserialize<List<int>>(favoritesJson) ?? new List<int>();
            }
            catch
            {
                // If cookie is corrupted, start fresh
                return new List<int>();
            }
        }

        // Helper method to save favorites to cookie
        private void SaveFavoritesToCookie(List<int> favoriteIds)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddYears(1),
                IsEssential = true,
                SameSite = SameSiteMode.Lax
            };

            var favoritesJson = JsonSerializer.Serialize(favoriteIds);
            Response.Cookies.Append(FAVORITES_COOKIE_NAME, favoritesJson, cookieOptions);
        }
    }
}