namespace ECommerce.API.DTOs
{
    public class FavoriteProductDto
    {
        public int ProductId { get; set; }
        public DateTime AddedAt { get; set; }
    }

    public class FavoriteActionResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int TotalFavorites { get; set; }
    }
}

