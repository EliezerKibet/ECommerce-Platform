using System.ComponentModel.DataAnnotations;

namespace ECommerce.API.DTOs
{
    public class CheckoutDto
    {
        [Required]
        public ShippingAddressDto? ShippingAddress { get; set; }

        public BillingInfoDto BillingInfo { get; set; }

        public string OrderNotes { get; set; }

        public string CouponCode { get; set; }

        public string? ShippingMethod { get; set; } = "standard";

        // Add CustomerEmail property for order confirmation emails
        public string CustomerEmail { get; set; }

        // New properties
        public int? SavedAddressId { get; set; }
        public bool SaveAddress { get; set; } = false;
    }

    // DTOs/ShippingAddressDto.cs
    public class ShippingAddressDto
    {
        public int Id { get; set; }

        [Required]
        public string FullName { get; set; }

        [Required]
        public string AddressLine1 { get; set; }

        public string? AddressLine2 { get; set; }

        [Required]
        public string City { get; set; }

        [Required]
        public string State { get; set; }

        [Required]
        public string ZipCode { get; set; }

        [Required]
        public string Country { get; set; }

        [Required]
        public string PhoneNumber { get; set; }

        public bool IsDefault { get; set; }

        public int UseCount { get; set; }

        public string? UserId { get; set; }

        public string? Email { get; set; } // Optional email field for shipping address
    }

    public class BillingInfoDto
    {
        // Add a new property for payment method type
        public string PaymentMethod { get; set; } = "cod"; // Default to "cod"

        // Only needed for card payments
        public string PaymentMethodId { get; set; }
    }
}