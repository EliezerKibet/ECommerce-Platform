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
            if (!context.User.Identity.IsAuthenticated && !context.Request.Cookies.ContainsKey("GuestId"))
            {
                string guestId = Guid.NewGuid().ToString();

                context.Response.Cookies.Append("GuestId", guestId, new CookieOptions
                {
                    HttpOnly = true,
                    Expires = DateTime.UtcNow.AddDays(30),  
                    SameSite = SameSiteMode.Lax,
                    IsEssential = true
                });
            }

            await _next(context);
        }
    }

    public static class GuestCartMiddlewareExtensions
    {
        public static IApplicationBuilder UseGuestCart(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<GuestCartMiddleware>();
        }
    }
}