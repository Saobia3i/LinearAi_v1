using Linear_v1.Models;
using Linear_v1.Models.ViewModels;
using Linear_v1.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;

namespace Linear_v1.Controllers
{
    public class AccountController : Controller
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IEmailService _emailService;
        private readonly ILogger<AccountController> _logger;

        public AccountController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IEmailService emailService,
            ILogger<AccountController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _emailService = emailService;
            _logger = logger;
        }

        // GET: /Account
        [HttpGet]
        public async Task<IActionResult> Index()
        {
            if (!User.Identity!.IsAuthenticated)
            {
                return Redirect("/login");
            }

            var user = await _userManager.GetUserAsync(User);
            if (user != null && await _userManager.IsInRoleAsync(user, "Admin"))
            {
                return Redirect("/admin");
            }

            return Redirect("/home");
        }

        // GET: /Account/Register
        [HttpGet]
        public IActionResult Register() =>
            User.Identity!.IsAuthenticated ? Redirect("/home") : Redirect("/signup");

        // POST: /Account/Register
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(RegisterViewModel model)
        {
            if (!ModelState.IsValid) return View(model);

            try
            {
                var existingUser = await _userManager.FindByEmailAsync(model.Email);
                if (existingUser != null)
                {
                    ModelState.AddModelError("Email", "An account already exists with this email.");
                    return View(model);
                }

                var user = new ApplicationUser
                {
                    FullName = model.FullName,
                    UserName = model.Email,
                    Email = model.Email,
                    EmailConfirmed = false
                };

                var result = await _userManager.CreateAsync(user, model.Password);
                if (!result.Succeeded)
                {
                    foreach (var err in result.Errors)
                        ModelState.AddModelError(string.Empty, err.Description);
                    return View(model);
                }

                await _userManager.AddToRoleAsync(user, "User");

                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                var confirmLink = Url.Action("ConfirmEmail", "Account",
                    new { userId = user.Id, token }, Request.Scheme)!;

                await _emailService.SendEmailConfirmationAsync(user.Email, user.FullName, confirmLink);

                _logger.LogInformation("New user registered: {Email}", user.Email);

                return RedirectToAction("RegisterSuccess", new { email = user.Email });
            }
            catch (RetryLimitExceededException ex)
            {
                _logger.LogError(ex, "Database unavailable during register for {Email}", model.Email);
                ModelState.AddModelError(string.Empty, "Service is temporarily unavailable. Please try again shortly.");
                return View(model);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database update failed during register for {Email}", model.Email);
                ModelState.AddModelError(string.Empty, "Could not complete registration right now. Please try again.");
                return View(model);
            }
            catch (NpgsqlException ex)
            {
                _logger.LogError(ex, "PostgreSQL error during register for {Email}", model.Email);
                ModelState.AddModelError(string.Empty, "Database connection problem. Please try again later.");
                return View(model);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Configuration/operation error during register for {Email}", model.Email);
                ModelState.AddModelError(string.Empty, "Registration completed partially, but a required service is unavailable. Please contact support.");
                return View(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during register for {Email}", model.Email);
                ModelState.AddModelError(string.Empty, "An unexpected error occurred. Please try again.");
                return View(model);
            }
        }

        // GET: /Account/RegisterSuccess
        [HttpGet]
        public IActionResult RegisterSuccess(string email)
        {
            var query = string.IsNullOrWhiteSpace(email)
                ? string.Empty
                : $"?email={Uri.EscapeDataString(email)}";

            return Redirect($"/login{query}");
        }

        // GET: /Account/ConfirmEmail
        [HttpGet]
        public async Task<IActionResult> ConfirmEmail(string userId, string token)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(token))
                return Redirect("/confirm-email?success=false&message=Invalid%20confirmation%20link.");

            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                    return Redirect("/confirm-email?success=false&message=User%20not%20found.");

                var result = await _userManager.ConfirmEmailAsync(user, token);
                if (result.Succeeded)
                    return Redirect("/confirm-email?success=true");

                var error = result.Errors.FirstOrDefault()?.Description
                    ?? "The link has expired or is invalid.";
                return Redirect($"/confirm-email?success=false&message={Uri.EscapeDataString(error)}");
            }
            catch (RetryLimitExceededException ex)
            {
                _logger.LogError(ex, "Database unavailable during email confirmation for userId {UserId}", userId);
                return Redirect("/confirm-email?success=false&message=Service%20is%20temporarily%20unavailable.%20Please%20try%20again%20shortly.");
            }
            catch (NpgsqlException ex)
            {
                _logger.LogError(ex, "PostgreSQL error during email confirmation for userId {UserId}", userId);
                return Redirect("/confirm-email?success=false&message=Database%20connection%20problem.%20Please%20try%20again%20later.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during email confirmation for userId {UserId}", userId);
                return Redirect("/confirm-email?success=false&message=An%20unexpected%20error%20occurred.%20Please%20try%20again.");
            }
        }

        // GET: /Account/Login
        [HttpGet]
        public IActionResult Login(string? returnUrl = null)
        {
            if (User.Identity!.IsAuthenticated) return Redirect("/home");

            var query = string.IsNullOrWhiteSpace(returnUrl)
                ? string.Empty
                : $"?returnUrl={Uri.EscapeDataString(returnUrl)}";

            return Redirect($"/login{query}");
        }

        // POST: /Account/Login
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
        {
            if (!ModelState.IsValid) return View(model);

            try
            {
                var user = await _userManager.FindByEmailAsync(model.Email);
                if (user == null)
                {
                    ModelState.AddModelError(string.Empty, "Invalid email or password.");
                    return View(model);
                }

                if (!user.EmailConfirmed)
                {
                    ModelState.AddModelError(string.Empty, "Please verify your email first.");
                    return View(model);
                }

                if (!user.IsActive)
                {
                    ModelState.AddModelError(string.Empty, "Your account has been deactivated.");
                    return View(model);
                }

                var result = await _signInManager.PasswordSignInAsync(
                    user, model.Password, model.RememberMe, lockoutOnFailure: true);

                if (result.Succeeded)
                {
                    _logger.LogInformation("User logged in: {Email}", model.Email);

                    if (await _userManager.IsInRoleAsync(user, "Admin"))
                        return RedirectToAction("Index", "Admin");

                    return LocalRedirect(returnUrl ?? "/User/Index");
                }

                if (result.IsLockedOut)
                {
                    ModelState.AddModelError(string.Empty, "Your account is temporarily locked. Please try again later.");
                    return View(model);
                }

                ModelState.AddModelError(string.Empty, "Invalid email or password.");
                return View(model);
            }
            catch (RetryLimitExceededException ex)
            {
                _logger.LogError(ex, "Database unavailable during login for {Email}", model.Email);
                ModelState.AddModelError(string.Empty, "Service is temporarily unavailable. Please try again shortly.");
                return View(model);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database update failure during login for {Email}", model.Email);
                ModelState.AddModelError(string.Empty, "Could not process login right now. Please try again.");
                return View(model);
            }
            catch (NpgsqlException ex)
            {
                _logger.LogError(ex, "PostgreSQL error during login for {Email}", model.Email);
                ModelState.AddModelError(string.Empty, "Database connection problem. Please try again later.");
                return View(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during login for {Email}", model.Email);
                ModelState.AddModelError(string.Empty, "An unexpected error occurred. Please try again.");
                return View(model);
            }
        }

        // POST: /Account/Logout
        [HttpPost]
        [Authorize]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            try
            {
                await _signInManager.SignOutAsync();
                return RedirectToAction("Login");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout.");
                TempData["Info"] = "Could not sign out right now. Please try again.";
                return RedirectToAction("Login");
            }
        }

        // GET: /Account/AccessDenied
        [HttpGet]
        public IActionResult AccessDenied() => Redirect("/home");
    }
}