// DTOs/CouponValidationResultDto.cs
namespace ECommerce.API.DTOs
{
    public class CouponValidationResultDto
    {
        public bool IsValid { get; set; }
        public string Message { get; set; }
        public CouponDto Coupon { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }
    }
}