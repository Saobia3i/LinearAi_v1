using Linear_v1.Data;
using Linear_v1.Infrastructure;
using Linear_v1.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Linear_v1.Controllers.Api
{
    [Route("api/orders")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    [EnableRateLimiting(RateLimitPolicies.Admin)]
    public class OrdersApiController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public OrdersApiController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET: api/orders?page=1&pageSize=20
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            if (page < 1) page = 1;
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _db.Orders
                .Include(o => o.User)
                .Include(o => o.Product)
                .OrderByDescending(o => o.OrderDate);

            var total = await query.CountAsync();

            var orders = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new
                {
                    o.Id,
                    clientEmail = o.User.Email,
                    product = o.Product.Title,
                    price = o.Product.Price,
                    paymentStatus = o.PaymentStatus.ToString(),
                    o.OrderDate
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = orders,
                pagination = new { page, pageSize, total, totalPages = (int)Math.Ceiling((double)total / pageSize) }
            });
        }

        // PATCH: api/orders/5/status
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null)
                return NotFound(new { success = false, message = "Order not found." });

            if (!Enum.TryParse<PaymentStatus>(request.Status, ignoreCase: true, out var newStatus))
                return BadRequest(new { success = false, message = $"Invalid status '{request.Status}'." });

            order.PaymentStatus = newStatus;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Order #{id} status updated to {newStatus}."
            });
        }

        public record UpdateStatusRequest(string Status);
    }
}