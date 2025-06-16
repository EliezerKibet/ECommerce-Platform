// DTOs/CartDto.cs
using System.ComponentModel.DataAnnotations;

namespace ECommerce.API.DTOs
{
    public class CartDto
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<CartItemDto> Items { get; set; } = new List<CartItemDto>();
        public decimal Subtotal { get; set; }
        public decimal Tax { get; set; }
        public decimal Total { get; set; }
        public int ItemCount { get; set; }
    }

    public class CartItemDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public string ProductImageUrl { get; set; }
        public decimal ProductPrice { get; set; }
        public int Quantity { get; set; }
        public decimal LineTotal { get; set; }
        public bool IsGiftWrapped { get; set; }
        public string GiftMessage { get; set; }
        public string CocoaPercentage { get; set; }
        public string Origin { get; set; }
    }

    public class AddToCartDto
    {
        [Required]
        public int ProductId { get; set; }

        [Required]
        [Range(1, 100)]
        public int Quantity { get; set; }

        public bool IsGiftWrapped { get; set; }

        [StringLength(200)]
        public string GiftMessage { get; set; }
    }

    public class UpdateCartItemDto
    {
        [Required]
        [Range(1, 100)]
        public int Quantity { get; set; }

        public bool IsGiftWrapped { get; set; }

        [StringLength(200)]
        public string GiftMessage { get; set; }
    }
}