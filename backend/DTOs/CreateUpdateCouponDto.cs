using System;
using System.ComponentModel.DataAnnotations;
namespace ECommerce.API.DTOs
{
    public class CreateUpdateCouponDto
    {
        [Required]
        [StringLength(20, MinimumLength = 3)]
        public string Code { get; set; }
        public string Description { get; set; }
        [Required]
        [RegularExpression("Percentage|FixedAmount", ErrorMessage = "Discount type must be 'Percentage' or 'FixedAmount'")]
        public string DiscountType { get; set; }
        [Required]
        [Range(0.01, 1000)]
        public decimal DiscountAmount { get; set; }
        [Range(0, 10000)]
        public decimal MinimumOrderAmount { get; set; }
        [Required]
        public DateTime StartDate { get; set; }
        [Required]
        public DateTime EndDate { get; set; }
        public int? UsageLimit { get; set; }
        public bool IsActive { get; set; } = true;
    }
}