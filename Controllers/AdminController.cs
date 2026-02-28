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

        // GET: /Admin/Index
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

            TempData["Success"] = "Payment status updated.";
            return RedirectToAction("Orders");
        }

        // GET: /Admin/Products
        public async Task<IActionResult> Products()
        {
            var products = await _db.Products.ToListAsync();
            return View(products);
        }

        // GET: /Admin/AddProduct
        public IActionResult AddProduct() => View();

        // POST: /Admin/AddProduct
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddProduct(Product model)
        {
            if (!ModelState.IsValid) return View(model);

            model.CreatedAt = DateTime.UtcNow;
            model.IsActive = true;
            _db.Products.Add(model);
            await _db.SaveChangesAsync();

            TempData["Success"] = "Product added successfully.";
            return RedirectToAction("Products");
        }

        // GET: /Admin/EditProduct/5
        public async Task<IActionResult> EditProduct(int id)
        {
            var product = await _db.Products.FindAsync(id);
            if (product == null) return NotFound();
            return View(product);
        }

        // POST: /Admin/EditProduct
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditProduct(Product model)
        {
            if (!ModelState.IsValid) return View(model);

            var product = await _db.Products.FindAsync(model.Id);
            if (product == null) return NotFound();

            product.Title = model.Title;
            product.ShortDescription = model.ShortDescription;
            product.Price = model.Price;
            product.IsActive = model.IsActive;

            await _db.SaveChangesAsync();
            TempData["Success"] = "Product updated successfully.";
            return RedirectToAction("Products");
        }

        // POST: /Admin/DeleteProduct
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _db.Products.FindAsync(id);
            if (product == null) return NotFound();

            product.IsActive = false;
            await _db.SaveChangesAsync();

            TempData["Success"] = "Product deleted successfully.";
            return RedirectToAction("Products");
        }
    }
}
