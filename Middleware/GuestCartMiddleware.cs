// Middleware/GuestCartMiddleware.cs
namespace ECommerce.API.Middleware
{
    public class GuestCartMiddleware
    {
        private readonly RequestDelegate _next;

        public GuestCartMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Check if user is not authenticated and doesn't have a guest ID cookie
            if (!context.User.Identity.IsAuthenticated && !context.Request.Cookies.ContainsKey("GuestId"))
            {
                // Generate a new guest ID
                string guestId = Guid.NewGuid().ToString();

                // Add guest ID cookie
                context.Response.Cookies.Append("GuestId", guestId, new CookieOptions
                {
                    HttpOnly = true,
                    Expires = DateTime.UtcNow.AddDays(30),  // Expires in 30 days
                    SameSite = SameSiteMode.Lax,
                    IsEssential = true
                });
            }

            await _next(context);
        }
    }

    // Extension method for middleware registration
    public static class GuestCartMiddlewareExtensions
    {
        public static IApplicationBuilder UseGuestCart(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<GuestCartMiddleware>();
        }
    }
}