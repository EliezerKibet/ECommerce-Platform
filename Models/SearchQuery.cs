namespace ECommerce.API.Models
{
    // Models/SearchQuery.cs
    public class SearchQuery
    {
        public int Id { get; set; }
        public string Query { get; set; }
        public string UserId { get; set; } // Optional, for logged in users
        public string GuestId { get; set; } // For guest users
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int ResultCount { get; set; }
        public string Filters { get; set; } // JSON string of applied filters
    }
}
