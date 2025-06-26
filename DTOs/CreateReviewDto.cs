using System.ComponentModel.DataAnnotations;

namespace ECommerce.API.DTOs
{
    public class CreateReviewDto
    {
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [Required]
        [StringLength(100)]
        public string Title { get; set; }

        [Required]
        [StringLength(1000)]
        public string Comment { get; set; }
    }
}