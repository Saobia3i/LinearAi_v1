using Linear_v1.Infrastructure;
using Linear_v1.Models;
using Linear_v1.Models.ViewModels;
using Linear_v1.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Linear_v1.Controllers.Api
{
    [Route("api/auth")]
    [ApiController]
    [EnableRateLimiting(RateLimitPolicies.Auth)]
    public class AuthApiController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IEmailService _emailService;

        public AuthApiController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IEmailService emailService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _emailService = emailService;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterViewModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(new
                {
                    success = false,
                    errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                });

            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null)
                return Conflict(new { success = false, message = "Email already registered." });

            var user = new ApplicationUser
            {
                FullName = model.FullName,
                UserName = model.Email,
                Email = model.Email,
                EmailConfirmed = false,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return BadRequest(new { success = false, errors = result.Errors.Select(e => e.Description) });

            await _userManager.AddToRoleAsync(user, "User");

            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var encodedToken = Uri.EscapeDataString(token);
            var config = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var appBaseUrl = config["App:BaseUrl"]?.TrimEnd('/')
                ?? $"{Request.Scheme}://{Request.Host}";
            var confirmLink = $"{appBaseUrl}/Account/ConfirmEmail?userId={user.Id}&token={encodedToken}";

            string message;
            try
            {
                await _emailService.SendEmailConfirmationAsync(user.Email, user.FullName, confirmLink);
                message = "Registration successful. Please check your email to confirm your account.";
            }
            catch (Exception ex)
            {
                var logger = HttpContext.RequestServices.GetRequiredService<ILogger<AuthApiController>>();
                logger.LogError(ex, "Failed to send confirmation email to {Email}", user.Email);
                message = $"Registration successful, but we could not send the confirmation email. Please contact support or use this link to confirm: {confirmLink}";
            }

            return Ok(new
            {
                success = true,
                message,
                email = user.Email
            });
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginViewModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(new
                {
                    success = false,
                    errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                });

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return Unauthorized(new { success = false, message = "Invalid email or password." });

            if (!user.IsActive)
                return Unauthorized(new { success = false, message = "Account is deactivated." });

            var result = await _signInManager.PasswordSignInAsync(
                user, model.Password, model.RememberMe, lockoutOnFailure: true);

            if (result.Succeeded)
            {
                var roles = await _userManager.GetRolesAsync(user);
                return Ok(new
                {
                    success = true,
                    message = "Login successful.",
                    user = new
                    {
                        id = user.Id,
                        fullName = user.FullName,
                        email = user.Email,
                        role = roles.FirstOrDefault()
                    }
                });
            }

            if (result.IsLockedOut)
                return StatusCode(423, new { success = false, message = "Account locked. Try again later." });

            return Unauthorized(new { success = false, message = "Invalid email or password." });
        }

        // GET: api/auth/me
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized(new { success = false, message = "User not authenticated." });
            }

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                success = true,
                data = new
                {
                    id = user.Id,
                    fullName = user.FullName,
                    email = user.Email,
                    role = roles.FirstOrDefault() ?? "User"
                }
            });
        }

        // POST: api/auth/logout
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok(new { success = true, message = "Logged out successfully." });
        }
    }
}