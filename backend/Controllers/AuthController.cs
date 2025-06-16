// Controllers/AuthController.cs
using ECommerce.API.Interfaces;
using ECommerce.API.Models;
using ECommerce.API.Services;
using ECommerce.API.ViewModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace ECommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;
        private readonly ICartService _cartService;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
             IEmailService emailService,
            IConfiguration configuration,
            ILogger<AuthController> logger,
            ICartService cartService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
            _cartService = cartService;
        }


        // Controllers/AuthController.cs
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterViewModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                FirstName = model.FirstName,
                LastName = model.LastName
                // Don't set EmailConfirmed to true - we want verification
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                // Add to Customer role
                await _userManager.AddToRoleAsync(user, "Customer");

                // Generate the email confirmation token
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

                // Create the confirmation link
                var callbackUrl = Url.Action(
                    "ConfirmEmail",
                    "Auth",
                    new { userId = user.Id, token = token },
                    protocol: HttpContext.Request.Scheme);

                // Build HTML email body
                var emailBody = $@"
            <html>
            <body>
                <h2>Welcome to Chocolate E-Commerce!</h2>
                <p>Thank you for registering. Please confirm your email by clicking the link below:</p>
                <p><a href='{callbackUrl}'>Confirm Email</a></p>
                <p>If you didn't register for an account, you can ignore this email.</p>
            </body>
            </html>";

                // Send the confirmation email
                await _emailService.SendEmailAsync(
                    model.Email,
                    "Confirm your Chocolate E-Commerce account",
                    emailBody);

                return Ok(new
                {
                    message = "Registration successful! Please check your email to confirm your account."
                });
            }

            return BadRequest(new { errors = result.Errors });
        }

        [HttpGet("confirm-email")]
        public async Task<IActionResult> ConfirmEmail(string userId, string token)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(token))
            {
                return BadRequest("User ID and token are required");
            }

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return NotFound($"Unable to load user with ID '{userId}'.");
            }

            var result = await _userManager.ConfirmEmailAsync(user, token);

            if (!result.Succeeded)
            {
                _logger.LogError("Email confirmation failed for user {UserId}. Errors: {Errors}",
                    userId, string.Join(", ", result.Errors.Select(e => e.Description)));

                return BadRequest("Error confirming your email. Please try again or contact support.");
            }

            return Ok(new { message = "Thank you for confirming your email. You can now log in to your account." });
        }

        [HttpPost("resend-confirmation")]
        public async Task<IActionResult> ResendConfirmationEmail(ResendConfirmationEmailViewModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                // For security reasons, don't reveal that the user doesn't exist
                return Ok(new { message = "If your email is registered, a confirmation link has been sent." });
            }

            if (user.EmailConfirmed)
            {
                return BadRequest(new { message = "This email is already confirmed." });
            }

            // Generate token and create confirmation link
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var callbackUrl = Url.Action(
                "ConfirmEmail",
                "Auth",
                new { userId = user.Id, token = token },
                protocol: HttpContext.Request.Scheme);

            // Build email body
            var emailBody = $@"
        <html>
        <body>
            <h2>Confirm your Chocolate E-Commerce account</h2>
            <p>Please confirm your email by clicking the link below:</p>
            <p><a href='{callbackUrl}'>Confirm Email</a></p>
            <p>If you didn't register for an account, you can ignore this email.</p>
        </body>
        </html>";

            // Send email
            await _emailService.SendEmailAsync(
                model.Email,
                "Confirm your Chocolate E-Commerce account",
                emailBody);

            return Ok(new { message = "If your email is registered, a confirmation link has been sent." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginViewModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
                return Unauthorized(new { message = "Invalid login attempt." });

            // Check if email is confirmed
            if (!user.EmailConfirmed)
            {
                return Unauthorized(new
                {
                    message = "You need to confirm your email before you can log in.",
                    requiresEmailConfirmation = true,
                    email = model.Email
                });
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);

            if (result.Succeeded)
            {
                // Get the guest ID from cookie if it exists
                string guestId = null;
                if (Request.Cookies.TryGetValue("GuestId", out string cookieGuestId))
                {
                    guestId = "guest-" + cookieGuestId;
                }

                // If there's a guest cart, migrate it to the user's account
                if (!string.IsNullOrEmpty(guestId))
                {
                    await _cartService.MergeCartsAsync(guestId, user.Id);

                    // Clear the guest ID cookie
                    Response.Cookies.Delete("GuestId");
                }

                var token = GenerateJwtToken(user);
                return Ok(new
                {
                    token = token,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        firstName = user.FirstName,
                        lastName = user.LastName
                    }
                });
            }

            return Unauthorized(new { message = "Invalid login attempt." });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordViewModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(model.Email);

            // Always return the same message whether user exists or not for security
            if (user == null)
                return Ok(new { message = "If your email is registered, you will receive a password reset link." });

            // Generate the password reset token
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            // Create the reset link - Change "ResetPassword" to "ResetPasswordPage" to match your action name
            var resetLink = Url.Action(
                "ResetPasswordPage", // <-- CHANGE THIS to match your actual action name
                "Auth",
                new { email = model.Email, token = token },
                protocol: HttpContext.Request.Scheme);

            // Build the email content
            var emailBody = $@"
        <html>
        <body>
            <h2>Reset Your Password</h2>
            <p>You have requested to reset your password for your Chocolate E-Commerce account.</p>
            <p>Please click the link below to reset your password:</p>
            <p><a href='{resetLink}'>Reset Password</a></p>
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p>This link will expire in 24 hours.</p>
        </body>
        </html>";

            try
            {
                // Send the email
                await _emailService.SendEmailAsync(
                    model.Email,
                    "Reset Your Chocolate E-Commerce Password",
                    emailBody);

                return Ok(new { message = "If your email is registered, you will receive a password reset link." });
            }
            catch (Exception ex)
            {
                // Log the error but don't expose it in the response
                _logger.LogError(ex, "Error sending password reset email to {Email}", model.Email);
                return Ok(new { message = "If your email is registered, you will receive a password reset link." });
            }
        }

        [HttpGet("reset-password")]
        public IActionResult ResetPasswordPage(string email, string token)
        {
            try
            {
                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(token))
                {
                    return BadRequest("Email and token are required");
                }

                // Log the parameters received
                _logger.LogInformation("Reset password page accessed with email: {Email}, token: {Token}", email, token);

                // Encode for HTML use but maintain the original values for the API call
                var encodedEmail = HttpUtility.HtmlEncode(email);
                var encodedToken = HttpUtility.HtmlEncode(token);

                // UPDATED HTML with correct redirect URL
                var html = $@"
<!DOCTYPE html>
<html>
<head>
    <title>Reset Your Password</title>
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <style>
        body {{ 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #1a1713 0%, #2a211c 50%, #1a1713 100%);
            min-height: 100vh;
            color: #f3d5a5;
        }}
        .container {{ 
            max-width: 500px; 
            margin: 40px auto; 
            padding: 30px; 
            border-radius: 16px; 
            background: rgba(26, 23, 19, 0.95);
            backdrop-filter: blur(12px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            border: 1px solid rgba(200, 155, 106, 0.3);
            border-radius: 12px;
            background: rgba(42, 33, 28, 0.9);
            color: #f3d5a5;
            font-size: 16px;
            transition: all 0.3s ease;
        }}
        input[type=""password""]:focus {{
            outline: none;
            border-color: #f8c15c;
            box-shadow: 0 0 0 2px rgba(248, 193, 92, 0.2);
        }}
        input[type=""password""]::placeholder {{
            color: rgba(200, 155, 106, 0.7);
        }}
        button {{ 
            background: linear-gradient(135deg, #c89b6a 0%, #f8c15c 100%);
            color: #1a1713; 
            padding: 16px 24px; 
            border: none; 
            border-radius: 12px;
            cursor: pointer; 
            width: 100%;
            font-size: 18px;
            font-weight: bold;
            transition: all 0.3s ease;
            transform: translateY(0);
        }}
        button:hover {{
            background: linear-gradient(135deg, #f8c15c 0%, #c89b6a 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        }}
        button:disabled {{
            opacity: 0.5;
            cursor: not-allowed;
            transform: translateY(0);
        }}
        .message {{
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 20px;
            font-weight: 500;
        }}
        .error {{ 
            color: #fecaca;
            background: rgba(220, 38, 38, 0.2);
            border: 1px solid rgba(220, 38, 38, 0.3);
            display: none;
        }}
        .success {{ 
            color: #bbf7d0;
            background: rgba(34, 197, 94, 0.2);
            border: 1px solid rgba(34, 197, 94, 0.3);
            display: none;
            text-align: center;
        }}
        .success a {{
            color: #f8c15c;
            text-decoration: none;
            font-weight: bold;
            transition: color 0.3s ease;
        }}
        .success a:hover {{
            color: #f3d5a5;
            text-decoration: underline;
        }}
        .loading {{
            display: none;
            text-align: center;
            padding: 20px;
        }}
        .spinner {{
            border: 4px solid rgba(200, 155, 106, 0.3);
            border-top: 4px solid #f8c15c;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }}
        @keyframes spin {{
            0% {{ transform: rotate(0deg); }}
            100% {{ transform: rotate(360deg); }}
        }}
        .password-requirements {{
            font-size: 12px;
            color: rgba(200, 155, 106, 0.7);
            margin-top: 8px;
        }}
        .back-link {{
            text-align: center;
            margin-top: 24px;
        }}
        .back-link a {{
            color: #c89b6a;
            text-decoration: none;
            font-size: 14px;
            transition: color 0.3s ease;
        }}
        .back-link a:hover {{
            color: #f8c15c;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='logo'>🍫</div>
        <h1>Reset Your Password</h1>
        
        <div id='loadingIndicator' class='loading'>
            <div class='spinner'></div>
            <p>Processing your request...</p>
        </div>
        
        <div id='errorMessage' class='message error'></div>
        
        <div id='successMessage' class='message success'>
            <h3>Password Reset Successful! 🎉</h3>
            <p>Your password has been reset successfully!</p>
            <p>You can now <a href='http://localhost:3000/auth/login'>sign in to your account</a> with your new password.</p>
        </div>
        
        <form id='resetForm'>
            <input type='hidden' id='email' name='email' value='{encodedEmail}' />
            <input type='hidden' id='token' name='token' value='{encodedToken}' />
            
            <div class='form-group'>
                <label for='password'>New Password</label>
                <input type='password' id='password' name='password' required placeholder='Enter your new password' />
                <div class='password-requirements'>
                    Password must be at least 6 characters long and include uppercase, lowercase, and numbers.
                </div>
            </div>
            
            <div class='form-group'>
                <label for='confirmPassword'>Confirm Password</label>
                <input type='password' id='confirmPassword' name='confirmPassword' required placeholder='Confirm your new password' />
            </div>
            
            <button type='submit'>Reset Password</button>
        </form>
        
        <div class='back-link'>
            <a href='http://localhost:3000/auth/login'>← Back to Login</a>
        </div>
    </div>
    
    <script>
        document.getElementById('resetForm').addEventListener('submit', function(e) {{
            e.preventDefault();
            
            // Show loading indicator and hide messages
            document.getElementById('loadingIndicator').style.display = 'block';
            document.getElementById('errorMessage').style.display = 'none';
            document.getElementById('successMessage').style.display = 'none';
            document.getElementById('resetForm').style.display = 'block';
            
            var password = document.getElementById('password').value;
            var confirmPassword = document.getElementById('confirmPassword').value;
            var errorMessage = document.getElementById('errorMessage');
            
            // Validate password match
            if (password !== confirmPassword) {{
                errorMessage.textContent = 'Passwords do not match';
                errorMessage.style.display = 'block';
                document.getElementById('loadingIndicator').style.display = 'none';
                return;
            }}
            
            // Validate password strength
            if (password.length < 6) {{
                errorMessage.textContent = 'Password must be at least 6 characters long';
                errorMessage.style.display = 'block';
                document.getElementById('loadingIndicator').style.display = 'none';
                return;
            }}
            
            // Prepare form data
            var formData = {{
                email: document.getElementById('email').value,
                token: document.getElementById('token').value,
                password: password,
                confirmPassword: confirmPassword
            }};
            
            // Submit to API
            fetch('/api/Auth/reset-password', {{
                method: 'POST',
                headers: {{
                    'Content-Type': 'application/json'
                }},
                body: JSON.stringify(formData)
            }})
            .then(response => {{
                console.log('Response status:', response.status);
                
                if (!response.ok) {{
                    if (response.status === 400) {{
                        return response.json().then(data => {{
                            throw new Error(data.message || data.errors || 'Invalid request');
                        }});
                    }}
                    throw new Error('Network response was not ok');
                }}
                return response.json();
            }})
            .then(data => {{
                document.getElementById('loadingIndicator').style.display = 'none';
                console.log('Reset password response:', data);
                
                if (data.message && data.message.includes('success')) {{
                    document.getElementById('resetForm').style.display = 'none';
                    document.getElementById('successMessage').style.display = 'block';
                    
                    // Auto redirect after 3 seconds
                    setTimeout(function() {{
                        window.location.href = 'http://localhost:3000/auth/login';
                    }}, 3000);
                }} else {{
                    throw new Error(data.message || 'Unknown error occurred');
                }}
            }})
            .catch(error => {{
                document.getElementById('loadingIndicator').style.display = 'none';
                console.error('Error:', error);
                
                errorMessage.textContent = error.message || 'An error occurred. Please try again.';
                errorMessage.style.display = 'block';
            }});
        }});
    </script>
</body>
</html>";

                return Content(html, "text/html");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rendering reset password page");
                return Content(@"
            <html>
            <body style='font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #1a1713; color: #f3d5a5;'>
                <h1>⚠️ Error</h1>
                <p>An error occurred processing your request.</p>
                <p><a href='http://localhost:3000/auth/forgot-password' style='color: #f8c15c;'>Request a new password reset</a></p>
            </body>
            </html>", "text/html");
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordViewModel model)
        {
            try
            {
                _logger.LogInformation("Password reset attempt for email: {Email}", model.Email);

                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();

                    _logger.LogWarning("Invalid model state in password reset: {Errors}", string.Join(", ", errors));

                    return BadRequest(new { message = "Validation failed", errors = errors });
                }

                var user = await _userManager.FindByEmailAsync(model.Email);

                if (user == null)
                {
                    _logger.LogWarning("Password reset attempted for non-existent user: {Email}", model.Email);
                    return BadRequest(new { message = "Invalid request" });
                }

                _logger.LogInformation("Attempting password reset with token (length: {Length})", model.Token?.Length ?? 0);

                // For debugging, log a portion of the token
                if (!string.IsNullOrEmpty(model.Token) && model.Token.Length > 10)
                {
                    _logger.LogInformation("Token starts with: {TokenStart}", model.Token.Substring(0, 10));
                }

                // Ensure token is properly processed (sometimes it needs URL decoding)
                string processedToken = model.Token;
                try
                {
                    // Try URL decoding if it might be needed
                    if (model.Token.Contains("%"))
                    {
                        processedToken = System.Web.HttpUtility.UrlDecode(model.Token);
                        _logger.LogInformation("Token was URL decoded");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error URL decoding token, using original");
                    // Continue with original token
                }

                var result = await _userManager.ResetPasswordAsync(user, processedToken, model.Password);

                if (result.Succeeded)
                {
                    _logger.LogInformation("Password reset successful for user: {Email}", model.Email);

                    try
                    {
                        // Send confirmation email
                        var emailBody = $@"
                    <html>
                    <body>
                        <h2>Password Reset Successful</h2>
                        <p>Your password for Chocolate E-Commerce has been successfully reset.</p>
                        <p>If you did not make this change, please contact our support team immediately.</p>
                    </body>
                    </html>";

                        await _emailService.SendEmailAsync(
                            model.Email,
                            "Your Password Has Been Reset",
                            emailBody);
                    }
                    catch (Exception ex)
                    {
                        // Log but don't fail the request if email sending fails
                        _logger.LogError(ex, "Error sending password reset confirmation email to {Email}", model.Email);
                    }

                    return Ok(new { message = "Password has been reset successfully. You can now log in with your new password." });
                }

                // Log detailed error information
                _logger.LogWarning("Password reset failed for user {Email}. Errors: {Errors}",
                    model.Email,
                    string.Join(", ", result.Errors.Select(e => $"{e.Code}: {e.Description}")));

                return BadRequest(new
                {
                    message = "Error resetting password",
                    errors = result.Errors.Select(e => e.Description).ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception during password reset for email: {Email}", model.Email ?? "unknown");
                return StatusCode(500, new { message = "An unexpected error occurred. Please try again." });
            }
        }

        private string GenerateJwtToken(ApplicationUser user)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            // Add roles to claims
            var userRoles = _userManager.GetRolesAsync(user).Result;
            foreach (var role in userRoles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.Now.AddDays(7);

            var token = new JwtSecurityToken(
                _configuration["Jwt:Issuer"],
                _configuration["Jwt:Audience"],
                claims,
                expires: expires,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}