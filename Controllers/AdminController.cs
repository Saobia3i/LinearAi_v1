using Linear_v1.Data;
using Linear_v1.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Linear_v1.Controllers
{
    [Authorize(Roles = "Admin")]
    public class AdminController : Controller
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _db;

        public AdminController(UserManager<ApplicationUser> userManager, ApplicationDbContext db)
        {
            _userManager = userManager;
            _db = db;
        }

        // GET: /Admin/Index — Admin Account Page
        public async Task<IActionResult> Index()
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

        // GET: /Admin/Orders
        public async Task<IActionResult> Orders()
        {
            var orders = await _db.Orders
                .Include(o => o.User)
                .Include(o => o.Product)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
            return View(orders);
        }

        // POST: /Admin/UpdatePaymentStatus
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdatePaymentStatus(int orderId, PaymentStatus status)
        {
            var order = await _db.Orders.FindAsync(orderId);
            if (order == null) return NotFound();

            order.PaymentStatus = status;
            await _db.SaveChangesAsync();

            TempData["Success"] = "Payment status আপডেট হয়েছে।";
            return RedirectToAction("Orders");
        }

        // ✅ NEW: POST /Admin/UpdateOrderStatus
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateOrderStatus(int orderId, OrderStatus status)
        {
            var order = await _db.Orders.FindAsync(orderId);
            if (order == null) return NotFound();

            order.OrderStatus = status;
            await _db.SaveChangesAsync();

            TempData["Success"] = "Order status updated successfully.";
            return RedirectToAction("Orders");
        }
    }
}