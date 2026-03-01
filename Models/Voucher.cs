using System.ComponentModel.DataAnnotations;

namespace Linear_v1.Models
{
    public class Voucher
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required]
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

        [Required]
        public int MaxUses { get; set; }

        // Alternative property name for compatibility with nullable usage limit
        public int? UsageLimit 
        { 
            get => MaxUses == 0 ? null : MaxUses; 
            set => MaxUses = value ?? 0; 
        }

        public int UsedCount { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Calculated property
        public bool IsValid => IsActive && (!ExpiryDate.HasValue || DateTime.UtcNow <= ExpiryDate.Value) && UsedCount < MaxUses;
    }
}