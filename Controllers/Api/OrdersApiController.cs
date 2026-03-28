using Linear_v1.Data;
using Linear_v1.Infrastructure;
using Linear_v1.Models;
using Linear_v1.Services;
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
        private readonly IConfiguration _config;
        private readonly IEmailService _email;

        public OrdersApiController(ApplicationDbContext db, IConfiguration config, IEmailService email)
        {
            _db = db;
            _config = config;
            _email = email;
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
                    clientName = o.User.FullName,
                    product = o.Product.Title,
                    productDeliveryTemplate = o.Product.DeliveryTemplate,
                    price = o.FinalPrice,
                    paymentStatus = o.PaymentStatus.ToString(),
                    o.OrderDate,
                    o.IsDelivered,
                    o.DeliveryNote
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

        // POST: api/orders/payment/callback
        // Called by a payment gateway after processing. Secured by a shared secret in the header.
        [HttpPost("payment/callback")]
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitPolicies.Write)]
        public async Task<IActionResult> PaymentCallback([FromBody] PaymentCallbackRequest request)
        {
            var expectedSecret = _config["Payment:CallbackSecret"];
            if (!string.IsNullOrWhiteSpace(expectedSecret))
            {
                Request.Headers.TryGetValue("X-Payment-Secret", out var providedSecret);
                if (providedSecret != expectedSecret)
                    return Unauthorized(new { success = false, message = "Invalid callback secret." });
            }

            var order = await _db.Orders.FindAsync(request.OrderId);
            if (order == null)
                return NotFound(new { success = false, message = "Order not found." });

            if (order.PaymentStatus != PaymentStatus.Pending)
                return Ok(new { success = true, message = "Order already processed." });

            order.PaymentStatus = request.Success ? PaymentStatus.Paid : PaymentStatus.Failed;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Order #{request.OrderId} marked as {order.PaymentStatus}."
            });
        }

        // PATCH: api/orders/5/deliver
        [HttpPatch("{id}/deliver")]
        [EnableRateLimiting(RateLimitPolicies.Write)]
        public async Task<IActionResult> Deliver(int id, [FromBody] DeliverRequest request)
        {
            var order = await _db.Orders
                .Include(o => o.User)
                .Include(o => o.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                return NotFound(new { success = false, message = "Order not found." });

            if (order.PaymentStatus != PaymentStatus.Paid)
                return BadRequest(new { success = false, message = "Only paid orders can be delivered." });

            order.DeliveryNote = request.DeliveryNote.Trim();
            order.IsDelivered = true;
            await _db.SaveChangesAsync();

            try
            {
                await _email.SendDeliveryEmailAsync(
                    order.User.Email!,
                    order.User.FullName,
                    order.Product.Title,
                    order.Id,
                    order.DeliveryNote
                );
            }
            catch (Exception ex)
            {
                // Delivery note is saved; email failure should not roll back.
                return Ok(new
                {
                    success = true,
                    message = $"Order #{id} marked as delivered, but the delivery email could not be sent: {ex.Message}"
                });
            }

            return Ok(new { success = true, message = $"Order #{id} delivered and email sent to {order.User.Email}." });
        }

        public record UpdateStatusRequest(string Status);
        public record PaymentCallbackRequest(int OrderId, bool Success);
        public record DeliverRequest([System.ComponentModel.DataAnnotations.Required, System.ComponentModel.DataAnnotations.MinLength(5)] string DeliveryNote);
    }
}