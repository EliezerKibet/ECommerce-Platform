// Fixed DTOs/PromotionDtos.cs
using System.ComponentModel.DataAnnotations;

public class PromotionDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public decimal DiscountPercentage { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
    public string BannerImageUrl { get; set; }
    public PromotionType Type { get; set; }
    public string ColorScheme { get; set; }
    public double TimeRemaining { get; set; }
    public List<ProductDto> Products { get; set; }
}

public class CreateUpdatePromotionDto : IValidatableObject
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
    public string Name { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Discount percentage is required")]
    [Range(0, 100, ErrorMessage = "Discount percentage must be between 0 and 100")]
    public decimal DiscountPercentage { get; set; }

    [Required(ErrorMessage = "Start date is required")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "End date is required")]
    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; } = true;

    public string? BannerImageUrl { get; set; }

    public PromotionType Type { get; set; } = PromotionType.FlashSale;

    [StringLength(20, ErrorMessage = "Color scheme cannot exceed 20 characters")]
    public string? ColorScheme { get; set; }

    public List<int> ProductIds { get; set; } = new List<int>();

    // ✅ SMART VALIDATION - Only validates past dates for NEW promotions
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        // Always validate that end date is after start date
        if (EndDate <= StartDate)
        {
            yield return new ValidationResult(
                "End date must be after start date",
                new[] { nameof(EndDate) }
            );
        }

        // ✅ FIXED: Only validate past start dates for NEW promotions (not updates)
        var httpContext = validationContext.GetService<IHttpContextAccessor>()?.HttpContext;
        var isUpdate = httpContext?.Request?.Method == "PUT";

        if (!isUpdate && StartDate < DateTime.Today)
        {
            yield return new ValidationResult(
                "Start date cannot be in the past for new promotions",
                new[] { nameof(StartDate) }
            );
        }

        // Validate product IDs
        if (ProductIds == null || ProductIds.Count == 0)
        {
            yield return new ValidationResult(
                "At least one product must be selected",
                new[] { nameof(ProductIds) }
            );
        }
    }
}

public class PromotionProductDto
{
    public ProductDto Product { get; set; }
    public decimal OriginalPrice { get; set; }
    public decimal DiscountedPrice { get; set; }
    public decimal SavingsAmount { get; set; }
    public decimal SavingsPercentage { get; set; }
}