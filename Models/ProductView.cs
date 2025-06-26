namespace ECommerce.API.Models
{
    public class ProductView
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public Product Product { get; set; }
        public string UserId { get; set; }
        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
        public string SessionId { get; set; }
        public string IpAddress { get; set; }
        public string ReferrerUrl { get; set; }
    }
}