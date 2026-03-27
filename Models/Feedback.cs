using System.ComponentModel.DataAnnotations;

namespace Linear_v1.Models
{
    public class Feedback
    {
        public int Id { get; set; }

        [Required, MaxLength(1000)]
        public string Message { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string Type { get; set; } = "feedback"; // "feedback" or "contact"

        [MaxLength(200)]
        public string? Subject { get; set; }

        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;

        public bool IsPosted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
