using System;

namespace ECommerce.API.DTOs
{
    public class CouponDto
    {
        public int Id { get; set; }
        public string Code { get; set; }
        public string Description { get; set; }
        public string DiscountType { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal MinimumOrderAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? UsageLimit { get; set; }
        public int TimesUsed { get; set; }
        public bool IsActive { get; set; }
    }
}