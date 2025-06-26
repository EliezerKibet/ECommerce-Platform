// DTOs/CategoryDto.cs
using System.ComponentModel.DataAnnotations;

namespace ECommerce.API.DTOs
{
    // DTO for viewing categories
    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
    }

    // DTO for creating/updating categories
    public class CategoryCreateUpdateDto
    {
        [Required]
        [StringLength(50)]
        public string Name { get; set; }

        public string Description { get; set; }
    }
}