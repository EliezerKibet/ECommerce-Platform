using System.Collections.Generic;

namespace ECommerce.API.DTOs
{
    public class ProductRatingsSummaryDto
    {
        public int ProductId { get; set; }
        public int TotalReviews { get; set; }
        public double AverageRating { get; set; }
        public Dictionary<int, int> RatingBreakdown { get; set; } = new Dictionary<int, int>();
    }
}