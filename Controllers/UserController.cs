using Linear_v1.Data;
using Linear_v1.Models;
using Linear_v1.Models.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
namespace Linear_v1.Controllers
{
    [Authorize(Roles = "User,Admin")]
    public class UserController : Controller
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _db;

        public UserController(UserManager<ApplicationUser> userManager, ApplicationDbContext db)
        {
            _userManager = userManager;
            _db = db;
        }

        // GET: /User/Index
        public async Task<IActionResult> Index()
        {
            var user = await _userManager.GetUserAsync(User);
            return View(user);
        }

        // GET: /User/Products
        public async Task<IActionResult> Products()
        {
            var products = await _db.Products
                .Where(p => p.IsActive)
                .Include(p => p.Subscriptions.Where(s => s.IsActive))
                .ToListAsync();
            return View(products);
        }

        // POST: /User/AddToCart
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddToCart(int productId, int durationMonths)
        {
            var product = await _db.Products
                .Include(p => p.Subscriptions)
                .FirstOrDefaultAsync(p => p.Id == productId && p.IsActive);

            if (product == null) return NotFound();

            var subscription = product.Subscriptions
                .FirstOrDefault(s => s.DurationMonths == durationMonths && s.IsActive);

            if (subscription == null)
            {
                TempData["Error"] = "Selected plan not found.";
                return RedirectToAction("Products");
            }

            var cart = GetCart();

            if (cart.Any(c => c.ProductId == productId))
            {
                TempData["Info"] = $"'{product.Title}' is already in cart.";
                return RedirectToAction("Products");
            }

            cart.Add(new CartItem
            {
                ProductId = product.Id,
                ProductTitle = product.Title,
                BasePrice = subscription.Price,
                DurationMonths = durationMonths,
                FinalPrice = subscription.FinalPrice
            });

            SaveCart(cart);
            TempData["Success"] = $"'{product.Title}' added to cart!";
            return RedirectToAction("Products");
        }

        // GET: /User/Cart
        public IActionResult Cart()
        {
            var cart = GetCart();
            var model = BuildCheckout(cart, null);
            return View(model);
        }

        // POST: /User/ApplyVoucher
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult ApplyVoucher(string voucherCode)
        {
            var cart = GetCart();
            var model = BuildCheckout(cart, voucherCode?.Trim().ToUpper());
            return View("Cart", model);
        }

        // POST: /User/RemoveFromCart
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult RemoveFromCart(int productId)
        {
            var cart = GetCart();
            cart.RemoveAll(c => c.ProductId == productId);
            SaveCart(cart);
            return RedirectToAction("Cart");
        }

        // POST: /User/Checkout
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Checkout(string? voucherCode)
        {
            var cart = GetCart();
            if (!cart.Any())
            {
                TempData["Error"] = "Your cart is empty.";
                return RedirectToAction("Products");
            }

            var user = await _userManager.GetUserAsync(User);
            var checkout = BuildCheckout(cart, voucherCode?.Trim().ToUpper());

            Voucher? appliedVoucher = null; // Track the voucher

            // Update voucher usage
            if (checkout.VoucherValid && !string.IsNullOrEmpty(voucherCode))
            {
                appliedVoucher = await _db.Vouchers
                    .FirstOrDefaultAsync(v => v.Code == voucherCode.ToUpper());
                if (appliedVoucher != null)
                {
                    appliedVoucher.UsedCount++;
                    if (appliedVoucher.UsageLimit.HasValue && appliedVoucher.UsedCount >= appliedVoucher.UsageLimit.Value)
                        appliedVoucher.IsActive = false;
                }
            }

            // Distribute total discount per item
            decimal totalDiscount = checkout.BundleDiscount + checkout.VoucherDiscount;
            decimal discountPerItem = cart.Count > 0
                ? Math.Round(totalDiscount / cart.Count, 2) : 0;

            foreach (var item in cart)
            {
                decimal finalAmount = Math.Max(0, item.FinalPrice - discountPerItem);
                _db.Orders.Add(new Order
                {
                    UserId = user!.Id,
                    ProductId = item.ProductId,
                    Quantity = 1,
                    UnitPrice = item.FinalPrice,
                    TotalAmount = item.FinalPrice,
                    DiscountAmount = discountPerItem,
                    FinalAmount = finalAmount,
                    DurationMonths = item.DurationMonths,
                    OriginalPrice = item.FinalPrice,
                    FinalPrice = finalAmount,
                    VoucherId = appliedVoucher?.Id, // Set VoucherId
                    VoucherCode = checkout.VoucherValid ? voucherCode?.ToUpper() : null,
                    SubscriptionEndDate = DateTime.UtcNow.AddMonths(item.DurationMonths),
                    PaymentStatus = PaymentStatus.Pending,
                    OrderDate = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();
            SaveCart(new List<CartItem>());

            TempData["Success"] =
                $"✅ {cart.Count} order(s) placed! Total: ৳{checkout.Total:N0}. Payment pending.";
            return RedirectToAction("MyOrders");
        }

        // GET: /User/MyOrders
        public async Task<IActionResult> MyOrders()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return RedirectToAction("Login", "Account");
            }

            var orders = await _db.Orders
                .Include(o => o.Product)
                .Where(o => o.UserId == user.Id)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return View(orders);
        }

        // ── Private Helpers ──

        private List<CartItem> GetCart()
        {
            var json = HttpContext.Session.GetString("Cart");
            return string.IsNullOrEmpty(json)
                ? new List<CartItem>()
                : JsonSerializer.Deserialize<List<CartItem>>(json)!;
        }

        private void SaveCart(List<CartItem> cart) =>
            HttpContext.Session.SetString("Cart", JsonSerializer.Serialize(cart));

        private CheckoutViewModel BuildCheckout(List<CartItem> cart, string? voucherCode)
        {
            var model = new CheckoutViewModel
            {
                CartItems = cart,
                SubTotal = cart.Sum(c => c.FinalPrice)
            };

            // Bundle discount
            if (cart.Count >= 3)
                model.BundleDiscount = Math.Round(model.SubTotal * 0.15m, 2);
            else if (cart.Count >= 2)
                model.BundleDiscount = Math.Round(model.SubTotal * 0.10m, 2);

            decimal afterBundle = model.SubTotal - model.BundleDiscount;

            // Voucher discount
            if (!string.IsNullOrEmpty(voucherCode))
            {
                var voucher = _db.Vouchers.FirstOrDefault(v =>
                    v.Code == voucherCode &&
                    v.IsActive &&
                    (!v.ExpiryDate.HasValue || v.ExpiryDate.Value > DateTime.UtcNow) &&
                    (!v.UsageLimit.HasValue || v.UsedCount < v.UsageLimit.Value));

                if (voucher != null)
                {
                    model.VoucherCode = voucherCode;
                    model.VoucherValid = true;
                    model.VoucherMessage = $"✅ Voucher applied! {voucher.DiscountPercent}% off";
                    model.VoucherDiscount = Math.Round(afterBundle * voucher.DiscountPercent / 100, 2);
                }
                else
                {
                    model.VoucherValid = false;
                    model.VoucherMessage = "❌ Invalid, expired, or used voucher.";
                }
            }

            model.Total = Math.Max(0,
                model.SubTotal - model.BundleDiscount - model.VoucherDiscount);

            return model;
        }
    }
}