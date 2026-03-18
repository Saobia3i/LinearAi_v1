using Linear_v1.Models;

namespace Linear_v1.Models.ViewModels
{
    public class UserLandingViewModel
    {
        public ApplicationUser? User { get; set; }
        public List<Product> LatestProducts { get; set; } = new();
        public List<Product> FeaturedProducts { get; set; } = new();
        public decimal? MaxVoucherDiscountPercent { get; set; }
        public string? FeaturedVoucherCode { get; set; }
    }
}
