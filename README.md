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
- PostgreSQL
- MailKit

### Frontend
- React + TypeScript + Vite
- Tailwind CSS + HeroUI
- Axios + Framer Motion

---

## Project Overview

LinearAI is a subscription-based platform for selling automation-focused digital services — AI workflows, pipelines, and scripts. It supports product browsing, cart management, voucher discounts, order placement, feedback collection, and full admin-side operational control.

The backend is the primary focus of this project. It is designed around SaaS-level engineering principles — clean API design, layered security, atomic business logic, and scalability-aware data access.

---

## API Design

All API endpoints live under `/api/` and follow a consistent contract:

**Success response:**
```
{ "success": true, "data": { ... }, "message": "..." }
```

**Error response:**
```
{ "success": false, "message": "Descriptive error message" }
```

**Validation error response (400):**
```
{ "success": false, "errors": ["Field X is required", ...] }
```

**Paginated response:**
```
{ "success": true, "data": [...], "pagination": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 } }
```

Every error status code on `/api/*` routes — including `401`, `403`, `404`, and `429` — always returns a JSON body. No HTML error pages, no empty responses.

---

## API Endpoints

### Auth — `/api/auth`

| Method | Route | Auth Required | Description |
|--------|-------|---------------|-------------|
| POST | `/register` | No | Create a new user account. Sends an email confirmation link. Returns `409` if email already registered. |
| POST | `/login` | No | Authenticate with email and password. Sets a server-side session cookie. Returns `423` if account is locked out. |
| GET | `/me` | Yes | Returns the currently authenticated user's id, name, email, and role. |
| POST | `/logout` | Yes | Destroys the server-side session. |

---

### Public Products — `/api/products`

| Method | Route | Auth Required | Description |
|--------|-------|---------------|-------------|
| GET | `/` | No | Returns all active products, each with their active subscription plans ordered by duration. |
| GET | `/{id}` | No | Returns a single active product with its subscription plans. Returns `404` if not found or inactive. |
| POST | `/buy` | Yes | Places a direct single-product order without going through the cart. |

---

### User Panel — `/api/user`

All routes in this group require authentication with the `User` or `Admin` role.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/home` | Returns home page data — latest products, featured products, best active voucher code, and current cart item count. |
| GET | `/products` | Returns all active products with their active subscription plans. |
| GET | `/products/{id}` | Returns a single active product with its subscription plans. |
| GET | `/cart` | Returns current session cart items and checkout summary. Accepts optional `?voucherCode=` query parameter for a live discount preview without applying the voucher. |
| POST | `/cart/items` | Adds a product + subscription plan to the session cart. Returns `409` if the same product and duration is already in the cart. Returns `400` if the product or plan is not found or inactive. |
| DELETE | `/cart/items/{productId}` | Removes an item from the cart. Accepts optional `?durationMonths=` to target a specific plan — otherwise removes all plans for that product. |
| POST | `/cart/voucher` | Previews a voucher discount on the current cart without applying it. Returns discount breakdown including bundle discount, voucher discount, and final total. |
| POST | `/checkout` | Places orders for all items currently in the cart. Applies bundle discount and voucher if provided. Clears the cart on success. Returns `400` if cart is empty. Returns `409` if the voucher was claimed by a concurrent checkout. |
| GET | `/orders` | Returns the authenticated user's full order history ordered by date descending. |
| GET | `/account` | Returns profile information for the authenticated user. |

---

### Admin — `/api/admin`

All routes in this group require the `Admin` role.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/dashboard` | Returns platform-wide statistics — total users, total orders, pending orders, total products, active products, total vouchers, active vouchers. |
| GET | `/products` | Returns all products (active and inactive) with their full subscription plan lists. |
| POST | `/products` | Creates a new product. Validated fields: title (2–200 chars), short description (2–1000 chars), price (0–1,000,000). |
| PUT | `/products/{id}` | Updates an existing product's title, description, price, and active status. |
| DELETE | `/products/{id}` | If the product has no orders — hard deletes the product and its subscription plans. If orders exist — soft-deactivates the product and all its plans to preserve order history. |
| POST | `/products/{id}/subscriptions` | Creates or updates a subscription plan for a product. Upserts by product ID + duration months combination. |
| DELETE | `/subscriptions/{id}` | Permanently deletes a subscription plan. |
| GET | `/vouchers?page=1&pageSize=20` | Returns a paginated list of all vouchers ordered by creation date descending. |
| POST | `/vouchers` | Creates a new voucher. Validated fields: code (3–50 chars, uppercase alphanumeric with hyphens/underscores only), discount percent (1–100), max discount amount, minimum order amount, optional usage limit, optional expiry date. Returns `409` if code already exists. |
| PATCH | `/vouchers/{id}/toggle` | Toggles a voucher between active and inactive. |

