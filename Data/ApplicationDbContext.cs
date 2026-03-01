using Linear_v1.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Linear_v1.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<Product> Products { get; set; } = null!;
        public DbSet<Order> Orders { get; set; } = null!;
        public DbSet<ProductSubscription> ProductSubscriptions { get; set; } = null!;
        public DbSet<Voucher> Vouchers { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Decimal precision
            builder.Entity<Product>()
                .Property(p => p.Price).HasPrecision(18, 2);

            builder.Entity<ProductSubscription>()
                .Property(p => p.Price).HasPrecision(18, 2);
            builder.Entity<ProductSubscription>()
                .Property(p => p.DiscountPercent).HasPrecision(18, 2);

            builder.Entity<Voucher>()
                .Property(v => v.DiscountPercent).HasPrecision(18, 2);

            builder.Entity<Order>()
                .Property(o => o.UnitPrice).HasPrecision(18, 2);
            builder.Entity<Order>()
                .Property(o => o.TotalAmount).HasPrecision(18, 2);
            builder.Entity<Order>()
                .Property(o => o.DiscountAmount).HasPrecision(18, 2);
            builder.Entity<Order>()
                .Property(o => o.FinalAmount).HasPrecision(18, 2);
            builder.Entity<Order>()
                .Property(o => o.OriginalPrice).HasPrecision(18, 2);
            builder.Entity<Order>()
                .Property(o => o.FinalPrice).HasPrecision(18, 2);

            // Relationships
            builder.Entity<Order>()
                .HasOne(o => o.User)
                .WithMany()
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Order>()
                .HasOne(o => o.Product)
                .WithMany()
                .HasForeignKey(o => o.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<ProductSubscription>()
                .HasOne(s => s.Product)
                .WithMany(p => p.Subscriptions)
                .HasForeignKey(s => s.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}