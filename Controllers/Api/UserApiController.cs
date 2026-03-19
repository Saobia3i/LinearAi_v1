using Linear_v1.Data;
using Linear_v1.Models;
using Linear_v1.Models.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Linear_v1.Controllers.Api
{
    [ApiController]
    [Route("api/user")]
    [Authorize(Roles = "User,Admin")]
    public class UserApiController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _db;

        public UserApiController(UserManager<ApplicationUser> userManager, ApplicationDbContext db)
        {
            _userManager = userManager;
            _db = db;
        }

        [HttpGet("home")]
        public async Task<IActionResult> GetHome()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized(new { success = false, message = "User not found." });
            }

            var products = await _db.Products
                .Where(p => p.IsActive)
                .Include(p => p.Subscriptions.Where(s => s.IsActive))
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var voucher = await _db.Vouchers
                .Where(v => v.IsActive &&
                            (!v.ExpiryDate.HasValue || v.ExpiryDate.Value > DateTime.UtcNow) &&
                            (!v.UsageLimit.HasValue || v.UsedCount < v.UsageLimit.Value))
                .OrderByDescending(v => v.DiscountPercent)
                .Select(v => new VoucherLite
                {
                    Id = v.Id,
                    Code = v.Code,
                    DiscountPercent = v.DiscountPercent,
                    UsageLimit = v.UsageLimit,
                    UsedCount = v.UsedCount,
                    IsActive = v.IsActive,
                    ExpiryDate = v.ExpiryDate
                })
                .FirstOrDefaultAsync();

            return Ok(new
            {
                success = true,
                data = new
                {
                    user = new
                    {
                        user.Id,
                        user.FullName,
                        user.Email
                    },
                    cartCount = GetCart().Count,
                    latestProducts = products.Take(3).Select(MapProduct),
                    featuredProducts = products.Take(8).Select(MapProduct),
                    maxVoucherDiscountPercent = voucher?.DiscountPercent,
                    featuredVoucherCode = voucher?.Code
                }
            });
        }

        [HttpGet("products")]
        public async Task<IActionResult> GetProducts()
        {
            var products = await _db.Products
                .Where(p => p.IsActive)
                .Include(p => p.Subscriptions.Where(s => s.IsActive))
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = products.Select(MapProduct),
                cartCount = GetCart().Count
            });
        }

        [HttpGet("products/{id:int}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            var product = await _db.Products
                .Where(p => p.Id == id && p.IsActive)
                .Include(p => p.Subscriptions.Where(s => s.IsActive))
                .FirstOrDefaultAsync();

            if (product == null)
            {
                return NotFound(new { success = false, message = "Product not found." });
            }

            return Ok(new { success = true, data = MapProduct(product), cartCount = GetCart().Count });
        }

        [HttpGet("cart")]
        public IActionResult GetCartSummary([FromQuery] string? voucherCode)
        {
            var normalizedVoucherCode = string.IsNullOrWhiteSpace(voucherCode)
                ? null
                : voucherCode.Trim().ToUpperInvariant();

            var cart = GetCart();
            var checkout = BuildCheckout(cart, normalizedVoucherCode);

            return Ok(new
            {
                success = true,
                data = new
                {
                    cartCount = cart.Count,
                    items = cart,
                    summary = checkout
                }
            });
        }

        [HttpPost("cart/items")]
        public async Task<IActionResult> AddToCart([FromBody] AddCartItemRequest request)
        {
            if (request.ProductId <= 0 || request.DurationMonths <= 0)
            {
                return BadRequest(new { success = false, message = "Invalid request payload." });
            }

            var product = await _db.Products
                .Include(p => p.Subscriptions)
                .FirstOrDefaultAsync(p => p.Id == request.ProductId && p.IsActive);

            if (product == null)
            {
                return NotFound(new { success = false, message = "Product not found." });
            }

            var subscription = product.Subscriptions
                .FirstOrDefault(s => s.DurationMonths == request.DurationMonths && s.IsActive);

            if (subscription == null)
            {
                return BadRequest(new { success = false, message = "Selected plan not found." });
            }

            var cart = GetCart();
            if (cart.Any(c => c.ProductId == request.ProductId && c.DurationMonths == request.DurationMonths))
            {
                return Conflict(new
                {
                    success = false,
                    message = $"'{product.Title}' ({request.DurationMonths} months) is already in cart.",
                    cartCount = cart.Count
                });
            }

            cart.Add(new CartItem
            {
                ProductId = product.Id,
                ProductTitle = product.Title,
                BasePrice = subscription.Price,
                DurationMonths = request.DurationMonths,
                FinalPrice = subscription.FinalPrice
            });

            SaveCart(cart);

            return Ok(new
            {
                success = true,
                message = $"'{product.Title}' added to cart.",
                cartCount = cart.Count,
                data = cart
            });
        }

        [HttpDelete("cart/items/{productId:int}")]
        public IActionResult RemoveFromCart(int productId, [FromQuery] int? durationMonths)
        {
            var cart = GetCart();

            if (durationMonths.HasValue)
            {
                cart.RemoveAll(c => c.ProductId == productId && c.DurationMonths == durationMonths.Value);
            }
            else
            {
                cart.RemoveAll(c => c.ProductId == productId);
            }

            SaveCart(cart);
            return Ok(new { success = true, message = "Item removed from cart.", cartCount = cart.Count, data = cart });
        }

        [HttpPost("cart/voucher")]
        public IActionResult ApplyVoucher([FromBody] ApplyVoucherRequest request)
        {
            var normalizedVoucherCode = request.VoucherCode?.Trim().ToUpperInvariant();
            var cart = GetCart();
            var checkout = BuildCheckout(cart, normalizedVoucherCode);

            return Ok(new
            {
                success = true,
                data = new
                {
                    cartCount = cart.Count,
                    items = cart,
                    summary = checkout
                }
            });
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
        {
            var cart = GetCart();
            if (!cart.Any())
            {
                return BadRequest(new { success = false, message = "Your cart is empty." });
            }

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized(new { success = false, message = "User not found." });
            }

            var normalizedVoucherCode = request.VoucherCode?.Trim().ToUpperInvariant();
            var checkout = BuildCheckout(cart, normalizedVoucherCode);

            int? appliedVoucherId = null;

            if (checkout.VoucherValid && !string.IsNullOrEmpty(normalizedVoucherCode))
            {
                appliedVoucherId = await _db.Vouchers
                    .Where(v => v.Code == normalizedVoucherCode &&
                                v.IsActive &&
                                (!v.ExpiryDate.HasValue || v.ExpiryDate.Value > DateTime.UtcNow) &&
                                (!v.UsageLimit.HasValue || v.UsedCount < v.UsageLimit.Value))
                    .Select(v => (int?)v.Id)
                    .FirstOrDefaultAsync();

                if (appliedVoucherId.HasValue)
                {
                    await _db.Vouchers
                        .Where(v => v.Id == appliedVoucherId.Value)
                        .ExecuteUpdateAsync(setters => setters
                            .SetProperty(v => v.UsedCount, v => v.UsedCount + 1)
                            .SetProperty(v => v.IsActive, v => !v.UsageLimit.HasValue || (v.UsedCount + 1) < v.UsageLimit.Value));
                }
            }

            var totalDiscount = checkout.BundleDiscount + checkout.VoucherDiscount;
            var discountPerItem = cart.Count > 0 ? Math.Round(totalDiscount / cart.Count, 2) : 0;

            foreach (var item in cart)
            {
                var finalAmount = Math.Max(0, item.FinalPrice - discountPerItem);
                _db.Orders.Add(new Order
                {
                    UserId = user.Id,
                    ProductId = item.ProductId,
                    Quantity = 1,
                    UnitPrice = item.FinalPrice,
                    TotalAmount = item.FinalPrice,
                    DiscountAmount = discountPerItem,
                    FinalAmount = finalAmount,
                    DurationMonths = item.DurationMonths,
                    OriginalPrice = item.FinalPrice,
                    FinalPrice = finalAmount,
                    VoucherId = appliedVoucherId,
                    VoucherCode = checkout.VoucherValid ? normalizedVoucherCode : null,
                    SubscriptionEndDate = DateTime.UtcNow.AddMonths(item.DurationMonths),
                    PaymentStatus = PaymentStatus.Pending,
                    OrderDate = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();
            SaveCart(new List<CartItem>());

            return Ok(new
            {
                success = true,
                message = $"{cart.Count} order(s) placed. Payment pending.",
                data = new
                {
                    orderCount = cart.Count,
                    total = checkout.Total
                }
            });
        }

        [HttpGet("orders")]
        public async Task<IActionResult> GetMyOrders()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized(new { success = false, message = "User not found." });
            }

            var orders = await _db.Orders
                .Include(o => o.Product)
                .Where(o => o.UserId == user.Id)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new
                {
                    o.Id,
                    o.ProductId,
                    productTitle = o.Product.Title,
                    o.DurationMonths,
                    o.FinalAmount,
                    paymentStatus = o.PaymentStatus.ToString(),
                    o.OrderDate,
                    o.SubscriptionEndDate,
                    o.VoucherCode
                })
                .ToListAsync();

            return Ok(new { success = true, data = orders });
        }

        [HttpGet("account")]
        public async Task<IActionResult> GetAccount()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized(new { success = false, message = "User not found." });
            }

            return Ok(new
            {
                success = true,
                data = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.PhoneNumber,
                    user.CreatedAt,
                    user.IsActive
                }
            });
        }

        private static object MapProduct(Product p) => new
        {
            p.Id,
            p.Title,
            p.ShortDescription,
            p.Price,
            p.CreatedAt,
            subscriptions = p.Subscriptions
                .Where(s => s.IsActive)
                .OrderBy(s => s.DurationMonths)
                .Select(s => new
                {
                    s.Id,
                    s.DurationMonths,
                    s.Price,
                    s.DiscountPercent,
                    finalPrice = s.FinalPrice
                })
        };

        private List<CartItem> GetCart()
        {
            var json = HttpContext.Session.GetString("Cart");
            if (string.IsNullOrWhiteSpace(json))
            {
                return new List<CartItem>();
            }

            try
            {
                return JsonSerializer.Deserialize<List<CartItem>>(json) ?? new List<CartItem>();
            }
            catch
            {
                HttpContext.Session.Remove("Cart");
                return new List<CartItem>();
            }
        }

        private void SaveCart(List<CartItem> cart)
        {
            HttpContext.Session.SetString("Cart", JsonSerializer.Serialize(cart));
        }

        private CheckoutViewModel BuildCheckout(List<CartItem> cart, string? voucherCode)
        {
            var model = new CheckoutViewModel
            {
                CartItems = cart,
                SubTotal = cart.Sum(c => c.FinalPrice)
            };

            if (cart.Count >= 3)
            {
                model.BundleDiscount = Math.Round(model.SubTotal * 0.15m, 2);
            }
            else if (cart.Count >= 2)
            {
                model.BundleDiscount = Math.Round(model.SubTotal * 0.10m, 2);
            }

            var afterBundle = model.SubTotal - model.BundleDiscount;

            if (!string.IsNullOrWhiteSpace(voucherCode))
            {
                var voucher = _db.Vouchers
                    .Where(v =>
                        v.Code == voucherCode &&
                        v.IsActive &&
                        (!v.ExpiryDate.HasValue || v.ExpiryDate.Value > DateTime.UtcNow) &&
                        (!v.UsageLimit.HasValue || v.UsedCount < v.UsageLimit.Value))
                    .Select(v => new VoucherLite
                    {
                        Id = v.Id,
                        Code = v.Code,
                        DiscountPercent = v.DiscountPercent,
                        UsageLimit = v.UsageLimit,
                        UsedCount = v.UsedCount,
                        IsActive = v.IsActive,
                        ExpiryDate = v.ExpiryDate
                    })
                    .FirstOrDefault();

                if (voucher != null)
                {
                    model.VoucherCode = voucherCode;
                    model.VoucherValid = true;
                    model.VoucherMessage = $"Voucher applied: {voucher.DiscountPercent}% off";
                    model.VoucherDiscount = Math.Round(afterBundle * voucher.DiscountPercent / 100, 2);
                }
                else
                {
                    model.VoucherValid = false;
                    model.VoucherMessage = "Invalid, expired, or used voucher.";
                }
            }

            model.Total = Math.Max(0, model.SubTotal - model.BundleDiscount - model.VoucherDiscount);
            return model;
        }

        public sealed class AddCartItemRequest
        {
            public int ProductId { get; set; }
            public int DurationMonths { get; set; }
        }

        public sealed class ApplyVoucherRequest
        {
            public string? VoucherCode { get; set; }
        }

        public sealed class CheckoutRequest
        {
            public string? VoucherCode { get; set; }
        }

        private sealed class VoucherLite
        {
            public int Id { get; set; }
            public string Code { get; set; } = string.Empty;
            public decimal DiscountPercent { get; set; }
            public int? UsageLimit { get; set; }
            public int UsedCount { get; set; }
            public bool IsActive { get; set; }
            public DateTime? ExpiryDate { get; set; }
        }
    }
}
