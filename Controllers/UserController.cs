using Linear_v1.Data;
using Linear_v1.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

        // GET: /User/Index — Account Page
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
                .ToListAsync();
            return View(products);
        }

        // ✅ NEW: GET /User/Orders (User can see admin status)
        public async Task<IActionResult> Orders()
        {
            var user = await _userManager.GetUserAsync(User);

            var orders = await _db.Orders
                .Include(o => o.Product)
                .Where(o => o.UserId == user!.Id)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return View(orders);
        }

        // POST: /User/BuyProduct
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> BuyProduct(int productId)
        {
            var user = await _userManager.GetUserAsync(User);
            var product = await _db.Products.FindAsync(productId);

            if (product == null || !product.IsActive)
                return NotFound();

            var order = new Order
            {
                UserId = user!.Id,
                ProductId = productId,
                PaymentStatus = PaymentStatus.Pending,
                OrderDate = DateTime.UtcNow

                // TODO: Add OrderStatus = OrderStatus.Pending after migration
                // OrderStatus = OrderStatus.Pending
            };

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            TempData["Success"] = $"'{product.Title}' Order done! Payment is pending.";
            return RedirectToAction("Products");
        }
    }
}