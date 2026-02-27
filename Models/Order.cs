namespace Linear_v1.Models
{
    public enum PaymentStatus { Pending, Paid }

    public class Order
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;
        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
        public DateTime OrderDate { get; set; }  
    }
}