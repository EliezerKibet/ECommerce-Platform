// Services/EmailService.cs - Enhanced with debugging
using System;
using System.Threading.Tasks;
using ECommerce.API.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace ECommerce.API.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            try
            {
                _logger.LogInformation("=== EMAIL SERVICE DEBUG ===");
                _logger.LogInformation($"Attempting to send email to: {email}");
                _logger.LogInformation($"Subject: {subject}");

                var apiKey = _configuration["SendGrid:ApiKey"];
                var fromEmail = _configuration["SendGrid:FromEmail"];
                var fromName = _configuration["SendGrid:FromName"];

                _logger.LogInformation($"SendGrid API Key configured: {!string.IsNullOrEmpty(apiKey)}");
                _logger.LogInformation($"From Email: {fromEmail}");
                _logger.LogInformation($"From Name: {fromName}");

                if (string.IsNullOrEmpty(apiKey))
                {
                    _logger.LogWarning("SendGrid API Key is not configured, using mock email service");
                    await SendMockEmail(email, subject, htmlMessage);
                    return;
                }

                var client = new SendGridClient(apiKey);
                var from = new EmailAddress(fromEmail, fromName);
                var to = new EmailAddress(email);
                var msg = MailHelper.CreateSingleEmail(from, to, subject, null, htmlMessage);

                _logger.LogInformation("Sending email via SendGrid...");
                var response = await client.SendEmailAsync(msg);

                _logger.LogInformation($"SendGrid Response Status: {response.StatusCode}");
                _logger.LogInformation($"SendGrid Response Headers: {string.Join(", ", response.Headers?.Select(h => $"{h.Key}:{h.Value}") ?? new string[0])}");

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"✅ Email sent successfully to {email}");
                }
                else
                {
                    var body = await response.Body.ReadAsStringAsync();
                    _logger.LogError($"❌ SendGrid returned non-success status code {response.StatusCode} when sending to {email}");
                    _logger.LogError($"Response body: {body}");

                    // Fall back to mock email for development
                    _logger.LogWarning("Falling back to mock email service due to SendGrid error");
                    await SendMockEmail(email, subject, htmlMessage);
                }

                _logger.LogInformation("=== END EMAIL SERVICE DEBUG ===");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Failed to send email to {email}");
                _logger.LogError($"Exception details: {ex.Message}");

                // Fall back to mock email for development
                _logger.LogWarning("Falling back to mock email service due to exception");
                await SendMockEmail(email, subject, htmlMessage);
            }
        }

        private async Task SendMockEmail(string email, string subject, string htmlMessage)
        {
            _logger.LogInformation("=== MOCK EMAIL SERVICE (DEVELOPMENT) ===");
            _logger.LogInformation($"📧 To: {email}");
            _logger.LogInformation($"📧 Subject: {subject}");

            // Extract and display important links prominently
            if (htmlMessage.Contains("confirm-email") || htmlMessage.Contains("ConfirmEmail"))
            {
                var startIndex = htmlMessage.IndexOf("http");
                if (startIndex != -1)
                {
                    var endIndex = htmlMessage.IndexOf("'>", startIndex);
                    if (endIndex == -1) endIndex = htmlMessage.IndexOf("\"", startIndex + 4);
                    if (endIndex == -1) endIndex = htmlMessage.IndexOf(" ", startIndex);

                    if (endIndex != -1)
                    {
                        var confirmationLink = htmlMessage.Substring(startIndex, endIndex - startIndex);
                        _logger.LogWarning($"🔗 EMAIL CONFIRMATION LINK: {confirmationLink}");
                        Console.WriteLine($"\n🎯 COPY THIS LINK TO CONFIRM EMAIL:");
                        Console.WriteLine($"🔗 {confirmationLink}\n");
                        Console.WriteLine("👆 Click this link in your browser to confirm the email address\n");
                    }
                }
            }

            if (htmlMessage.Contains("reset-password") || htmlMessage.Contains("ResetPassword"))
            {
                var startIndex = htmlMessage.IndexOf("http");
                if (startIndex != -1)
                {
                    var endIndex = htmlMessage.IndexOf("'>", startIndex);
                    if (endIndex == -1) endIndex = htmlMessage.IndexOf("\"", startIndex + 4);
                    if (endIndex == -1) endIndex = htmlMessage.IndexOf(" ", startIndex);

                    if (endIndex != -1)
                    {
                        var resetLink = htmlMessage.Substring(startIndex, endIndex - startIndex);
                        _logger.LogWarning($"🔗 PASSWORD RESET LINK: {resetLink}");
                        Console.WriteLine($"\n🎯 COPY THIS LINK TO RESET PASSWORD:");
                        Console.WriteLine($"🔗 {resetLink}\n");
                        Console.WriteLine("👆 Click this link in your browser to reset your password\n");
                    }
                }
            }

            _logger.LogInformation("=== END MOCK EMAIL ===");

            // Simulate async operation
            await Task.Delay(50);

            _logger.LogInformation($"✅ Mock email processed successfully for {email}");
        }
    }
}