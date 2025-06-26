// Controllers/ProductsController.cs
using ECommerce.API.DTOs;
using ECommerce.API.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System.Text.Json;

namespace ECommerce.API.Controllers
{
    [Route("api/products")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly IReviewService _reviewService;
        private readonly ILogger<ProductsController> _logger;
        private const string FAVORITES_COOKIE_NAME = "ChocolateFavorites";
        private const string RECENTLY_VIEWED_COOKIE_NAME = "RecentlyViewed";
        private readonly IPromotionService _promotionService;

        public ProductsController(
            IProductService productService,
            IReviewService reviewService,
            IPromotionService promotionService,
            ILogger<ProductsController> logger)
        {
            _productService = productService;
            _reviewService = reviewService;
            _promotionService = promotionService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts()
        {
            var products = await _productService.GetAllProductsAsync();
            var favoriteIds = GetFavoriteIdsFromCookie();

            // Enhance products with favorite status
            var enhancedProducts = products.Select(p => new
            {
                Product = p,
                IsFavorite = favoriteIds.Contains(p.Id)
            });

            return Ok(enhancedProducts);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDto>> GetProduct(int id)
        {
            try
            {
                var product = await _productService.GetProductByIdAsync(id);
                if (product == null)
                    return NotFound();

                // Check if product is in an active promotion
                PromotionDto promotion = null;
                try
                {
                    promotion = await _promotionService.GetProductPromotionAsync(id);
                }
                catch (KeyNotFoundException)
                {
                    // No promotion found, continue without it
                }

                // Check if product is favorite
                var favoriteIds = GetFavoriteIdsFromCookie();
                bool isFavorite = favoriteIds.Contains(id);

                // Track this product view in recently viewed
                await TrackProductView(id);

                // Create response object with promotion details if available
                object result;

                if (promotion != null)
                {
                    decimal discountedPrice = product.Price * (1 - (promotion.DiscountPercentage / 100));

                    result = new
                    {
                        Product = product,
                        IsFavorite = isFavorite,
                        Promotion = new
                        {
                            Id = promotion.Id,
                            Name = promotion.Name,
                            Description = promotion.Description,
                            DiscountPercentage = promotion.DiscountPercentage,
                            EndDate = promotion.EndDate,
                            TimeRemaining = promotion.TimeRemaining,
                            Type = promotion.Type,
                            BannerImageUrl = promotion.BannerImageUrl,
                            ColorScheme = promotion.ColorScheme
                        },
                        OriginalPrice = product.Price,
                        DiscountedPrice = Math.Round(discountedPrice, 2),
                        Savings = Math.Round(product.Price - discountedPrice, 2)
                    };
                }
                else
                {
                    result = new
                    {
                        Product = product,
                        IsFavorite = isFavorite
                    };
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product with ID {ProductId}", id);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{id}/details")]
        public async Task<ActionResult<ProductDetailDto>> GetProductDetails(int id)
        {
            try
            {
                // Get the product
                var product = await _productService.GetProductByIdAsync(id);
                if (product == null)
                    return NotFound();

                // Get reviews for this product
                var reviews = await _reviewService.GetProductReviewsAsync(id, 1, 5);

                // Get rating summary
                var ratingSummary = await _reviewService.GetProductRatingsSummaryAsync(id);

                // Check if product is favorite
                var favoriteIds = GetFavoriteIdsFromCookie();
                bool isFavorite = favoriteIds.Contains(id);

                // Track this product view in recently viewed
                await TrackProductView(id);

                // Create product detail DTO with reviews, rating info, and favorite status
                var productDetail = new
                {
                    Product = product,
                    Reviews = reviews,
                    RatingSummary = ratingSummary,
                    IsFavorite = isFavorite
                };

                return Ok(productDetail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product details for product with ID {ProductId}", id);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("category/{categoryId}")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetProductsByCategory(int categoryId)
        {
            try
            {
                var products = await _productService.GetProductsByCategoryAsync(categoryId);
                var favoriteIds = GetFavoriteIdsFromCookie();

                // Enhance products with favorite status
                var enhancedProducts = products.Select(p => new
                {
                    Product = p,
                    IsFavorite = favoriteIds.Contains(p.Id)
                });

                return Ok(enhancedProducts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving products for category {CategoryId}", categoryId);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> SearchProducts([FromQuery] string term)
        {
            try
            {
                var products = await _productService.SearchProductsAsync(term);
                var favoriteIds = GetFavoriteIdsFromCookie();

                // Enhance products with favorite status
                var enhancedProducts = products.Select(p => new
                {
                    Product = p,
                    IsFavorite = favoriteIds.Contains(p.Id)
                });

                return Ok(enhancedProducts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching products with term {SearchTerm}", term);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("favorites")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetFavoriteProducts()
        {
            try
            {
                // Get favorite product IDs from cookie
                var favoriteIds = GetFavoriteIdsFromCookie();

                if (favoriteIds.Count == 0)
                {
                    return Ok(new List<ProductDto>());
                }

                // Get full product details for favorite IDs
                var products = await _productService.GetProductsByIdsAsync(favoriteIds);

                // Return products in the same order as they were favorited (preserve original order)
                var orderedProducts = products
                    .OrderBy(p => favoriteIds.IndexOf(p.Id))
                    .Select(p => new
                    {
                        Product = p,
                        IsFavorite = true // All products here are favorites
                    })
                    .ToList();

                return Ok(orderedProducts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving favorite products");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("favorites/{id}")]
        public async Task<ActionResult> AddToFavorites(int id)
        {
            try
            {
                // Verify the product exists
                var product = await _productService.GetProductByIdAsync(id);
                if (product == null)
                    return NotFound("Product not found");

                // Get current favorites
                var favoriteIds = GetFavoriteIdsFromCookie();

                // Check if already in favorites
                if (favoriteIds.Contains(id))
                {
                    return Ok(new
                    {
                        Success = false,
                        Message = "Product already in favorites",
                        TotalFavorites = favoriteIds.Count
                    });
                }

                // Add to favorites
                favoriteIds.Add(id);

                // Save updated favorites
                SaveFavoritesToCookie(favoriteIds);

                return Ok(new
                {
                    Success = true,
                    Message = $"Added {product.Name} to favorites",
                    TotalFavorites = favoriteIds.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding product {ProductId} to favorites", id);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("favorites/{id}")]
        public async Task<ActionResult> RemoveFromFavorites(int id)
        {
            try
            {
                // Get product name for the message
                var product = await _productService.GetProductByIdAsync(id);
                var productName = product?.Name ?? "Product";

                // Get current favorites
                var favoriteIds = GetFavoriteIdsFromCookie();

                // Check if in favorites
                if (!favoriteIds.Contains(id))
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Product not in favorites",
                        TotalFavorites = favoriteIds.Count
                    });
                }

                // Remove from favorites
                favoriteIds.Remove(id);

                // Save updated favorites
                SaveFavoritesToCookie(favoriteIds);

                return Ok(new
                {
                    Success = true,
                    Message = $"Removed {productName} from favorites",
                    TotalFavorites = favoriteIds.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing product {ProductId} from favorites", id);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("recently-viewed")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetRecentlyViewed()
        {
            try
            {
                // Get recently viewed product IDs from cookie
                var recentlyViewedIds = GetRecentlyViewedFromCookie();

                if (recentlyViewedIds.Count == 0)
                {
                    return Ok(new List<ProductDto>());
                }

                // Get full product details for the IDs
                var products = await _productService.GetProductsByIdsAsync(recentlyViewedIds);

                // Get favorites for enriching the response
                var favoriteIds = GetFavoriteIdsFromCookie();

                // Return products in the same order as they were viewed (most recent first)
                var orderedProducts = products
                    .OrderBy(p => recentlyViewedIds.IndexOf(p.Id))
                    .Select(p => new
                    {
                        Product = p,
                        IsFavorite = favoriteIds.Contains(p.Id)
                    })
                    .ToList();

                return Ok(orderedProducts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving recently viewed products");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{id}/similar")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetSimilarProducts(int id, [FromQuery] int count = 4)
        {
            try
            {
                // Get the product
                var product = await _productService.GetProductByIdAsync(id);
                if (product == null)
                    return NotFound("Product not found");

                // Get products in same category with similar characteristics
                var similarProducts = await _productService.GetSimilarProductsAsync(id, count);

                // Get favorites for enriching the response
                var favoriteIds = GetFavoriteIdsFromCookie();

                // Enhance products with favorite status
                var enhancedProducts = similarProducts.Select(p => new
                {
                    Product = p,
                    IsFavorite = favoriteIds.Contains(p.Id)
                });

                return Ok(enhancedProducts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving similar products for product {ProductId}", id);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
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

        // Helper method to get recently viewed products from cookie
        private List<int> GetRecentlyViewedFromCookie()
        {
            if (!Request.Cookies.TryGetValue(RECENTLY_VIEWED_COOKIE_NAME, out string recentlyViewedJson))
            {
                return new List<int>();
            }

            try
            {
                return JsonSerializer.Deserialize<List<int>>(recentlyViewedJson) ?? new List<int>();
            }
            catch
            {
                // If cookie is corrupted, start fresh
                return new List<int>();
            }
        }

        // Helper method to track a product view in recently viewed
        private async Task TrackProductView(int productId)
        {
            // Get current recently viewed products
            var recentlyViewedIds = GetRecentlyViewedFromCookie();

            // Remove if already exists (to move to front)
            recentlyViewedIds.Remove(productId);

            // Add to beginning of list (most recent first)
            recentlyViewedIds.Insert(0, productId);

            // Keep only most recent 20
            if (recentlyViewedIds.Count > 20)
                recentlyViewedIds = recentlyViewedIds.Take(20).ToList();

            // Save back to cookie
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(30),
                IsEssential = true,
                SameSite = SameSiteMode.Lax
            };

            Response.Cookies.Append(RECENTLY_VIEWED_COOKIE_NAME, JsonSerializer.Serialize(recentlyViewedIds), cookieOptions);
        }

        // Add a new endpoint for deals/promotions
        [HttpGet("deals")]
        public async Task<ActionResult<List<object>>> GetDeals()
        {
            try
            {
                // Get active promotions
                var activePromotions = await _promotionService.GetActivePromotionsAsync();

                if (!activePromotions.Any())
                    return new List<object>();

                var now = DateTime.UtcNow;
                var deals = new List<object>();

                foreach (var promotion in activePromotions)
                {
                    var productIds = promotion.Products.Select(p => p.Id).ToList();

                    // Get products in the promotion
                    var products = await _productService.GetProductsByIdsAsync(productIds);

                    // Get favorites for enhancing response
                    var favoriteIds = GetFavoriteIdsFromCookie();

                    // Add products with promotion details
                    foreach (var product in products)
                    {
                        decimal discountedPrice = product.Price * (1 - (promotion.DiscountPercentage / 100));

                        deals.Add(new
                        {
                            Product = product,
                            IsFavorite = favoriteIds.Contains(product.Id),
                            Promotion = new
                            {
                                Id = promotion.Id,
                                Name = promotion.Name,
                                Description = promotion.Description,
                                DiscountPercentage = promotion.DiscountPercentage,
                                EndDate = promotion.EndDate,
                                TimeRemaining = promotion.TimeRemaining,
                                Type = promotion.Type,
                                BannerImageUrl = promotion.BannerImageUrl,
                                ColorScheme = promotion.ColorScheme
                            },
                            OriginalPrice = product.Price,
                            DiscountedPrice = Math.Round(discountedPrice, 2),
                            Savings = Math.Round(product.Price - discountedPrice, 2)
                        });
                    }
                }

                return Ok(deals);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving deals");
                return StatusCode(500, "An error occurred while retrieving deals");
            }
        }

        [HttpPatch("{id}/toggle-visibility")]
        public async Task<IActionResult> ToggleVisibility(int id)
        {
            try
            {
                var result = await _productService.ToggleProductVisibilityAsync(id);

                if (!result.Success)
                {
                    if (result.Error == "NotFound")
                    {
                        return NotFound();
                    }

                    return BadRequest(result.Message);
                }

                return Ok(new { isVisible = result.IsVisible });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling visibility for product {ProductId}", id);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}