using Linear_v1.Data;
using Linear_v1.Infrastructure;
using Linear_v1.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Linear_v1.Controllers.Api
{
    [Route("api/products")]
    [ApiController]
    [EnableRateLimiting(RateLimitPolicies.Public)]
    public class ProductsApiController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public ProductsApiController(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        // GET: api/products
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var products = await _db.Products
                .Where(p => p.IsActive)
                .Include(p => p.Subscriptions.Where(s => s.IsActive))
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var data = products.Select(p => new
            {
                p.Id,
                p.Title,
                p.ShortDescription,
                p.Price,
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
            });

            return Ok(new { success = true, data });
        }

        // GET: api/products/5
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _db.Products
                .Where(p => p.Id == id && p.IsActive)
                .Include(p => p.Subscriptions.Where(s => s.IsActive))
                .Select(p => new
                {
                    p.Id,
                    p.Title,
                    p.ShortDescription,
                    p.Price,
                    subscriptions = p.Subscriptions
                        .OrderBy(s => s.DurationMonths)
                        .Select(s => new
                        {
                            s.Id,
                            s.DurationMonths,
                            s.Price,
                            s.DiscountPercent,
                            finalPrice = s.FinalPrice
                        })
                })
                .FirstOrDefaultAsync();

            if (product == null)
                return NotFound(new { success = false, message = "Product not found." });

            return Ok(new { success = true, data = product });
        }

        // POST: api/products/buy
        [HttpPost("buy")]
        [Authorize]
        [EnableRateLimiting(RateLimitPolicies.Write)]
        public async Task<IActionResult> Buy([FromBody] BuyRequest request)
        {
            var userId = _userManager.GetUserId(User);
            var product = await _db.Products.FindAsync(request.ProductId);

            if (product == null || !product.IsActive)
                return NotFound(new { success = false, message = "Product not found." });

            var order = new Order
            {
                UserId = userId!,
                ProductId = request.ProductId,
                PaymentStatus = PaymentStatus.Pending,
                OrderDate = DateTime.UtcNow
            };

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Order placed for '{product.Title}'. Payment pending.",
                orderId = order.Id
            });
        }

        public record BuyRequest(int ProductId);
    }
}