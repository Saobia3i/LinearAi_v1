using System.ComponentModel.DataAnnotations;

namespace Linear_v1.Models
{
    public class Product
    {
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string ShortDescription { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<ProductSubscription> Subscriptions { get; set; } = new List<ProductSubscription>();
    }

    public class ProductSubscription
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public int DurationMonths { get; set; }    // 3, 6, 12
        public decimal Price { get; set; }          // Base price
        public decimal DiscountPercent { get; set; } // 0, 10, 20
        public bool IsActive { get; set; } = true;

        // Calculated — not stored in DB
        public decimal FinalPrice => Math.Round(Price - (Price * DiscountPercent / 100), 2);
    }
}
