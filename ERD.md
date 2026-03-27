# Linear AI ERD

This ERD reflects the current Entity Framework Core model in the app.

## Mermaid ERD

```mermaid
erDiagram
    ApplicationUser {
        string Id PK
        string UserName
        string Email
        string PhoneNumber
        string FullName
        datetime CreatedAt
        bool IsActive
    }

    Product {
        int Id PK
        string Title
        string ShortDescription
        decimal Price
        bool IsActive
        datetime CreatedAt
    }

    ProductSubscription {
        int Id PK
        int ProductId FK
        int DurationMonths
        decimal Price
        decimal DiscountPercent
        bool IsActive
    }

    Voucher {
        int Id PK
        string Code
        string Description
        decimal DiscountPercent
        decimal MaxDiscountAmount
        decimal MinimumOrderAmount
        datetime ExpiryDate
        int UsageLimit
        int UsedCount
        bool IsActive
        datetime CreatedAt
    }

    Feedback {
        int Id PK
        string Message
        string Type
        string Subject
        string UserId FK
        bool IsPosted
        datetime CreatedAt
    }

    Order {
        int Id PK
        string UserId FK
        int ProductId FK
        int Quantity
        decimal UnitPrice
        decimal TotalAmount
        decimal DiscountAmount
        decimal FinalAmount
        int VoucherId FK
        string VoucherCode
        string PaymentStatus
        datetime OrderDate
        int DurationMonths
        decimal OriginalPrice
        decimal FinalPrice
        datetime SubscriptionEndDate
    }

    ApplicationUser ||--o{ Order : places
    Product ||--o{ Order : appears_in
    Product ||--o{ ProductSubscription : has
    ApplicationUser ||--o{ Feedback : submits
    Voucher ||--o{ Order : applied_to
```

## Relationship Notes

- One `ApplicationUser` can have many `Order` rows.
- One `ApplicationUser` can have many `Feedback` rows.
- One `Product` can have many `ProductSubscription` plans.
- One `Product` can appear in many `Order` rows.
- One `Voucher` can be referenced by many `Order` rows, but `VoucherId` is optional.
- `ProductSubscription.FinalPrice` is calculated in code and is not stored in the database.
- `Voucher.IsValid` is calculated in code and is not stored in the database.

## Identity Tables

Because `ApplicationDbContext` inherits from `IdentityDbContext<ApplicationUser>`, the database also includes standard ASP.NET Identity tables such as:

- `AspNetUsers`
- `AspNetRoles`
- `AspNetUserRoles`
- `AspNetUserClaims`
- `AspNetUserLogins`
- `AspNetUserTokens`
- `AspNetRoleClaims`

## Source

- [ApplicationDbContext.cs](/e:/vs%20code%20projects/linear_frontend/LinearAi_v1/Data/ApplicationDbContext.cs)
- [ApplicationUser.cs](/e:/vs%20code%20projects/linear_frontend/LinearAi_v1/Models/ApplicationUser.cs)
- [Product.cs](/e:/vs%20code%20projects/linear_frontend/LinearAi_v1/Models/Product.cs)
- [Order.cs](/e:/vs%20code%20projects/linear_frontend/LinearAi_v1/Models/Order.cs)
- [Voucher.cs](/e:/vs%20code%20projects/linear_frontend/LinearAi_v1/Models/Voucher.cs)
- [Feedback.cs](/e:/vs%20code%20projects/linear_frontend/LinearAi_v1/Models/Feedback.cs)
