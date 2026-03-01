namespace Linear_v1.Models.ViewModels
{
    public class CartItem
    {
        public int ProductId { get; set; }
        public string ProductTitle { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
        public int DurationMonths { get; set; }
        public decimal FinalPrice { get; set; }
    }

    public class CheckoutViewModel
    {
        public List<CartItem> CartItems { get; set; } = new();
        public string? VoucherCode { get; set; }
        public decimal SubTotal { get; set; }
        public decimal BundleDiscount { get; set; }
        public decimal VoucherDiscount { get; set; }
        public decimal Total { get; set; }
        public string? VoucherMessage { get; set; }
        public bool VoucherValid { get; set; }
    }
}