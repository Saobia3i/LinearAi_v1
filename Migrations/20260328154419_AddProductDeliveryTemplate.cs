using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Linear_v1.Migrations
{
    /// <inheritdoc />
    public partial class AddProductDeliveryTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeliveryTemplate",
                table: "Products",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryTemplate",
                table: "Products");
        }
    }
}
