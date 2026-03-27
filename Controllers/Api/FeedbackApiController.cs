using Linear_v1.Data;
using Linear_v1.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Linear_v1.Controllers.Api
{
    [ApiController]
    [Route("api/feedback")]
    public class FeedbackApiController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public FeedbackApiController(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        // POST api/feedback — logged-in user submits feedback or contact
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Submit([FromBody] SubmitFeedbackRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
                return BadRequest(new { success = false, message = "Message is required." });

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized(new { success = false, message = "User not found." });

            var feedback = new Feedback
            {
                Message = request.Message.Trim(),
                Type = request.Type == "contact" ? "contact" : "feedback",
                Subject = request.Subject?.Trim(),
                UserId = user.Id
            };

            _db.Feedbacks.Add(feedback);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Thank you for your feedback!" });
        }

        // GET api/feedback/public — public: returns only posted feedbacks for home page carousel
        [HttpGet("public")]
        public async Task<IActionResult> GetPublic()
        {
            var feedbacks = await _db.Feedbacks
                .Where(f => f.IsPosted && f.Type == "feedback")
                .Include(f => f.User)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new
                {
                    f.Id,
                    f.Message,
                    f.CreatedAt,
                    userName = f.User.FullName
                })
                .ToListAsync();

            return Ok(new { success = true, data = feedbacks });
        }

        // GET api/feedback/admin — admin: returns all feedbacks
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var feedbacks = await _db.Feedbacks
                .Include(f => f.User)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new
                {
                    f.Id,
                    f.Message,
                    f.Type,
                    f.Subject,
                    f.IsPosted,
                    f.CreatedAt,
                    userName = f.User.FullName,
                    userEmail = f.User.Email
                })
                .ToListAsync();

            return Ok(new { success = true, data = feedbacks });
        }

        // PATCH api/feedback/{id}/post — admin toggles IsPosted
        [HttpPatch("{id:int}/post")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> TogglePost(int id)
        {
            var feedback = await _db.Feedbacks.FindAsync(id);
            if (feedback == null)
                return NotFound(new { success = false, message = "Feedback not found." });

            if (!string.Equals(feedback.Type, "feedback", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Only feedback entries can be posted to the home page."
                });
            }

            feedback.IsPosted = !feedback.IsPosted;
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = feedback.IsPosted ? "Posted to home page." : "Removed from home page.", data = new { isPosted = feedback.IsPosted } });
        }

        public record SubmitFeedbackRequest(string Message, string Type, string? Subject);
    }
}
