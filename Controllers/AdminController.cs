using Linear_v1.Data;
using Linear_v1.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Linear_v1.Controllers
{
    [Authorize(Roles = "Admin")]
    public class AdminController : Controller
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _db;
        private readonly ILogger<AdminController> _logger;

        public AdminController(UserManager<ApplicationUser> userManager, ApplicationDbContext db, ILogger<AdminController> logger)
        {
            _userManager = userManager;
            _db = db;
            _logger = logger;
        }

        // GET: /Admin/Index
        public async Task<IActionResult> Index()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                var totalUsers = await _userManager.Users.CountAsync();
                var totalOrders = await _db.Orders.CountAsync();
                var pendingOrders = await _db.Orders.CountAsync(o => o.PaymentStatus == PaymentStatus.Pending);

                ViewBag.TotalUsers = totalUsers;
                ViewBag.TotalOrders = totalOrders;
                ViewBag.PendingOrders = pendingOrders;

                return View(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load admin dashboard data");
                TempData["Error"] = "Unable to connect to database. Please check your connection.";
                return View();
            }
        }

        // GET: /Admin/Orders
        public async Task<IActionResult> Orders()
        {
            try
            {
                var orders = await _db.Orders
                    .Include(o => o.User)
                    .Include(o => o.Product)
                    .OrderByDescending(o => o.OrderDate)
                    .ToListAsync();
                return View(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load orders");
                TempData["Error"] = "Unable to load orders. Please check your database connection.";
                return View(new List<Order>());
            }
        }

        // POST: /Admin/UpdatePaymentStatus
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdatePaymentStatus(int orderId, PaymentStatus status)
        {
            try
            {
                var order = await _db.Orders.FindAsync(orderId);
                if (order == null) return NotFound();

                order.PaymentStatus = status;
                await _db.SaveChangesAsync();

                TempData["Success"] = "Payment status updated.";
                return RedirectToAction("Orders");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update payment status for order {OrderId}", orderId);
                TempData["Error"] = "Failed to update payment status. Database connection error.";
                return RedirectToAction("Orders");
            }
        }

        // GET: /Admin/Products
        public async Task<IActionResult> Products()
        {
            try
            {
                var products = await _db.Products.ToListAsync();
                return View(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load products");
                TempData["Error"] = "Unable to load products. Please check your database connection.";
                return View(new List<Product>());
            }
        }

        // GET: /Admin/AddProduct
        public IActionResult AddProduct() => View();

        // POST: /Admin/AddProduct
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddProduct(Product model)
        {
            if (!ModelState.IsValid) return View(model);

            try
            {
                model.CreatedAt = DateTime.UtcNow;
                model.IsActive = true;
                _db.Products.Add(model);
                await _db.SaveChangesAsync();

                TempData["Success"] = "Product added successfully.";
                return RedirectToAction("Products");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to add product {ProductTitle}", model.Title);
                TempData["Error"] = "Failed to add product. Database connection error.";
                return View(model);
            }
        }

        // GET: /Admin/EditProduct/5
        public async Task<IActionResult> EditProduct(int id)
        {
            try
            {
                var product = await _db.Products.FindAsync(id);
                if (product == null) return NotFound();
                return View(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load product {ProductId} for editing", id);
                TempData["Error"] = "Unable to load product. Database connection error.";
                return RedirectToAction("Products");
            }
        }

        // POST: /Admin/EditProduct
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditProduct(Product model)
        {
            if (!ModelState.IsValid) return View(model);

            try
            {
                var product = await _db.Products.FindAsync(model.Id);
                if (product == null) return NotFound();

                product.Title = model.Title;
                product.ShortDescription = model.ShortDescription;
                product.Price = model.Price;
                product.IsActive = model.IsActive;

                await _db.SaveChangesAsync();
                TempData["Success"] = "Product updated successfully.";
                return RedirectToAction("Products");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update product {ProductId}", model.Id);
                TempData["Error"] = "Failed to update product. Database connection error.";
                return View(model);
            }
        }

        // POST: /Admin/DeleteProduct
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            try
            {
                var product = await _db.Products.FindAsync(id);
                if (product == null) return NotFound();

                product.IsActive = false;
                await _db.SaveChangesAsync();

                TempData["Success"] = "Product deleted successfully.";
                return RedirectToAction("Products");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete product {ProductId}", id);
                TempData["Error"] = "Failed to delete product. Database connection error.";
                return RedirectToAction("Products");
            }
        }

        // ── Subscription Management ──

        // GET: /Admin/ManageSubscriptions/5
        public async Task<IActionResult> ManageSubscriptions(int productId)
        {
            try
            {
                var product = await _db.Products
                    .Include(p => p.Subscriptions)
                    .FirstOrDefaultAsync(p => p.Id == productId);

                if (product == null) return NotFound();
                return View(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load subscriptions for product {ProductId}", productId);
                TempData["Error"] = "Unable to load subscriptions. Database connection error.";
                return RedirectToAction("Products");
            }
        }

        // POST: /Admin/SaveSubscription
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SaveSubscription(
            int productId, int durationMonths, decimal price, decimal discountPercent)
        {
            try
            {
                var existing = await _db.ProductSubscriptions
                    .FirstOrDefaultAsync(s =>
                        s.ProductId == productId && s.DurationMonths == durationMonths);

                if (existing != null)
                {
                    existing.Price = price;
                    existing.DiscountPercent = discountPercent;
                    existing.IsActive = true;
                }
                else
                {
                    _db.ProductSubscriptions.Add(new ProductSubscription
                    {
                        ProductId = productId,
                        DurationMonths = durationMonths,
                        Price = price,
                        DiscountPercent = discountPercent,
                        IsActive = true
                    });
                }

                await _db.SaveChangesAsync();
                TempData["Success"] = $"{durationMonths}-month plan saved.";
                return RedirectToAction("ManageSubscriptions", new { productId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save subscription for product {ProductId}", productId);
                TempData["Error"] = "Failed to save subscription. Database connection error.";
                return RedirectToAction("ManageSubscriptions", new { productId });
            }
        }

        // POST: /Admin/DeleteSubscription
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteSubscription(int id)
        {
            try
            {
                var sub = await _db.ProductSubscriptions.FindAsync(id);
                if (sub == null) return NotFound();

                _db.ProductSubscriptions.Remove(sub);
                await _db.SaveChangesAsync();

                TempData["Success"] = "Subscription plan deleted.";
                return RedirectToAction("ManageSubscriptions", new { productId = sub.ProductId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete subscription {SubscriptionId}", id);
                TempData["Error"] = "Failed to delete subscription. Database connection error.";
                return RedirectToAction("Vouchers");
            }
        }

        // ── Voucher Management ──

        // GET: /Admin/Vouchers
        public async Task<IActionResult> Vouchers()
        {
            try
            {
                var vouchers = await _db.Vouchers
                    .OrderByDescending(v => v.CreatedAt)
                    .ToListAsync();
                return View(vouchers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load vouchers");
                TempData["Error"] = "Unable to load vouchers. Database connection error.";
                return View(new List<Voucher>());
            }
        }

        // GET: /Admin/AddVoucher
        public IActionResult AddVoucher() => View();

        // POST: /Admin/AddVoucher
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddVoucher(Voucher model)
        {
            if (!ModelState.IsValid) return View(model);

            try
            {
                model.Code = model.Code.ToUpper().Trim();

                if (await _db.Vouchers.AnyAsync(v => v.Code == model.Code))
                {
                    ModelState.AddModelError("Code", "This code already exists.");
                    return View(model);
                }

                model.CreatedAt = DateTime.UtcNow;
                model.IsActive = true;
                model.UsedCount = 0;

                _db.Vouchers.Add(model);
                await _db.SaveChangesAsync();

                TempData["Success"] = $"Voucher '{model.Code}' created!";
                return RedirectToAction("Vouchers");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to add voucher {VoucherCode}", model.Code);
                TempData["Error"] = "Failed to add voucher. Database connection error.";
                return View(model);
            }
        }

        // POST: /Admin/ToggleVoucher
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ToggleVoucher(int id)
        {
            try
            {
                var voucher = await _db.Vouchers.FindAsync(id);
                if (voucher == null) return NotFound();

                voucher.IsActive = !voucher.IsActive;
                await _db.SaveChangesAsync();

                TempData["Success"] = $"Voucher {(voucher.IsActive ? "activated" : "deactivated")}.";
                return RedirectToAction("Vouchers");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to toggle voucher {VoucherId}", id);
                TempData["Error"] = "Failed to update voucher. Database connection error.";
                return RedirectToAction("Vouchers");
            }
        }
    }
}
