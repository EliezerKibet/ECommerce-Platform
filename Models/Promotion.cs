using ECommerce.API.Models;

public class Promotion
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public decimal DiscountPercentage { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public string BannerImageUrl { get; set; }
    public PromotionType Type { get; set; } 
    public string ColorScheme { get; set; } 
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<PromotionProduct> Products { get; set; }
}

public enum PromotionType
{
    FlashSale = 1,
    Seasonal = 2,
    Holiday = 3,
    Clearance = 4,
    NewProduct = 5,
    BundleDeal = 6
}

public class PromotionProduct
{
    public int PromotionId { get; set; }
    public Promotion Promotion { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; }
}