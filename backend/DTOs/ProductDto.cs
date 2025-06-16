// DTOs/ProductDto.cs
using System.ComponentModel.DataAnnotations;

public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public string ImageUrl { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }

    // Chocolate-specific properties
    public string CocoaPercentage { get; set; }
    public string Origin { get; set; }
    public string FlavorNotes { get; set; }
    public bool IsOrganic { get; set; }
    public bool IsFairTrade { get; set; }
    public string Ingredients { get; set; }
    public int WeightInGrams { get; set; }
    public string AllergenInfo { get; set; }
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public bool IsVisible { get; set; }
}

public class ProductCreateUpdateDto
{
    [Required(ErrorMessage = "Product name is required")]
    [StringLength(200, ErrorMessage = "Product name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Product description is required")]
    [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Price is required")]
    [Range(0.01, 10000, ErrorMessage = "Price must be between 0.01 and 10000")]
    public decimal Price { get; set; }

    [Required(ErrorMessage = "Stock quantity is required")]
    [Range(0, 10000, ErrorMessage = "Stock quantity must be between 0 and 10000")]
    public int StockQuantity { get; set; }

    [Required(ErrorMessage = "Category is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Please select a valid category")]
    public int CategoryId { get; set; }

    [Required(ErrorMessage = "Weight is required")]
    [Range(1, 10000, ErrorMessage = "Weight must be between 1 and 10000 grams")]
    public int WeightInGrams { get; set; }

    // Make Image optional by removing [Required] attribute
    public IFormFile? Image { get; set; }

    // Optional chocolate-specific properties
    [Required(ErrorMessage = "Cocoa percentage is required")]
    [StringLength(100, ErrorMessage = "Cocoa percentage cannot exceed 100 characters")]
    public string CocoaPercentage { get; set; }

    [StringLength(200, ErrorMessage = "Origin cannot exceed 200 characters")]
    public string? Origin { get; set; }

    [StringLength(1000, ErrorMessage = "Flavor notes cannot exceed 1000 characters")]
    public string? FlavorNotes { get; set; }

    public bool IsOrganic { get; set; } = false;

    public bool IsFairTrade { get; set; } = false;

    [StringLength(2000, ErrorMessage = "Ingredients cannot exceed 2000 characters")]
    public string? Ingredients { get; set; }

    [StringLength(1000, ErrorMessage = "Allergen info cannot exceed 1000 characters")]
    public string? AllergenInfo { get; set; }
    public bool IsVisible { get; set; } = true; // Default to visible
}