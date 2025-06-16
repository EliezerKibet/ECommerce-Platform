namespace ECommerce.API.Models
{
    // Models/Product.cs
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public string ImageUrl { get; set; }
        public int CategoryId { get; set; }
        public Category Category { get; set; }

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
        public bool IsVisible { get; set; } = true; // Default to visible
        // Add to your Product.cs model
        public List<PromotionProduct> Promotions { get; set; } = new List<PromotionProduct>();
    }
}
