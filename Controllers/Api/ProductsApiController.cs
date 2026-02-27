using Linear_v1.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Linear_v1.Controllers.Api
{
    [Route("api/products")]
    [ApiController]
    public class ProductsApiController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public ProductsApiController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET: api/products
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var products = await _db.Products
                .Where(p => p.IsActive)
                .Select(p => new
                {
                    p.Id,
                    p.Title,
                    p.ShortDescription,
                    p.Price
                })
                .ToListAsync();

            return Ok(new { success = true, data = products });
        }

        // GET: api/products/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _db.Products.FindAsync(id);
            if (product == null || !product.IsActive)
                return NotFound(new { success = false, message = "Product not found." });

            return Ok(new { success = true, data = product });
        }

        // POST: api/products/buy
        [HttpPost("buy")]
        [Authorize]
        public async Task<IActionResult> Buy([FromBody] BuyRequest request)
        {
            var userId = _userManager.GetUserId(User);
            var product = await _db.Products.FindAsync(request.ProductId);

            if (product == null || !product.IsActive)
                return NotFound(new { success = false, message = "Product not found." });

            var order = new Linear_v1.Models.Order
            {
                UserId = userId!,
                ProductId = request.ProductId,
                PaymentStatus = Linear_v1.Models.PaymentStatus.Pending,
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

        private Microsoft.AspNetCore.Identity.UserManager<Linear_v1.Models.ApplicationUser> _userManager
            => HttpContext.RequestServices
                .GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<Linear_v1.Models.ApplicationUser>>();
    }
}