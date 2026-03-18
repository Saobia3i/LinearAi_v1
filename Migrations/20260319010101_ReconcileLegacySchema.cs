using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Linear_v1.Migrations
{
    [DbContext(typeof(Data.ApplicationDbContext))]
    [Migration("20260319010101_ReconcileLegacySchema")]
    public partial class ReconcileLegacySchema : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Vouchers"
                    ADD COLUMN IF NOT EXISTS "MaxDiscountAmount" numeric NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "MinimumOrderAmount" numeric NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "UsageLimit" integer,
                    ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW();
                """);

            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'Vouchers'
                          AND column_name = 'MaxUses'
                    ) THEN
                        UPDATE "Vouchers"
                        SET "UsageLimit" = NULLIF("MaxUses", 0)
                        WHERE "UsageLimit" IS NULL;
                    END IF;
                END
                $$;
                """);

            migrationBuilder.Sql("""
                ALTER TABLE "Orders"
                    ADD COLUMN IF NOT EXISTS "DurationMonths" integer,
                    ADD COLUMN IF NOT EXISTS "OriginalPrice" numeric(18,2) NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "FinalPrice" numeric(18,2) NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "SubscriptionEndDate" timestamp with time zone,
                    ADD COLUMN IF NOT EXISTS "VoucherCode" text;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
