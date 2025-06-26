using ECommerce.API.Data;
using ECommerce.API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Services
{
    public class PromotionService : IPromotionService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PromotionService> _logger;
        private readonly IProductService _productService;

        public PromotionService(
            ApplicationDbContext context,
            ILogger<PromotionService> logger,
            IProductService productService)
        {
            _context = context;
            _logger = logger;
            _productService = productService;
        }

        public async Task<List<PromotionDto>> GetAllPromotionsAsync()
        {
            var promotions = await _context.Promotions
                .Include(p => p.Products)
                    .ThenInclude(pp => pp.Product)
                .OrderByDescending(p => p.IsActive)
                .ThenByDescending(p => p.StartDate)
                .ToListAsync();

            return await MapPromotionsToDto(promotions);
        }

        public async Task<List<PromotionDto>> GetActivePromotionsAsync()
        {
            var now = DateTime.UtcNow;

            var promotions = await _context.Promotions
                .Where(p => p.IsActive && p.StartDate <= now && p.EndDate >= now)
                .Include(p => p.Products)
                    .ThenInclude(pp => pp.Product)
                .OrderBy(p => p.EndDate)
                .ToListAsync();

            return await MapPromotionsToDto(promotions);
        }

        public async Task<PromotionDto> GetPromotionByIdAsync(int id)
        {
            var promotion = await _context.Promotions
                .Include(p => p.Products)
                    .ThenInclude(pp => pp.Product)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (promotion == null)
                throw new KeyNotFoundException($"Promotion with ID {id} not found");

            return await MapPromotionToDto(promotion);
        }

        public async Task<PromotionDto> CreatePromotionAsync(CreateUpdatePromotionDto dto)
        {
            // Validate dates
            if (dto.StartDate >= dto.EndDate)
                throw new InvalidOperationException("End date must be after start date");

            // Validate discount percentage
            if (dto.DiscountPercentage <= 0 || dto.DiscountPercentage > 100)
                throw new InvalidOperationException("Discount percentage must be between 0 and 100");

            // Validate product IDs
            if (dto.ProductIds == null || !dto.ProductIds.Any())
                throw new InvalidOperationException("At least one product must be selected for promotion");

            // Check products exist
            var existingProductIds = await _context.Products
                .Where(p => dto.ProductIds.Contains(p.Id))
                .Select(p => p.Id)
                .ToListAsync();

            if (existingProductIds.Count != dto.ProductIds.Count)
            {
                var nonExistingIds = dto.ProductIds.Except(existingProductIds);
                throw new KeyNotFoundException($"Products with the following IDs do not exist: {string.Join(", ", nonExistingIds)}");
            }

            // Create promotion
            var promotion = new Promotion
            {
                Name = dto.Name,
                Description = dto.Description,
                DiscountPercentage = dto.DiscountPercentage,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                IsActive = dto.IsActive,
                BannerImageUrl = dto.BannerImageUrl,
                Type = dto.Type,
                ColorScheme = dto.ColorScheme,
                Products = dto.ProductIds.Select(productId => new PromotionProduct
                {
                    ProductId = productId
                }).ToList()
            };

            _context.Promotions.Add(promotion);
            await _context.SaveChangesAsync();

            return await GetPromotionByIdAsync(promotion.Id);
        }

        public async Task<PromotionDto> UpdatePromotionAsync(int id, CreateUpdatePromotionDto dto)
        {
            // Validate dates
            if (dto.StartDate >= dto.EndDate)
                throw new InvalidOperationException("End date must be after start date");

            // Validate discount percentage
            if (dto.DiscountPercentage <= 0 || dto.DiscountPercentage > 100)
                throw new InvalidOperationException("Discount percentage must be between 0 and 100");

            // Validate product IDs
            if (dto.ProductIds == null || !dto.ProductIds.Any())
                throw new InvalidOperationException("At least one product must be selected for promotion");

            // Find promotion
            var promotion = await _context.Promotions
                .Include(p => p.Products)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (promotion == null)
                throw new KeyNotFoundException($"Promotion with ID {id} not found");

            // Check products exist
            var existingProductIds = await _context.Products
                .Where(p => dto.ProductIds.Contains(p.Id))
                .Select(p => p.Id)
                .ToListAsync();

            if (existingProductIds.Count != dto.ProductIds.Count)
            {
                var nonExistingIds = dto.ProductIds.Except(existingProductIds);
                throw new KeyNotFoundException($"Products with the following IDs do not exist: {string.Join(", ", nonExistingIds)}");
            }

            // Update promotion
            promotion.Name = dto.Name;
            promotion.Description = dto.Description;
            promotion.DiscountPercentage = dto.DiscountPercentage;
            promotion.StartDate = dto.StartDate;
            promotion.EndDate = dto.EndDate;
            promotion.IsActive = dto.IsActive;
            promotion.BannerImageUrl = dto.BannerImageUrl;
            promotion.Type = dto.Type;
            promotion.ColorScheme = dto.ColorScheme;

            // Update products
            // Remove existing products
            _context.PromotionProducts.RemoveRange(promotion.Products);

            // Add new products
            promotion.Products = dto.ProductIds.Select(productId => new PromotionProduct
            {
                PromotionId = id,
                ProductId = productId
            }).ToList();

            _context.Promotions.Update(promotion);
            await _context.SaveChangesAsync();

            return await GetPromotionByIdAsync(promotion.Id);
        }

        public async Task<bool> DeletePromotionAsync(int id)
        {
            var promotion = await _context.Promotions
                .Include(p => p.Products)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (promotion == null)
                return false;

            // Remove products
            _context.PromotionProducts.RemoveRange(promotion.Products);

            // Remove promotion
            _context.Promotions.Remove(promotion);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<PromotionProductDto>> GetPromotionProductsAsync(int promotionId)
        {
            var promotion = await _context.Promotions
                .Include(p => p.Products)
                    .ThenInclude(pp => pp.Product)
                .FirstOrDefaultAsync(p => p.Id == promotionId);

            if (promotion == null)
                throw new KeyNotFoundException($"Promotion with ID {promotionId} not found");

            var result = new List<PromotionProductDto>();

            foreach (var promotionProduct in promotion.Products)
            {
                var product = promotionProduct.Product;
                var originalPrice = product.Price;
                var discountedPrice = originalPrice * (1 - (promotion.DiscountPercentage / 100));
                var savingsAmount = originalPrice - discountedPrice;

                result.Add(new PromotionProductDto
                {
                    Product = _productService.MapToDto(product),
                    OriginalPrice = originalPrice,
                    DiscountedPrice = Math.Round(discountedPrice, 2),
                    SavingsAmount = Math.Round(savingsAmount, 2),
                    SavingsPercentage = promotion.DiscountPercentage
                });
            }

            return result;
        }

        public async Task<PromotionDto> GetProductPromotionAsync(int productId)
        {
            var now = DateTime.UtcNow;

            var promotion = await _context.Promotions
                .Include(p => p.Products)
                    .ThenInclude(pp => pp.Product)
                .Where(p => p.IsActive && p.StartDate <= now && p.EndDate >= now)
                .Where(p => p.Products.Any(pp => pp.ProductId == productId))
                .OrderByDescending(p => p.DiscountPercentage)
                .FirstOrDefaultAsync();

            if (promotion == null)
                throw new KeyNotFoundException($"No active promotion found for product with ID {productId}");

            return await MapPromotionToDto(promotion);
        }

        // Helper methods for mapping
        private async Task<PromotionDto> MapPromotionToDto(Promotion promotion)
        {
            var productDtos = new List<ProductDto>();

            if (promotion.Products != null)
            {
                foreach (var pp in promotion.Products)
                {
                    if (pp.Product == null)
                    {
                        var product = await _context.Products.FindAsync(pp.ProductId);
                        if (product != null)
                        {
                            productDtos.Add(_productService.MapToDto(product));
                        }
                    }
                    else
                    {
                        productDtos.Add(_productService.MapToDto(pp.Product));
                    }
                }
            }

            var now = DateTime.UtcNow;
            var timeRemaining = promotion.EndDate > now ?
                (promotion.EndDate - now).TotalSeconds : 0;

            return new PromotionDto
            {
                Id = promotion.Id,
                Name = promotion.Name,
                Description = promotion.Description,
                DiscountPercentage = promotion.DiscountPercentage,
                StartDate = promotion.StartDate,
                EndDate = promotion.EndDate,
                IsActive = promotion.IsActive,
                BannerImageUrl = promotion.BannerImageUrl,
                Type = promotion.Type,
                ColorScheme = promotion.ColorScheme,
                TimeRemaining = timeRemaining,
                Products = productDtos
            };
        }

        private async Task<List<PromotionDto>> MapPromotionsToDto(List<Promotion> promotions)
        {
            var result = new List<PromotionDto>();

            foreach (var promotion in promotions)
            {
                result.Add(await MapPromotionToDto(promotion));
            }

            return result;
        }

        public async Task<PromotionDto> AddProductToPromotionAsync(int promotionId, int productId)
        {
            var promotion = await _context.Promotions
                .Include(p => p.Products)
                .FirstOrDefaultAsync(p => p.Id == promotionId);

            if (promotion == null)
                throw new KeyNotFoundException($"Promotion with ID {promotionId} not found");

            var product = await _context.Products.FindAsync(productId);
            if (product == null)
                throw new KeyNotFoundException($"Product with ID {productId} not found");

            // Check if product is already in the promotion
            if (promotion.Products.Any(pp => pp.ProductId == productId))
                throw new InvalidOperationException($"Product with ID {productId} is already in the promotion");

            // Add product to promotion
            promotion.Products.Add(new PromotionProduct
            {
                PromotionId = promotionId,
                ProductId = productId
            });

            await _context.SaveChangesAsync();

            // Use your custom mapping method
            return await MapPromotionToDto(promotion);
        }

        public async Task<PromotionDto> RemoveProductFromPromotionAsync(int promotionId, int productId)
        {
            var promotion = await _context.Promotions
                .Include(p => p.Products)
                .FirstOrDefaultAsync(p => p.Id == promotionId);

            if (promotion == null)
                throw new KeyNotFoundException($"Promotion with ID {promotionId} not found");

            // Find the promotion-product relationship to remove
            var promotionProduct = promotion.Products.FirstOrDefault(pp => pp.ProductId == productId);

            if (promotionProduct == null)
                throw new KeyNotFoundException($"Product with ID {productId} is not in the promotion");

            // Remove the relationship
            promotion.Products.Remove(promotionProduct);

            await _context.SaveChangesAsync();

            // Use your custom mapping method
            return await MapPromotionToDto(promotion);
        }

    }
}
