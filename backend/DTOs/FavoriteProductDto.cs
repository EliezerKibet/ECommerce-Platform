namespace ECommerce.API.DTOs
{
    // Create this in your DTOs folder
    public class FavoriteProductDto
    {
        public int ProductId { get; set; }
        public DateTime AddedAt { get; set; }
    }

    // Response when adding/removing from favorites
    public class FavoriteActionResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int TotalFavorites { get; set; }
    }
}

