using static ECommerce.API.DTOs.AppliedPromotionDto;

namespace ECommerce.API.DTOs
{
    public class ReceiptDto
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; }
        public DateTime OrderDate { get; set; }

        public string CustomerName { get; set; }
        public string ShippingAddressLine1 { get; set; }
        public string ShippingAddressLine2 { get; set; }
        public string ShippingCity { get; set; }
        public string ShippingState { get; set; }
        public string ShippingZipCode { get; set; }
        public string ShippingCountry { get; set; }
        public string PhoneNumber { get; set; }

        public List<ReceiptItemDto> Items { get; set; } = new List<ReceiptItemDto>();
        public decimal Subtotal { get; set; }
        public decimal ShippingCost { get; set; }
        public decimal Tax { get; set; }
        public decimal Total { get; set; }

        public decimal PromotionDiscount { get; set; } = 0;
        public decimal CouponDiscount { get; set; } = 0; // Rename from DiscountAmount for clarity
        public List<AppliedPromotionDto> AppliedPromotions { get; set; } = new();

        public string PaymentMethod { get; set; } = "Unofficial Payment";
        public string PaymentStatus { get; set; } = "Completed";
        public string OrderNotes { get; set; }
        public string ShippingMethod { get; set; }
        public string CouponCode { get; set; }
        public string OrderStatus { get; set; }
        public string EstimatedDelivery { get; set; }

        public decimal DiscountAmount { get; set; }

        public decimal CalculatedTotal => Subtotal + Tax + ShippingCost - PromotionDiscount - CouponDiscount;

        public decimal TotalSavings => PromotionDiscount + CouponDiscount;
    }

    public class AppliedPromotionDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal DiscountPercentage { get; set; }
        public string Type { get; set; } = string.Empty;
        public decimal AppliedDiscount { get; set; }
        public string ProductName { get; set; } = string.Empty;

        public class ReceiptItemDto
        {
            public string ProductName { get; set; }
            public string ProductImage { get; set; }
            public string CocoaPercentage { get; set; }
            public string Origin { get; set; }
            public decimal Price { get; set; }
            public int Quantity { get; set; }
            public decimal Subtotal { get; set; }
            public bool IsGiftWrapped { get; set; }

            public decimal OriginalPrice { get; set; }
            public decimal DiscountAmount { get; set; }
            public List<string> AppliedPromotionNames { get; set; } = new();
        }
    }
}