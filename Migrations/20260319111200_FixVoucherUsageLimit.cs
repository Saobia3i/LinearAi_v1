using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Linear_v1.Migrations
{
    /// <inheritdoc />
    public partial class FixVoucherUsageLimit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // MaxUses may not exist in legacy databases — drop only if present
            migrationBuilder.Sql("""
                ALTER TABLE "Vouchers" DROP COLUMN IF EXISTS "MaxUses";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxUses",
                table: "Vouchers",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
