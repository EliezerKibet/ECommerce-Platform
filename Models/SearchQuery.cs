namespace ECommerce.API.Models
{
    public class SearchQuery
    {
        public int Id { get; set; }
        public string Query { get; set; }
        public string UserId { get; set; }
        public string GuestId { get; set; } 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int ResultCount { get; set; }
        public string Filters { get; set; } 
    }
}
