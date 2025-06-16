namespace ECommerce.API.Models
{
    public class Cart
    {
        public int Id { get; set; }
        public string UserId { get; set; } // Can be null for guest carts
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
    }
}
