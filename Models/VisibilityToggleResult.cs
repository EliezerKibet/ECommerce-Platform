// New file: VisibilityToggleResult.cs
namespace ECommerce.API.Models
{
    public class VisibilityToggleResult
    {
        public bool Success { get; set; }
        public string Error { get; set; }
        public string Message { get; set; }
        public bool IsVisible { get; set; }
    }
}