
using Microsoft.AspNetCore.Identity;

namespace ECommerce.API.Models
{
    // Models/ApplicationUser.cs
    public class ApplicationUser : IdentityUser
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateTime RegisteredDate { get; set; } = DateTime.UtcNow;
        public ICollection<Order> Orders { get; set; }
    }
}
