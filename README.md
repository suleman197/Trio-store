# TRIO — Premium Electronics Store

A production-ready, full-stack e-commerce application with a premium black-and-white design.

- **Frontend:** React 18 + Vite · React Router · Zustand · Tailwind CSS v4 · Lucide icons · Recharts
- **Backend:** Node.js + Express · MongoDB Atlas · Mongoose · JWT auth · bcryptjs
- **Testing:** 68-assertion end-to-end API smoke suite (`npm run smoke` in `server/`)

```
ElectronicStore/
├── client/   # React storefront + admin dashboard
└── server/   # Express REST API
```

---

## Quick Start

### 1. Backend

```bash
cd server
npm install
cp .env.example .env        # then paste your MongoDB Atlas URI into MONGODB_URI
npm run seed                # seeds admin, 6 categories, 18 products, 2 coupons
npm run dev                 # API on http://localhost:5000
```

**`server/.env`**

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/electronicstore
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=https://electronic-store-opal-three.vercel.app
```

> Get a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas). Allow your IP under Network Access, and use the connection string for your database (name it e.g. `electronicstore`).

### 2. Frontend

```bash
cd client
npm install
npm run dev                 # app on https://electronic-store-opal-three.vercel.app (proxies /api → :5000)
```

### Seeded accounts

| Role     | Email               | Password    |
| -------- | ------------------- | ----------- |
| Admin    | `admin@example.com` | `Admin@123` |
| Customer | register via UI     | —           |

Coupons: `WELCOME10` (10% off ≥ $50) · `SAVE50` ($50 off ≥ $800)

---

## Verification

```bash
# full backend E2E suite against an in-memory MongoDB (no setup needed)
cd server && npm run smoke

# frontend production build
cd client && npm run build
```

The smoke suite covers: auth flows (register/login/forgot/reset), RBAC (401/403),
catalog filters/sort/search/autocomplete, cart, wishlist, coupon validation,
order placement with atomic stock decrement + inventory logging, verified-purchase
review gating, moderation, inventory adjustments with history, product/category/coupon
CRUD, customer management, order status workflow, cancellation stock restore,
consistent error envelopes, and secret-leak checks.

---

## Feature Overview

### Storefront (`/`)
- Hero, category tiles, featured/bestseller/latest sections, deals banner, newsletter
- Shop with URL-synced filters: search, category, brand, price, rating, availability + sort & pagination (`/shop?category=smartphones&sort=price-low&page=1`)
- Product details: gallery, variations (color/storage/RAM), specs, warranty/shipping tabs, related products
- Reviews with star breakdown; only verified purchasers can review (admin-approved)
- Cart drawer + full cart page with coupon codes, live totals (shipping free over $500, 5% tax)
- 5-step checkout (info → address → summary → COD payment → confirmation)
- Order history with status timeline & self-service cancellation (restores stock)
- Wishlist, autocomplete header search, toasts, skeletons, empty states, fully responsive

### Admin (`/admin`, role-protected)
- Dashboard: KPIs (sales, orders, products, customers, pending, low/out of stock), sales chart, best sellers
- Products: create/edit/delete, images by URL (Cloudinary-ready), dynamic specs/features/variations, enable/disable
- Categories CRUD with delete protection
- Inventory: tri-state status, increase/decrease/set with mandatory reason, full adjustment history
- Orders: search/filter, status & payment updates, cancel-with-stock-restore
- Customers: stats, order history, activate/deactivate
- Reviews moderation · Coupons CRUD · Settings overview

---

## API Summary

Base URL `/api`. All responses use `{ success, message, data }` / `{ success, false… error }`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register` `POST /auth/login` `POST /auth/logout` `GET /auth/me` `PUT /auth/me` `POST /auth/forgot-password` `POST /auth/reset-password` |
| Products | `GET /products` (search/category/brand/minPrice/maxPrice/rating/inStock/featured/bestseller/sort/page) · `GET /products/:idOrSlug` · `GET /products/brands` · admin: `POST` `PUT /:id` `DELETE /:id` `PATCH /:id/status` |
| Reviews | `GET /products/:id/reviews` · `POST /products/:id/reviews` (verified purchase) |
| Categories | `GET /categories` `GET /categories/:id` · admin: `POST` `PUT /:id` `DELETE /:id` |
| Cart 🔒 | `GET /cart` `POST /cart` `PUT /cart/:itemId` `DELETE /cart/:itemId` `DELETE /cart` |
| Wishlist 🔒 | `GET /wishlist` `POST /wishlist/:productId` `DELETE /wishlist/:productId` |
| Orders 🔒 | `POST /orders` `GET /orders` `GET /orders/:idOrNumber` `PUT /orders/:id/cancel` |
| Coupons 🔒 | `POST /coupons/validate` · admin: `GET/POST/PUT/DELETE /coupons` |
| Search | `GET /search/suggest?q=` · `POST /search/newsletter` |
| Admin 🔐 | `GET /admin/dashboard` · `GET /admin/orders` `GET /admin/orders/:id` `PUT /admin/orders/:id/status` `PUT /admin/orders/:id/payment` · `GET /admin/customers` `GET /admin/customers/:id` `PATCH /admin/customers/:id/status` · `GET /admin/inventory` `PATCH /admin/inventory/:productId/adjust` `GET /admin/inventory/:productId/history` · `GET/PATCH/DELETE /admin/reviews…` |

🔒 requires JWT · 🔐 requires admin JWT

---

## Architecture Notes

- Frontend never touches MongoDB directly; all data flows through the REST API.
- Secrets live only in `server/.env` (gitignored). CORS restricted to `CLIENT_URL`; helmet, rate limiting on auth, express-validator input validation, centralized error handler mapping Mongo errors (cast/duplicate/validation) to clean responses.
- Order creation atomically decrements stock (`$inc` guarded by `stock >= qty`) and writes an `InventoryLog` entry; cancellations reverse it.
- Payments are structured as a method string (`cod`) + status enum so Stripe/PayPal plug into `server/services/orderService.js` without schema changes.
- Guest carts live in localStorage and merge into the server cart at login.

## Deployment

- **Frontend:** Vercel/Netlify — build command `npm run build`, output `dist/`. Set `VITE_…` proxy replacement by pointing `services/api.js` baseURL at the API URL.
- **Backend:** Render/Railway/AWS — start command `npm start`, set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` env vars.

