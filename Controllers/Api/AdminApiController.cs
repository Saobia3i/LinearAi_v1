using Linear_v1.Data;
using Linear_v1.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Linear_v1.Controllers.Api
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminApiController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public AdminApiController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> Dashboard()
        {
            var totalUsers = await _db.Users.CountAsync();
            var totalOrders = await _db.Orders.CountAsync();
            var pendingOrders = await _db.Orders.CountAsync(o => o.PaymentStatus == PaymentStatus.Pending);
            var totalProducts = await _db.Products.CountAsync();
            var activeProducts = await _db.Products.CountAsync(p => p.IsActive);
            var totalVouchers = await _db.Vouchers.CountAsync();
            var activeVouchers = await _db.Vouchers.CountAsync(v => v.IsActive);

            return Ok(new
            {
                success = true,
                data = new
                {
                    totalUsers,
                    totalOrders,
                    pendingOrders,
                    totalProducts,
                    activeProducts,
                    totalVouchers,
                    activeVouchers
                }
            });
        }

        [HttpGet("products")]
        public async Task<IActionResult> GetProducts()
        {
            var products = await _db.Products
                .Include(p => p.Subscriptions)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.Id,
                    p.Title,
                    p.ShortDescription,
                    p.Price,
                    p.IsActive,
                    p.CreatedAt,
                    subscriptions = p.Subscriptions.Select(s => new
                    {
                        s.Id,
                        s.DurationMonths,
                        s.Price,
                        s.DiscountPercent,
                        finalPrice = s.FinalPrice,
                        s.IsActive
                    })
                })
                .ToListAsync();

            return Ok(new { success = true, data = products });
        }

        [HttpPost("products")]
        public async Task<IActionResult> CreateProduct([FromBody] ProductRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.ShortDescription) || request.Price < 0)
            {
                return BadRequest(new { success = false, message = "Invalid product payload." });
            }

            var product = new Product
            {
                Title = request.Title.Trim(),
                ShortDescription = request.ShortDescription.Trim(),
                Price = request.Price,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _db.Products.Add(product);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Product created successfully." });
        }

        [HttpPut("products/{id:int}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] ProductRequest request)
        {
            var product = await _db.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { success = false, message = "Product not found." });
            }

            product.Title = request.Title.Trim();
            product.ShortDescription = request.ShortDescription.Trim();
            product.Price = request.Price;
            product.IsActive = request.IsActive;

            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Product updated successfully." });
        }

        [HttpDelete("products/{id:int}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _db.Products
                .Include(p => p.Subscriptions)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return NotFound(new { success = false, message = "Product not found." });

            var hasOrders = await _db.Orders.AnyAsync(o => o.ProductId == id);
            if (hasOrders)
            {
                // Soft delete — deactivate instead of hard delete
                product.IsActive = false;
                foreach (var sub in product.Subscriptions)
                    sub.IsActive = false;
                await _db.SaveChangesAsync();
                return Ok(new { success = true, message = "Product deactivated (has existing orders)." });
            }

            // No orders — safe to hard delete (subscriptions cascade)
            _db.ProductSubscriptions.RemoveRange(product.Subscriptions);
            _db.Products.Remove(product);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Product deleted." });
        }

        [HttpPost("products/{id:int}/subscriptions")]
        public async Task<IActionResult> SaveSubscription(int id, [FromBody] SubscriptionRequest request)
        {
            var product = await _db.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { success = false, message = "Product not found." });
            }

            var existing = await _db.ProductSubscriptions
                .FirstOrDefaultAsync(s => s.ProductId == id && s.DurationMonths == request.DurationMonths);

            if (existing == null)
            {
                _db.ProductSubscriptions.Add(new ProductSubscription
                {
                    ProductId = id,
                    DurationMonths = request.DurationMonths,
                    Price = request.Price,
                    DiscountPercent = request.DiscountPercent,
                    IsActive = request.IsActive
                });
            }
            else
            {
                existing.Price = request.Price;
                existing.DiscountPercent = request.DiscountPercent;
                existing.IsActive = request.IsActive;
            }

            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Subscription saved successfully." });
        }

        [HttpDelete("subscriptions/{id:int}")]
        public async Task<IActionResult> DeleteSubscription(int id)
        {
            var sub = await _db.ProductSubscriptions.FindAsync(id);
            if (sub == null)
            {
                return NotFound(new { success = false, message = "Subscription not found." });
            }

            _db.ProductSubscriptions.Remove(sub);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Subscription deleted successfully." });
        }

        [HttpGet("vouchers")]
        public async Task<IActionResult> GetVouchers()
        {
            var vouchers = await _db.Vouchers
                .OrderByDescending(v => v.CreatedAt)
                .Select(v => new
                {
                    v.Id,
                    v.Code,
                    v.Description,
                    v.DiscountPercent,
                    v.MaxDiscountAmount,
                    v.MinimumOrderAmount,
                    maxUses = v.UsageLimit,
                    v.UsedCount,
                    v.IsActive,
                    v.ExpiryDate,
                    v.CreatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = vouchers });
        }

        [HttpPost("vouchers")]
        public async Task<IActionResult> CreateVoucher([FromBody] VoucherRequest request)
        {
            var code = request.Code?.Trim().ToUpperInvariant();
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new { success = false, message = "Voucher code is required." });
            }

            if (await _db.Vouchers.AnyAsync(v => v.Code == code))
            {
                return Conflict(new { success = false, message = "Voucher code already exists." });
            }

            var voucher = new Voucher
            {
                Code = code,
                Description = request.Description?.Trim() ?? string.Empty,
                DiscountPercent = request.DiscountPercent,
                MaxDiscountAmount = request.MaxDiscountAmount,
                MinimumOrderAmount = request.MinimumOrderAmount,
                UsageLimit = request.MaxUses == 0 ? null : (int?)request.MaxUses,
                IsActive = true,
                UsedCount = 0,
                ExpiryDate = request.ExpiryDate.HasValue
                    ? DateTime.SpecifyKind(request.ExpiryDate.Value, DateTimeKind.Utc)
                    : null,
                CreatedAt = DateTime.UtcNow
            };

            _db.Vouchers.Add(voucher);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Voucher created successfully." });
        }

        [HttpPatch("vouchers/{id:int}/toggle")]
        public async Task<IActionResult> ToggleVoucher(int id)
        {
            var voucher = await _db.Vouchers.FindAsync(id);
            if (voucher == null)
            {
                return NotFound(new { success = false, message = "Voucher not found." });
            }

            voucher.IsActive = !voucher.IsActive;
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = $"Voucher {(voucher.IsActive ? "activated" : "deactivated")}." });
        }

        public sealed class ProductRequest
        {
            public string Title { get; set; } = string.Empty;
            public string ShortDescription { get; set; } = string.Empty;
            public decimal Price { get; set; }
            public bool IsActive { get; set; } = true;
        }

        public sealed class SubscriptionRequest
        {
            public int DurationMonths { get; set; }
            public decimal Price { get; set; }
            public decimal DiscountPercent { get; set; }
            public bool IsActive { get; set; } = true;
        }

        public sealed class VoucherRequest
        {
            public string Code { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public decimal DiscountPercent { get; set; }
            public decimal MaxDiscountAmount { get; set; }
            public decimal MinimumOrderAmount { get; set; }
            public int MaxUses { get; set; }
            public DateTime? ExpiryDate { get; set; }
        }
    }
}
