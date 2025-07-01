using System.ComponentModel.DataAnnotations.Schema;
namespace ECommerce.API.Models
{
    public class Order
    {
        public int Id { get; set; }
        public string UserId { get; set; } 
        public string? OrderNumber { get; set; } // Make nullable with ?
        public DateTime OrderDate { get; set; } // This can stay non-nullable
        public decimal TotalAmount { get; set; } // This can stay non-nullable
        public string? Status { get; set; } // Make nullable
    
        public string? CustomerEmail { get; set; } // Make nullable
    
        public string? ShippingName { get; set; } // Make nullable
        public string? ShippingAddressLine1 { get; set; } // Make nullable
        public string? ShippingAddressLine2 { get; set; } // Make nullable
        public string? ShippingCity { get; set; } // Make nullable
        public string? ShippingState { get; set; } // Make nullable
        public string? ShippingZipCode { get; set; } // Make nullable
        public string? ShippingCountry { get; set; } // Make nullable
        public string? ShippingPhoneNumber { get; set; } // Make nullable
    
        public string? PaymentMethod { get; set; } // Make nullable
        public string? PaymentStatus { get; set; } // Make nullable
    
        public string? ShippingMethod { get; set; } // Make nullable
        public decimal ShippingCost { get; set; } // This can stay non-nullable
        public decimal Subtotal { get; set; } // This can stay non-nullable
        public decimal Tax { get; set; } // This can stay non-nullable
        public string? CouponCode { get; set; } // Make nullable
        public decimal DiscountAmount { get; set; } // This can stay non-nullable
        public string? OrderNotes { get; set; } // Make nullable

        public virtual ApplicationUser User { get; set; }  // Navigation to User
        public List<OrderItem>? OrderItems { get; set; } // Make nullable
    }
}