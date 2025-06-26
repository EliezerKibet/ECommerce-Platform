using System;

namespace ECommerce.API.DTOs
{
    public class ReviewDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public int Rating { get; set; }
        public string Title { get; set; }
        public string Comment { get; set; }
        public bool IsVerifiedPurchase { get; set; }
        public bool IsApproved { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class AdminReviewDto : ReviewDto
    {
        public string ProductName { get; set; }
        public string ApprovalStatus => IsApproved ? "Approved" : "Pending";
    }

    public class ReviewApprovalDto
    {
        public string Reason { get; set; }
    }
}