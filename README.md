# LinearAI — Automation Store

## Course Information

- Course Title: CSE-3200 Software Development V Lab
- Project Type: Full-stack web application
- Domain: Automation service marketplace

## Tech Stack

### Backend
- ASP.NET Core 10 (C#)
- ASP.NET Core Identity
- Entity Framework Core 10
- PostgreSQL (Neon)
- MailKit

### Frontend
- React + TypeScript + Vite
- Tailwind CSS + HeroUI
- Axios + Framer Motion

---

## Project Overview

LinearAI is a subscription-based platform for selling automation-focused digital services — AI workflows, pipelines, and scripts. It supports product browsing, cart management, voucher discounts, order placement, feedback collection, and full admin-side operational control.

---

## API Design

The backend exposes a REST API consumed by the React frontend. All API endpoints are under `/api/` and return a consistent JSON envelope:

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "..." }
```

Paginated endpoints additionally return:
```json
{ "success": true, "data": [...], "pagination": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 } }
```

### API Endpoints

#### Auth — `/api/auth`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/register` | Public | Register with email confirmation |
| POST | `/login` | Public | Cookie-based login with lockout |
| GET | `/me` | Required | Get current user info |
| POST | `/logout` | Required | Sign out |

#### Products — `/api/products`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | Public | List all active products with subscriptions |
| GET | `/{id}` | Public | Get single product with subscriptions |
| POST | `/buy` | Required | Quick single-product order |

#### User Panel — `/api/user`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/home` | User/Admin | Home data — products, voucher, cart count |
| GET | `/products` | User/Admin | All active products |
| GET | `/products/{id}` | User/Admin | Single product |
| GET | `/cart` | User/Admin | Cart summary with optional `?voucherCode=` preview |
| POST | `/cart/items` | User/Admin | Add item to session cart |
| DELETE | `/cart/items/{productId}` | User/Admin | Remove item (optional `?durationMonths=`) |
| POST | `/cart/voucher` | User/Admin | Preview voucher discount |
| POST | `/checkout` | User/Admin | Place orders from cart |
| GET | `/orders` | User/Admin | User's own order history |
| GET | `/account` | User/Admin | Account details |

#### Admin — `/api/admin`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/dashboard` | Admin | Platform stats |
| GET | `/products` | Admin | All products with subscriptions |
| POST | `/products` | Admin | Create product |
| PUT | `/products/{id}` | Admin | Update product |
| DELETE | `/products/{id}` | Admin | Delete or soft-deactivate product |
| POST | `/products/{id}/subscriptions` | Admin | Upsert subscription plan |
| DELETE | `/subscriptions/{id}` | Admin | Delete subscription plan |
| GET | `/vouchers?page=&pageSize=` | Admin | Paginated voucher list |
| POST | `/vouchers` | Admin | Create voucher |
| PATCH | `/vouchers/{id}/toggle` | Admin | Activate / deactivate voucher |

#### Orders — `/api/orders`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/?page=&pageSize=` | Admin | Paginated order list |
| PATCH | `/{id}/status` | Admin | Update payment status |

#### Feedback — `/api/feedback`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/` | Required | Submit feedback or contact message |
| GET | `/public` | Public | Published reviews for home carousel |
| GET | `/admin` | Admin | All feedback and contact messages |
| PATCH | `/{id}/post` | Admin | Toggle public visibility |

---

## Security

- **Authentication:** ASP.NET Core Identity with cookie-based sessions (7-day expiry)
- **Email confirmation:** Required before login
- **Account lockout:** 5 failed attempts → 15-minute lock
- **Role-based authorization:** `Admin` and `User` roles, enforced per endpoint
- **Rate limiting** (built-in ASP.NET Core `RateLimiter`, per-IP or per-user):

| Policy | Limit | Window | Applied to |
|--------|-------|--------|------------|
| `auth` | 20 req | 5 min | Login, Register |
| `public` | 60 req | 1 min | Public product/feedback reads |
| `api` | 120 req | 1 min | Authenticated user reads |
| `write` | 30 req | 1 min | Cart, checkout, feedback submit |
| `admin` | 300 req | 1 min | All admin endpoints |

- **429 responses** include `Retry-After` header
- **Security headers** on every response: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection: 0`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy: default-src 'none'` (API routes)
- **Input validation:** All request DTOs use `[Required]`, `[StringLength]`, `[Range]`, `[RegularExpression]` — invalid payloads auto-rejected with `400`
- **Global exception handler:** Unhandled exceptions return uniform JSON, no stack trace leaks in production
- **CORS:** Restricted to configured origins with credentials

---

## Business Logic

- **Subscription pricing:** Each product has multiple duration plans with `DiscountPercent`, computed `FinalPrice`
- **Bundle discounts:** 2 items → 10% off subtotal, 3+ items → 15% off subtotal
- **Voucher validation:** Active status, expiry date, usage limit, minimum order amount, maximum discount cap
- **Atomic voucher claim:** Checkout uses a single `ExecuteUpdate(...WHERE UsedCount < limit)` to prevent race conditions under concurrent checkouts
- **Soft delete:** Products with existing orders are deactivated, not hard-deleted
- **Payment status:** Pending → Paid / Cancelled / Refunded (admin-controlled)

---

## Database

**Entities:** `ApplicationUser`, `Product`, `ProductSubscription`, `Order`, `Voucher`, `Feedback`

- PostgreSQL on Neon with EF Core migrations
- Retry on failure: 3 attempts, 5s delay
- Dev: auto-migrate on startup. Production: startup fails fast if pending migrations exist
- Decimal precision: 18,2 for all price fields
- Cascade: subscriptions and feedbacks. Restrict: user/product order foreign keys

ERD available in [ERD.md](ERD.md).

---

## Project Structure

```
LinearAi_v1/
├── Controllers/
│   ├── Api/              # REST API controllers
│   └── ...               # MVC controllers (views)
├── Data/                 # ApplicationDbContext
├── Infrastructure/       # Rate limiting, exception handler, security headers
├── Models/               # Entities and view models
├── Services/             # Email service
├── Migrations/           # EF Core migration history
├── client/               # React + TypeScript frontend (Vite)
└── wwwroot/              # Static assets
```

---

## Running Locally

**Prerequisites:** .NET 10 SDK, Node.js 18+, PostgreSQL (or Neon connection string)

```bash
# 1. Configure connection string
# appsettings.Development.json → ConnectionStrings:DefaultConnection

# 2. Run backend (auto-migrates in Development)
dotnet run

# 3. Run frontend (separate terminal)
cd client
npm install
npm run dev
```

Backend: `http://localhost:5143`
Frontend dev server: `http://localhost:5173`

---

## Functional Flow

1. User registers → email confirmation sent
2. User confirms email → can log in
3. Browse products → select subscription plan → add to cart
4. Optionally apply a voucher code
5. Checkout → orders created with pending payment status
6. Admin reviews orders → marks payment status
7. Admin manages products, plans, vouchers, and feedback from the admin panel
