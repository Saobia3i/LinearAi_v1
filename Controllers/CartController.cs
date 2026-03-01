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
    [Authorize]
    public class CartController : Controller
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<CartController> _logger;

        public CartController(ApplicationDbContext db, UserManager<ApplicationUser> userManager, ILogger<CartController> logger)
        {
            _db = db;
            _userManager = userManager;
            _logger = logger;
        }

        // GET: /Cart
        public IActionResult Index()
        {
            var cartItems = GetCartItems();
            ViewBag.CartTotal = cartItems.Sum(x => x.FinalPrice);
            ViewBag.AppliedVoucher = TempData["AppliedVoucher"] as string;
            ViewBag.DiscountAmount = TempData["DiscountAmount"] as decimal? ?? 0;
            return View(cartItems);
        }

        // POST: /Cart/AddToCart
        [HttpPost]
        public async Task<IActionResult> AddToCart(int productId, int quantity = 1)
        {
            try
            {
                var product = await _db.Products.FindAsync(productId);
                if (product == null || !product.IsActive)
                {
                    TempData["Error"] = "Product not found or unavailable.";
                    return RedirectToAction("Index", "Home");
                }

                var cartItems = GetCartItems();
                var existingItem = cartItems.FirstOrDefault(x => x.ProductId == productId);

                if (existingItem != null)
                {
                    // For now, just add to final price as quantity increase isn't suitable for subscriptions
                    TempData["Info"] = "This product is already in your cart.";
                }
                else
                {
                    cartItems.Add(new CartItem
                    {
                        ProductId = productId,
                        ProductTitle = product.Title,
                        BasePrice = product.Price,
                        DurationMonths = 1, // Default duration
                        FinalPrice = product.Price
                    });
                }

                SaveCartItems(cartItems);
                TempData["Success"] = "Product added to cart!";
                return RedirectToAction("Index");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to add product {ProductId} to cart", productId);
                TempData["Error"] = "Failed to add product to cart.";
                return RedirectToAction("Index", "Home");
            }
        }

        // POST: /Cart/ApplyVoucher
        [HttpPost]
        public async Task<IActionResult> ApplyVoucher(string voucherCode)
        {
            try
            {
                if (string.IsNullOrEmpty(voucherCode))
                {
                    TempData["Error"] = "Please enter a voucher code.";
                    return RedirectToAction("Index");
                }

                var voucher = await _db.Vouchers
                    .FirstOrDefaultAsync(v => v.Code.ToUpper() == voucherCode.ToUpper().Trim());

                if (voucher == null)
                {
                    TempData["Error"] = "Invalid voucher code.";
                    return RedirectToAction("Index");
                }

                if (!voucher.IsValid)
                {
                    TempData["Error"] = "This voucher has expired or reached maximum usage.";
                    return RedirectToAction("Index");
                }

                var cartItems = GetCartItems();
                if (!cartItems.Any())
                {
                    TempData["Error"] = "Your cart is empty.";
                    return RedirectToAction("Index");
                }

                var cartTotal = cartItems.Sum(x => x.FinalPrice);

                if (cartTotal < voucher.MinimumOrderAmount)
                {
                    TempData["Error"] = $"Minimum order amount for this voucher is ₹{voucher.MinimumOrderAmount:F2}.";
                    return RedirectToAction("Index");
                }

                // Calculate discount
                var discountAmount = (cartTotal * voucher.DiscountPercent) / 100;
                if (discountAmount > voucher.MaxDiscountAmount)
                    discountAmount = voucher.MaxDiscountAmount;

                // Store voucher in session
                HttpContext.Session.SetString("AppliedVoucherCode", voucher.Code);
                HttpContext.Session.SetString("AppliedVoucherId", voucher.Id.ToString());
                HttpContext.Session.SetString("DiscountAmount", discountAmount.ToString());

                TempData["Success"] = $"Voucher '{voucher.Code}' applied! You saved ₹{discountAmount:F2}";
                TempData["AppliedVoucher"] = voucher.Code;
                TempData["DiscountAmount"] = discountAmount;

                return RedirectToAction("Index");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to apply voucher {VoucherCode}", voucherCode);
                TempData["Error"] = "Failed to apply voucher.";
                return RedirectToAction("Index");
            }
        }

        // POST: /Cart/RemoveVoucher
        [HttpPost]
        public IActionResult RemoveVoucher()
        {
            HttpContext.Session.Remove("AppliedVoucherCode");
            HttpContext.Session.Remove("AppliedVoucherId");
            HttpContext.Session.Remove("DiscountAmount");

            TempData["Success"] = "Voucher removed.";
            return RedirectToAction("Index");
        }

        // POST: /Cart/UpdateQuantity
        [HttpPost]
        public IActionResult UpdateQuantity(int productId, int quantity)
        {
            var cartItems = GetCartItems();
            var item = cartItems.FirstOrDefault(x => x.ProductId == productId);

            if (item != null)
            {
                if (quantity <= 0)
                {
                    cartItems.Remove(item);
                    TempData["Success"] = "Item removed from cart.";
                }
                else
                {
                    // For subscriptions, we don't really update quantity, 
                    // but we can update duration months or just remove/add
                    TempData["Info"] = "Item updated in cart.";
                }

                SaveCartItems(cartItems);
            }

            return RedirectToAction("Index");
        }

        // POST: /Cart/Checkout
        [HttpPost]
        public async Task<IActionResult> Checkout()
        {
            try
            {
                var cartItems = GetCartItems();
                if (!cartItems.Any())
                {
                    TempData["Error"] = "Your cart is empty.";
                    return RedirectToAction("Index");
                }

                var user = await _userManager.GetUserAsync(User);
                if (user == null) return Unauthorized();

                var cartTotal = cartItems.Sum(x => x.FinalPrice);
                var discountAmount = GetDiscountAmount();
                var finalAmount = cartTotal - discountAmount;

                // Get applied voucher if any
                var voucherId = GetAppliedVoucherId();
                var voucherCode = GetAppliedVoucherCode();

                foreach (var item in cartItems)
                {
                    var order = new Order
                    {
                        UserId = user.Id,
                        ProductId = item.ProductId,
                        Quantity = 1, // For subscriptions, quantity is typically 1
                        UnitPrice = item.BasePrice,
                        TotalAmount = item.FinalPrice,
                        DiscountAmount = discountAmount * (item.FinalPrice / cartTotal), // Proportional discount
                        FinalAmount = item.FinalPrice - (discountAmount * (item.FinalPrice / cartTotal)),
                        VoucherId = voucherId,
                        VoucherCode = voucherCode,
                        DurationMonths = item.DurationMonths,
                        OriginalPrice = item.BasePrice,
                        FinalPrice = item.FinalPrice,
                        SubscriptionEndDate = DateTime.UtcNow.AddMonths(item.DurationMonths),
                        PaymentStatus = PaymentStatus.Pending,
                        OrderDate = DateTime.UtcNow
                    };

                    _db.Orders.Add(order);
                }

                // Update voucher usage if applied
                if (voucherId.HasValue)
                {
                    var voucher = await _db.Vouchers.FindAsync(voucherId.Value);
                    if (voucher != null)
                    {
                        voucher.UsedCount++;
                        _db.Vouchers.Update(voucher);
                    }
                }

                await _db.SaveChangesAsync();

                // Clear cart and voucher
                ClearCart();
                ClearVoucher();

                TempData["Success"] = "Order placed successfully!";
                return RedirectToAction("OrderSuccess");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process checkout");
                TempData["Error"] = "Failed to process order.";
                return RedirectToAction("Index");
            }
        }

        // GET: /Cart/OrderSuccess
        public IActionResult OrderSuccess()
        {
            return View();
        }

        #region Private Methods

        private List<CartItem> GetCartItems()
        {
            var cartJson = HttpContext.Session.GetString("CartItems");
            return string.IsNullOrEmpty(cartJson) 
                ? new List<CartItem>() 
                : JsonSerializer.Deserialize<List<CartItem>>(cartJson) ?? new List<CartItem>();
        }

        private void SaveCartItems(List<CartItem> cartItems)
        {
            var cartJson = JsonSerializer.Serialize(cartItems);
            HttpContext.Session.SetString("CartItems", cartJson);
        }

        private decimal GetDiscountAmount()
        {
            var discountStr = HttpContext.Session.GetString("DiscountAmount");
            return decimal.TryParse(discountStr, out var discount) ? discount : 0;
        }

        private int? GetAppliedVoucherId()
        {
            var voucherIdStr = HttpContext.Session.GetString("AppliedVoucherId");
            return int.TryParse(voucherIdStr, out var voucherId) ? voucherId : null;
        }

        private string? GetAppliedVoucherCode()
        {
            return HttpContext.Session.GetString("AppliedVoucherCode");
        }

        private void ClearCart()
        {
            HttpContext.Session.Remove("CartItems");
        }

        private void ClearVoucher()
        {
            HttpContext.Session.Remove("AppliedVoucherCode");
            HttpContext.Session.Remove("AppliedVoucherId");
            HttpContext.Session.Remove("DiscountAmount");
        }

        #endregion
    }
}