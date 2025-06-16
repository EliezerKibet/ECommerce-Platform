using System.ComponentModel.DataAnnotations;

namespace ECommerce.API.DTOs
{
    public class ValidateCouponDto
    {
        [Required]
        public string Code { get; set; }

        [Required]
        public decimal OrderAmount { get; set; }

        // Add this field to provide promotion context
        public decimal PromotionDiscount { get; set; } = 0;
    }
}