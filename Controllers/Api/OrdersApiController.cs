using Linear_v1.Data;
using Linear_v1.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Linear_v1.Controllers.Api
{
    [Route("api/orders")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class OrdersApiController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public OrdersApiController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET: api/orders
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var orders = await _db.Orders
                .Include(o => o.User)
                .Include(o => o.Product)
                .OrderByDescending(o => o.OrderDate)
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

            return Ok(new { success = true, data = orders });
        }

        // PATCH: api/orders/5/status
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null)
                return NotFound(new { success = false, message = "Order not found." });

            order.PaymentStatus = request.Status;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Order #{id} status updated to {request.Status}."
            });
        }

        public record UpdateStatusRequest(PaymentStatus Status);
    }
}