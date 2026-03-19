using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Linear_v1.Models
{
    public class Voucher
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Code { get; set; } = string.Empty;

        [StringLength(200)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0, 100)]
        public decimal DiscountPercent { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal MaxDiscountAmount { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal MinimumOrderAmount { get; set; }

        public DateTime? ExpiryDate { get; set; }

        // DB column is UsageLimit (nullable) — null = unlimited
        public int? UsageLimit { get; set; }

        public int UsedCount { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [NotMapped]
        public bool IsValid => IsActive
            && (!ExpiryDate.HasValue || DateTime.UtcNow <= ExpiryDate.Value)
            && (!UsageLimit.HasValue || UsedCount < UsageLimit.Value);
    }
}
