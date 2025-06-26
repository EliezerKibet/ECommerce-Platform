// Interfaces/IEmailService.cs
using System.Threading.Tasks;

namespace ECommerce.API.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string email, string subject, string message);
    }
}