---

### Orders — `/api/orders`

All routes require the `Admin` role.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/?page=1&pageSize=20` | Returns a paginated list of all orders across all users, ordered by date descending. Each entry includes client email, product name, price, payment status, and order date. |
| PATCH | `/{id}/status` | Updates the payment status of an order. Accepted values: `Pending`, `Paid`, `Failed`, `Cancelled`, `Refunded`. |

---

### Feedback — `/api/feedback`

| Method | Route | Auth Required | Description |
|--------|-------|---------------|-------------|
| POST | `/` | Yes | Submits a feedback or contact message. Type must be `feedback` or `contact`. Message length: 5–2000 chars. Subject optional, max 200 chars. |
| GET | `/public` | No | Returns all feedback entries marked as posted, used for the public home page review carousel. |
| GET | `/admin` | Admin | Returns all feedback and contact messages with user details. |
| PATCH | `/{id}/post` | Admin | Toggles whether a feedback entry is publicly visible. Only entries of type `feedback` can be posted — contact messages are rejected with `400`. |

---

## Security

### Authentication and Authorization
- Cookie-based sessions managed by ASP.NET Core Identity
- Email confirmation required before first login
- Account lockout after 5 failed login attempts — locked for 15 minutes
- Role-based authorization enforced at the controller level — `[Authorize(Roles = "Admin")]` and `[Authorize(Roles = "User,Admin")]`
- Unauthenticated requests to protected routes return `401 Authentication required`
- Authenticated requests to insufficiently privileged routes return `403 Access forbidden`

### Rate Limiting

Built using ASP.NET Core's built-in `RateLimiter` with fixed-window partitions. Keyed by authenticated user identity where available, falling back to IP address for anonymous requests.

| Policy | Max Requests | Window | Keyed By | Applied To |
|--------|-------------|--------|----------|------------|
| `auth` | 20 | 5 minutes | IP address | Login, Register |
| `public` | 60 | 1 minute | IP address | Public product and feedback reads |
| `api` | 120 | 1 minute | User identity / IP | All authenticated user reads |
| `write` | 30 | 1 minute | User identity / IP | Cart mutations, checkout, feedback submit |
| `admin` | 300 | 1 minute | User identity | All admin endpoints |

Exceeded limits return `429 Too Many Requests` with a `Retry-After` header indicating when the window resets.

Auth endpoint rate limiting complements Identity's account lockout — rate limiting slows credential-stuffing scripts at the network level while lockout protects individual accounts at the application level.

### Input Validation
All request DTOs are validated using ASP.NET Core model validation attributes. Invalid payloads are rejected with `400` before reaching any business logic. Validated constraints include required fields, string length bounds, numeric ranges, and format patterns (e.g. voucher code character set).

### Security Headers
Applied to every HTTP response via custom middleware:

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `0` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera, microphone, geolocation, payment all blocked |
| `Content-Security-Policy` | `default-src 'none'` on all `/api/` routes |
| `Strict-Transport-Security` | Enabled on HTTPS connections, 1-year max-age |

### Global Exception Handling
A centralized `IExceptionHandler` catches any unhandled exception that escapes the controller pipeline. API routes always receive a uniform JSON error response. Stack traces are never included in production responses.

### CORS
Restricted to explicitly configured origins. Credentials are allowed. Wildcard origins are not permitted.

---

## Business Logic

### Subscription Pricing
Each product supports multiple subscription plans with a duration in months, a base price, and a discount percentage. The final price is computed from these and stored as a calculated property on the plan.

### Bundle Discounts
Applied automatically at checkout and cart preview based on the number of distinct items in the cart:
- 2 items → 10% off the cart subtotal
- 3 or more items → 15% off the cart subtotal

### Voucher System
Vouchers are validated against six conditions before being applied:
1. Voucher must exist and be active
2. Must not be expired (expiry date check against UTC now)
3. Must not have exceeded its usage limit (if a limit is set)
4. Cart subtotal after bundle discount must meet the minimum order amount (if set)
5. Computed voucher discount is capped at the maximum discount amount (if set)
6. Voucher code is normalized to uppercase before any comparison

### Atomic Voucher Claiming
Concurrent checkout requests cannot both claim the last usage slot of a voucher. The increment is performed as a single database-level conditional update — `UPDATE ... WHERE UsedCount < UsageLimit`. If zero rows are affected, the checkout returns `409 Conflict` immediately, preventing double-spending without requiring application-level locks.

### Soft Delete
Deleting a product that has associated orders does not remove the record. Instead, the product and all its subscription plans are marked inactive. This preserves the integrity of existing order records and order history for users and admins.

### Payment Status Lifecycle
Orders are created with `Pending` status. Admin can transition any order to `Paid`, `Failed`, `Cancelled`, or `Refunded`.

### Cart
Cart state is stored in the server-side session, serialized as JSON. The cart is cleared automatically after a successful checkout.

---

## Database

**Entities:** `ApplicationUser`, `Product`, `ProductSubscription`, `Order`, `Voucher`, `Feedback`

- PostgreSQL with EF Core code-first migrations
- Transient failure retry: up to 3 attempts with 5-second delay between retries
- Development: migrations are applied automatically on startup
- Production: startup aborts if any pending migrations are detected — schema must be manually updated before deploying
- All price and discount fields use decimal precision (18, 2)
- Cascade delete: `ProductSubscription` on `Product`, `Feedback` on `ApplicationUser`
- Restrict delete: `Order` foreign keys to `ApplicationUser` and `Product` — orders are never silently removed

ERD available in [ERD.md](ERD.md).

---

## Project Structure

```
LinearAi_v1/
├── Controllers/
│   ├── Api/              # REST API controllers (AuthApi, UserApi, AdminApi, OrdersApi, ProductsApi, FeedbackApi)
│   └── ...               # MVC controllers for server-rendered views
├── Data/                 # ApplicationDbContext and EF Core configuration
├── Infrastructure/       # Rate limiting policies, global exception handler, security headers middleware
├── Models/               # Entity classes, enums, and view models
├── Services/             # Email service interface and SMTP implementation
├── Migrations/           # EF Core migration history
├── client/               # React + TypeScript frontend (Vite)
└── wwwroot/              # Static assets
```

---

## Running Locally

**Prerequisites:** .NET 10 SDK, Node.js 18+, PostgreSQL connection string

```bash
# 1. Add connection string and seed user credentials to appsettings.Development.json
#    This file is excluded from version control — do not put credentials in appsettings.json

# 2. Start the backend — auto-migrates and seeds roles in Development mode
dotnet run

# 3. Start the frontend dev server in a separate terminal
cd client
npm install
npm run dev
```

Backend: `http://localhost:5143`
Frontend dev server: `http://localhost:5173`

---

## Functional Flow

1. User registers — email confirmation link is sent via SMTP
2. User confirms email — login becomes available
3. User browses products and selects a subscription plan duration
4. Items are added to the server-side session cart
5. An optional voucher code is previewed at the cart stage or submitted at checkout
6. User checks out — orders are created with `Pending` payment status, cart is cleared
7. Admin reviews orders and updates payment status
8. Admin manages products, subscription plans, vouchers, and feedback from the admin panel
