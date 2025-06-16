// Controllers/AdminController.cs
using ECommerce.API.DTOs;
using ECommerce.API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.Extensions.Hosting;
using Microsoft.SqlServer.Server;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.API.Controllers
{
    [Route("api/admin")]
    [ApiController]
    //[Authorize(Roles = "Admin")] // Ensure only admins can access this controller
    public class AdminController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly ICategoryService _categoryService;
        private readonly ICouponService _couponService;
        private readonly ILogger<AdminController> _logger;
        private readonly IPromotionService _promotionService;
        private readonly IAnalyticsService _analyticsService;

        public AdminController(
            IProductService productService,
            ICategoryService categoryService,
            ICouponService couponService,
            IPromotionService promotionService,
            IAnalyticsService analyticsService,
            ILogger<AdminController> logger)
        {
            _productService = productService;
            _categoryService = categoryService;
            _couponService = couponService;
            _promotionService = promotionService;
            _analyticsService = analyticsService;
            _logger = logger;
        }

        // Product management endpoints
        [HttpGet("products")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts()
        {
            var products = await _productService.GetAllProductsAsync();
            return Ok(products);
        }

        [HttpGet("products/{id}")]
        public async Task<ActionResult<ProductDto>> GetProduct(int id)
        {
            try
            {
                var product = await _productService.GetProductByIdAsync(id);
                if (product == null)
                    return NotFound();

                return Ok(product);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("products")]
        public async Task<ActionResult<ProductDto>> CreateProduct([FromForm] ProductCreateUpdateDto productDto)
        {
            try
            {
                var createdProduct = await _productService.CreateProductAsync(productDto, productDto.Image);
                return CreatedAtAction(nameof(GetProduct), new { id = createdProduct.Id }, createdProduct);
            }
            catch (KeyNotFoundException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("products/{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromForm] ProductCreateUpdateDto productDto)
        {
            _logger.LogInformation("=== UPDATE PRODUCT STARTED ===");
            _logger.LogInformation("ProductId: {ProductId}", id);

            // Log all incoming form data
            _logger.LogInformation("=== FORM DATA RECEIVED ===");
            foreach (var key in Request.Form.Keys)
            {
                var values = Request.Form[key];
                _logger.LogInformation("Key: {Key}, Values: {Values}", key, string.Join(", ", values.ToArray()));
            }

            // Log any files
            if (Request.Form.Files.Count > 0)
            {
                _logger.LogInformation("=== FILES RECEIVED ===");
                foreach (var file in Request.Form.Files)
                {
                    _logger.LogInformation("File: {FileName}, Size: {Size}, ContentType: {ContentType}",
                        file.FileName, file.Length, file.ContentType);
                }
            }

            // Log the bound DTO properties
            _logger.LogInformation("=== BOUND DTO PROPERTIES ===");
            _logger.LogInformation("Name: '{Name}'", productDto.Name);
            _logger.LogInformation("Description: '{Description}'", productDto.Description);
            _logger.LogInformation("Price: {Price}", productDto.Price);
            _logger.LogInformation("StockQuantity: {StockQuantity}", productDto.StockQuantity);
            _logger.LogInformation("CategoryId: {CategoryId}", productDto.CategoryId);
            _logger.LogInformation("WeightInGrams: {WeightInGrams}", productDto.WeightInGrams);
            _logger.LogInformation("CocoaPercentage: '{CocoaPercentage}'", productDto.CocoaPercentage);
            _logger.LogInformation("Origin: '{Origin}'", productDto.Origin);
            _logger.LogInformation("FlavorNotes: '{FlavorNotes}'", productDto.FlavorNotes);
            _logger.LogInformation("IsOrganic: {IsOrganic}", productDto.IsOrganic);
            _logger.LogInformation("IsFairTrade: {IsFairTrade}", productDto.IsFairTrade);
            _logger.LogInformation("Ingredients: '{Ingredients}'", productDto.Ingredients);
            _logger.LogInformation("AllergenInfo: '{AllergenInfo}'", productDto.AllergenInfo);
            _logger.LogInformation("Image: {HasImage}", productDto.Image != null ? $"Present ({productDto.Image.Length} bytes)" : "Not provided");

            // Check ModelState
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("=== MODEL STATE VALIDATION FAILED ===");
                var errors = new List<string>();

                foreach (var state in ModelState)
                {
                    foreach (var error in state.Value.Errors)
                    {
                        var errorMessage = $"{state.Key}: {error.ErrorMessage}";
                        _logger.LogWarning("Validation Error: {ErrorMessage}", errorMessage);
                        errors.Add(errorMessage);
                    }
                }

                var response = new
                {
                    message = "Validation failed",
                    errors = errors.ToArray(),
                    details = ModelState.ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
                    )
                };

                _logger.LogWarning("Returning validation error response: {@Response}", response);
                return BadRequest(response);
            }

            try
            {
                _logger.LogInformation("Model validation passed, calling service...");

                // Use your existing UpdateProductAsync method that takes the DTO directly
                var updatedProduct = await _productService.UpdateProductAsync(id, productDto);
                _logger.LogInformation("Product updated successfully: ProductId={ProductId}", id);
                return Ok(updatedProduct);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Product not found: ProductId={ProductId}", id);
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument: ProductId={ProductId}", id);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product: ProductId={ProductId}", id);
                return StatusCode(500, new
                {
                    message = "Internal server error",
                    details = ex.Message
                });
            }
        }

        [HttpDelete("products/{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            try
            {
                await _productService.DeleteProductAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Product with ID {id} not found");
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product {ProductId}", id);
                return StatusCode(500, "An error occurred while deleting the product");
            }
        }

        // Category management endpoints
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
        {
            var categories = await _categoryService.GetAllCategoriesAsync();
            return Ok(categories);
        }

        [HttpGet("categories/{id}")]
        public async Task<ActionResult<CategoryDto>> GetCategory(int id)
        {
            try
            {
                var category = await _categoryService.GetCategoryByIdAsync(id);
                if (category == null)
                    return NotFound();

                return Ok(category);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("categories")]
        public async Task<ActionResult<CategoryDto>> CreateCategory(CategoryCreateUpdateDto categoryDto)
        {
            try
            {
                var createdCategory = await _categoryService.CreateCategoryAsync(categoryDto);
                return CreatedAtAction(nameof(GetCategory), new { id = createdCategory.Id }, createdCategory);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, CategoryCreateUpdateDto categoryDto)
        {
            try
            {
                var updatedCategory = await _categoryService.UpdateCategoryAsync(id, categoryDto);
                return Ok(updatedCategory);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            try
            {
                await _categoryService.DeleteCategoryAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Coupon management endpoints
        [HttpGet("coupons")]
        public async Task<ActionResult<List<CouponDto>>> GetAllCoupons()
        {
            try
            {
                var coupons = await _couponService.GetAllCouponsAsync();
                return Ok(coupons);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving coupons");
                return StatusCode(500, "An error occurred while retrieving coupons");
            }
        }

        [HttpGet("coupons/{id}")]
        public async Task<ActionResult<CouponDto>> GetCouponById(int id)
        {
            try
            {
                var coupon = await _couponService.GetCouponByIdAsync(id);
                return Ok(coupon);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving coupon {CouponId}", id);
                return StatusCode(500, "An error occurred while retrieving the coupon");
            }
        }

        [HttpPost("coupons")]
        public async Task<ActionResult<CouponDto>> CreateCoupon([FromBody] CreateUpdateCouponDto dto)
        {
            try
            {
                var coupon = await _couponService.CreateCouponAsync(dto);
                return CreatedAtAction(nameof(GetCouponById), new { id = coupon.Id }, coupon);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating coupon");
                return StatusCode(500, "An error occurred while creating the coupon");
            }
        }

        [HttpPut("coupons/{id}")]
        public async Task<ActionResult<CouponDto>> UpdateCoupon(int id, [FromBody] CreateUpdateCouponDto dto)
        {
            try
            {
                var coupon = await _couponService.UpdateCouponAsync(id, dto);
                return Ok(coupon);
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
                _logger.LogError(ex, "Error updating coupon {CouponId}", id);
                return StatusCode(500, "An error occurred while updating the coupon");
            }
        }

        [HttpDelete("coupons/{id}")]
        public async Task<ActionResult> DeleteCoupon(int id)
        {
            try
            {
                var result = await _couponService.DeleteCouponAsync(id);

                if (!result)
                    return NotFound($"Coupon with ID {id} not found");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting coupon {CouponId}", id);
                return StatusCode(500, "An error occurred while deleting the coupon");
            }
        }


        // Promotion management endpoints
        [HttpGet("promotions")]
        public async Task<ActionResult<List<PromotionDto>>> GetAllPromotions()
        {
            try
            {
                var promotions = await _promotionService.GetAllPromotionsAsync();
                return Ok(promotions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving promotions");
                return StatusCode(500, "An error occurred while retrieving promotions");
            }
        }

        [HttpGet("promotions/{id}")]
        public async Task<ActionResult<PromotionDto>> GetPromotionById(int id)
        {
            try
            {
                var promotion = await _promotionService.GetPromotionByIdAsync(id);
                return Ok(promotion);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving promotion {PromotionId}", id);
                return StatusCode(500, "An error occurred while retrieving the promotion");
            }
        }


        [HttpPost("upload")]
        [RequestSizeLimit(10_000_000)] // 10 MB limit, adjust as needed
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> UploadBannerImage([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded." });

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            // Ensure unique file name
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return the relative URL for use in the frontend
            var url = $"/uploads/{fileName}";
            return Ok(new { url });
        }

    [HttpPost("promotions")]
        public async Task<ActionResult<PromotionDto>> CreatePromotion([FromBody] CreateUpdatePromotionDto dto)
        {
            try
            {
                var promotion = await _promotionService.CreatePromotionAsync(dto);
                return CreatedAtAction(nameof(GetPromotionById), new { id = promotion.Id }, promotion);
            }
            catch (KeyNotFoundException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating promotion");
                return StatusCode(500, "An error occurred while creating the promotion");
            }
        }

        [HttpPut("promotions/{id}")]
        public async Task<ActionResult<PromotionDto>> UpdatePromotion(int id, [FromBody] CreateUpdatePromotionDto dto)
        {
            _logger.LogInformation("=== UPDATE PROMOTION STARTED ===");
            _logger.LogInformation("PromotionId: {PromotionId}", id);

            // Log the raw request body
            Request.EnableBuffering();
            var body = await new StreamReader(Request.Body).ReadToEndAsync();
            Request.Body.Position = 0;
            _logger.LogInformation("Raw request body: {RequestBody}", body);

            // Log the bound DTO properties
            _logger.LogInformation("=== BOUND DTO PROPERTIES ===");
            _logger.LogInformation("Name: '{Name}'", dto?.Name);
            _logger.LogInformation("Description: '{Description}'", dto?.Description);
            _logger.LogInformation("DiscountPercentage: {DiscountPercentage}", dto?.DiscountPercentage);
            _logger.LogInformation("StartDate: {StartDate}", dto?.StartDate);
            _logger.LogInformation("EndDate: {EndDate}", dto?.EndDate);
            _logger.LogInformation("IsActive: {IsActive}", dto?.IsActive);
            _logger.LogInformation("ProductIds: [{ProductIds}]", dto?.ProductIds != null ? string.Join(", ", dto.ProductIds) : "null");

            // Check ModelState
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("=== MODEL STATE VALIDATION FAILED ===");
                var errors = new List<string>();

                foreach (var state in ModelState)
                {
                    foreach (var error in state.Value.Errors)
                    {
                        var errorMessage = $"{state.Key}: {error.ErrorMessage}";
                        _logger.LogWarning("Validation Error: {ErrorMessage}", errorMessage);
                        errors.Add(errorMessage);
                    }
                }

                var response = new
                {
                    message = "Validation failed",
                    errors = errors.ToArray(),
                    details = ModelState.ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
                    )
                };

                _logger.LogWarning("Returning validation error response: {@Response}", response);
                return BadRequest(response);
            }

            try
            {
                _logger.LogInformation("Model validation passed, calling service...");
                var promotion = await _promotionService.UpdatePromotionAsync(id, dto);
                _logger.LogInformation("Promotion updated successfully: PromotionId={PromotionId}", id);
                return Ok(promotion);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Promotion not found: PromotionId={PromotionId}", id);
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation: PromotionId={PromotionId}", id);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating promotion: PromotionId={PromotionId}", id);
                return StatusCode(500, new
                {
                    message = "Internal server error",
                    details = ex.Message
                });
            }
        }

        [HttpDelete("promotions/{id}")]
        public async Task<ActionResult> DeletePromotion(int id)
        {
            try
            {
                var result = await _promotionService.DeletePromotionAsync(id);

                if (!result)
                    return NotFound($"Promotion with ID {id} not found");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting promotion {PromotionId}", id);
                return StatusCode(500, "An error occurred while deleting the promotion");
            }
        }

        [HttpGet("promotions/{id}/products")]
        public async Task<ActionResult<List<PromotionProductDto>>> GetPromotionProducts(int id)
        {
            try
            {
                var products = await _promotionService.GetPromotionProductsAsync(id);
                return Ok(products);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving promotion products for promotion {PromotionId}", id);
                return StatusCode(500, "An error occurred while retrieving promotion products");
            }
        }


        // Coupon visibility toggle endpoint
        [HttpPatch("coupons/{id}/toggle-visibility")]
        public async Task<ActionResult<CouponDto>> ToggleCouponVisibility(int id)
        {
            try
            {
                _logger.LogInformation("Toggling visibility for coupon {CouponId}", id);

                var coupon = await _couponService.GetCouponByIdAsync(id);
                if (coupon == null)
                    return NotFound($"Coupon with ID {id} not found");

                var dto = new CreateUpdateCouponDto
                {
                    Code = coupon.Code,
                    Description = coupon.Description,
                    DiscountType = coupon.DiscountType,        // Add this
                    DiscountAmount = coupon.DiscountAmount,
                    MinimumOrderAmount = coupon.MinimumOrderAmount,  // Add this
                    StartDate = coupon.StartDate,
                    EndDate = coupon.EndDate,
                    UsageLimit = coupon.UsageLimit,            // Add this
                    IsActive = !coupon.IsActive
                };

                var updatedCoupon = await _couponService.UpdateCouponAsync(id, dto);

                _logger.LogInformation("Coupon {CouponId} visibility toggled to {IsActive}", id, updatedCoupon.IsActive);
                return Ok(updatedCoupon);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Coupon not found: CouponId={CouponId}", id);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling coupon visibility: CouponId={CouponId}", id);
                return StatusCode(500, new
                {
                    message = "Internal server error",
                    details = ex.Message
                });
            }
        }

        // Coupon status endpoints (Beyond just toggling visibility)
        [HttpPatch("coupons/{id}/activate")]
        public async Task<ActionResult<CouponDto>> ActivateCoupon(int id)
        {
            try
            {
                var coupon = await _couponService.GetCouponByIdAsync(id);
                if (coupon == null)
                    return NotFound($"Coupon with ID {id} not found");

                if (coupon.IsActive)
                    return Ok(coupon); // Already active, no need to change

                var dto = new CreateUpdateCouponDto
                {
                    Code = coupon.Code,
                    Description = coupon.Description,
                    DiscountAmount = coupon.DiscountAmount,
                    StartDate = coupon.StartDate,
                    EndDate = coupon.EndDate,
                    IsActive = true
                };

                var updatedCoupon = await _couponService.UpdateCouponAsync(id, dto);

                return Ok(updatedCoupon);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error activating coupon {CouponId}", id);
                return StatusCode(500, "An error occurred while activating the coupon");
            }
        }

        [HttpPatch("coupons/{id}/deactivate")]
        public async Task<ActionResult<CouponDto>> DeactivateCoupon(int id)
        {
            try
            {
                var coupon = await _couponService.GetCouponByIdAsync(id);
                if (coupon == null)
                    return NotFound($"Coupon with ID {id} not found");

                if (!coupon.IsActive)
                    return Ok(coupon); // Already inactive, no need to change

                var dto = new CreateUpdateCouponDto
                {
                    Code = coupon.Code,
                    Description = coupon.Description,
                    DiscountAmount = coupon.DiscountAmount,
                    StartDate = coupon.StartDate,
                    EndDate = coupon.EndDate,
                    IsActive = false
                };

                var updatedCoupon = await _couponService.UpdateCouponAsync(id, dto);

                return Ok(updatedCoupon);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deactivating coupon {CouponId}", id);
                return StatusCode(500, "An error occurred while deactivating the coupon");
            }
        }

        // Promotion visibility toggle endpoint
        [HttpPatch("promotions/{id}/toggle-visibility")]
        public async Task<ActionResult<PromotionDto>> TogglePromotionVisibility(int id)
        {
            try
            {
                _logger.LogInformation("Toggling visibility for promotion {PromotionId}", id);

                // Get the current promotion
                var promotion = await _promotionService.GetPromotionByIdAsync(id);
                if (promotion == null)
                    return NotFound($"Promotion with ID {id} not found");

                // Toggle isActive status
                var dto = new CreateUpdatePromotionDto
                {
                    Name = promotion.Name,
                    Description = promotion.Description,
                    StartDate = promotion.StartDate,
                    EndDate = promotion.EndDate,
                    DiscountPercentage = promotion.DiscountPercentage,
                    IsActive = !promotion.IsActive, // Toggle the visibility/active status
                    ProductIds = promotion.Products?.Select(p => p.Id).ToList() ?? new List<int>()
                };

                // Update the promotion
                var updatedPromotion = await _promotionService.UpdatePromotionAsync(id, dto);

                _logger.LogInformation("Promotion {PromotionId} visibility toggled to {IsActive}", id, updatedPromotion.IsActive);
                return Ok(updatedPromotion);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Promotion not found: PromotionId={PromotionId}", id);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling promotion visibility: PromotionId={PromotionId}", id);
                return StatusCode(500, new
                {
                    message = "Internal server error",
                    details = ex.Message
                });
            }
        }

        // Promotion status endpoints
        [HttpPatch("promotions/{id}/activate")]
        public async Task<ActionResult<PromotionDto>> ActivatePromotion(int id)
        {
            try
            {
                var promotion = await _promotionService.GetPromotionByIdAsync(id);
                if (promotion == null)
                    return NotFound($"Promotion with ID {id} not found");

                if (promotion.IsActive)
                    return Ok(promotion); // Already active, no need to change

                var dto = new CreateUpdatePromotionDto
                {
                    Name = promotion.Name,
                    Description = promotion.Description,
                    StartDate = promotion.StartDate,
                    EndDate = promotion.EndDate,
                    DiscountPercentage = promotion.DiscountPercentage,
                    IsActive = true,
                    ProductIds = promotion.Products?.Select(p => p.Id).ToList() ?? new List<int>()
                };

                var updatedPromotion = await _promotionService.UpdatePromotionAsync(id, dto);

                return Ok(updatedPromotion);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error activating promotion {PromotionId}", id);
                return StatusCode(500, "An error occurred while activating the promotion");
            }
        }

        [HttpPatch("promotions/{id}/deactivate")]
        public async Task<ActionResult<PromotionDto>> DeactivatePromotion(int id)
        {
            try
            {
                var promotion = await _promotionService.GetPromotionByIdAsync(id);
                if (promotion == null)
                    return NotFound($"Promotion with ID {id} not found");

                if (!promotion.IsActive)
                    return Ok(promotion); // Already inactive, no need to change

                var dto = new CreateUpdatePromotionDto
                {
                    Name = promotion.Name,
                    Description = promotion.Description,
                    StartDate = promotion.StartDate,
                    EndDate = promotion.EndDate,
                    DiscountPercentage = promotion.DiscountPercentage,
                    IsActive = false,
                    ProductIds = promotion.Products?.Select(p => p.Id).ToList() ?? new List<int>()
                };

                var updatedPromotion = await _promotionService.UpdatePromotionAsync(id, dto);

                return Ok(updatedPromotion);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deactivating promotion {PromotionId}", id);
                return StatusCode(500, "An error occurred while deactivating the promotion");
            }
        }

        // Add/Remove products from a promotion
        [HttpPost("promotions/{id}/products")]
        public async Task<ActionResult<PromotionDto>> AddProductToPromotion(int id, [FromBody] AddProductToPromotionDto dto)
        {
            try
            {
                _logger.LogInformation("Adding product {ProductId} to promotion {PromotionId}", dto.ProductId, id);

                var promotion = await _promotionService.GetPromotionByIdAsync(id);
                if (promotion == null)
                    return NotFound($"Promotion with ID {id} not found");

                // Assuming you have a method in your service to add a product to a promotion
                var updatedPromotion = await _promotionService.AddProductToPromotionAsync(id, dto.ProductId);

                return Ok(updatedPromotion);
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
                _logger.LogError(ex, "Error adding product {ProductId} to promotion {PromotionId}", dto.ProductId, id);
                return StatusCode(500, "An error occurred while adding product to promotion");
            }
        }

        [HttpDelete("promotions/{id}/products/{productId}")]
        public async Task<ActionResult<PromotionDto>> RemoveProductFromPromotion(int id, int productId)
        {
            try
            {
                _logger.LogInformation("Removing product {ProductId} from promotion {PromotionId}", productId, id);

                // Assuming you have a method in your service to remove a product from a promotion
                var updatedPromotion = await _promotionService.RemoveProductFromPromotionAsync(id, productId);

                return Ok(updatedPromotion);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing product {ProductId} from promotion {PromotionId}", productId, id);
                return StatusCode(500, "An error occurred while removing product from promotion");
            }
        }

        // Data class for adding products to promotions
        



        #region Order Management

        // These endpoints could be added in the future
        // - Get all orders
        // - Get order by ID
        // - Update order status
        // - Cancel order
        // - etc.

        #endregion

        #region User Management

        // These endpoints could be added in the future
        // - Get all users
        // - Get user by ID
        // - Update user roles
        // - Deactivate user
        // - etc.

        #endregion
    }
}