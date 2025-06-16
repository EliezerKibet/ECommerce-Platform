// Models/CartItem.cs
namespace ECommerce.API.Models
{
    public class CartItem
    {
        public int Id { get; set; }
        public int CartId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Cart Cart { get; set; }
        public Product Product { get; set; }

        // Chocolate-specific options
        public bool IsGiftWrapped { get; set; }
        public string GiftMessage { get; set; }
    }
}