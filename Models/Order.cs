using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace Linear_v1.Models
{
    public class Order
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public int ProductId { get; set; }

        [Required]
        public int Quantity { get; set; } = 1;

        public decimal UnitPrice { get; set; }

        public decimal TotalAmount { get; set; }

        public decimal DiscountAmount { get; set; } = 0;

        public decimal FinalAmount { get; set; }

        public int? VoucherId { get; set; }

        public string? VoucherCode { get; set; }

        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        // Additional properties for subscription orders
        public int? DurationMonths { get; set; }
        public decimal OriginalPrice { get; set; }
        public decimal FinalPrice { get; set; }
        public DateTime? SubscriptionEndDate { get; set; }

        // Navigation properties
        public virtual ApplicationUser User { get; set; } = null!;
        public virtual Product Product { get; set; } = null!;
        public virtual Voucher? Voucher { get; set; }
    }

    public enum PaymentStatus
    {
        Pending,
        Paid,
        Failed,
        Cancelled,
        Refunded
    }
}