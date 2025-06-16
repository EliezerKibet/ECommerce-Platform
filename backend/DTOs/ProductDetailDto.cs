// DTOs/ProductDetailDto.cs
using System.Collections.Generic;

namespace ECommerce.API.DTOs
{
    public class ProductDetailDto
    {
        public ProductDto Product { get; set; }
        public List<ReviewDto> Reviews { get; set; } = new List<ReviewDto>();
        public ProductRatingsSummaryDto RatingSummary { get; set; }
    }
}