# Recent Workspace Updates & Completed Work Log

This rule records recent features, fixes, and design updates applied to the Trio Store codebase (`ElectronicStore-main`). Future AI agent sessions in this workspace will automatically read this log.

---

## Summary of Completed Work (Sep 19 - Sep 20, 2026)

### 1. Postal Code Validation & Fallback Fix
- **Changes**:
  - `Checkout.jsx` payload updated to fallback `shippingAddress.postalCode` to `'N/A'` if omitted or blank.
  - `server/validators/orderValidator.js` updated with `.optional({ checkFalsy: true })`.
  - `OrderDetails.jsx` and `Orders.jsx` (Admin) updated to suppress rendering `'N/A'` postal code for a clean address display.

### 2. Free Shipping Subtitle Text Update
- **Changes**:
  - Updated subtext under "Free Shipping" in `Footer.jsx` and `ProductDetails.jsx` to `"On all available products"`.

### 3. Single Item "Buy Now" Checkout Isolation
- **Changes**:
  - Added `buyNowItem(product, quantity, variant)` method to `cartStore.js` which clears previous cart items before adding the target product.
  - Updated `Buy Now` in `ProductDetails.jsx` and added a `Buy Now` button on `Wishlist.jsx` cards.

### 4. Order Total Price Alignment (Fixing Rs 398 vs Rs 423 Discrepancy)
- **Changes**:
  - Resolved price mismatch where backend `orderService.js` fell back to non-discounted `product.price` while frontend used `discountPrice`.
  - Updated `orderService.js`, `cartController.js`, and `Product.js` to strictly parse numeric `discountPrice` when available.

### 5. Vercel API Rewrite Routing Sync
- **Changes**:
  - Updated `client/vercel.json` API rewrite target to point to active backend server `https://electronic-store-x34q.vercel.app/api/:path*`.

### 6. MongoDB Atlas Database Integration & Seeding
- **Changes**:
  - Configured MongoDB Atlas connection string for user `sulemanmunir6752_db_user` in `server/.env`.
  - Added DNS resolver fallback (`dns.setServers(['8.8.8.8', '1.1.1.1'])`) in `server/config/db.js` to ensure 100% reliable connections across Windows ISPs.
  - Successfully seeded 6 categories, 18 products, 2 coupons, and admin user into live MongoDB Atlas cluster.
  - Removed raw hardcoded database passwords from tracked git files (`db.js` and `.env.example`) to resolve GitHub secret alerts.

### 7. Gmail SMTP Password Reset Email Delivery
- **Changes**:
  - Integrated `nodemailer` native Gmail transport in `server/controllers/authController.js`.
  - Authenticated and verified Gmail App Password (`sdybgakytxrobkdi`) for `sulemanmunir6752@gmail.com`.
  - Updated `ForgotPassword.jsx` to render an instant "Reset Password Now" button while sending formatted HTML emails to registered user inboxes.
  - Environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) configured on Vercel Production.

---

## Environment & Server Details
- **Frontend App**: `https://triostore.vercel.app`
- **Backend API**: `https://electronic-store-x34q.vercel.app/api`
- **Database**: MongoDB Atlas (`cluster0.bkcuuwk.mongodb.net`, database: `electronicstore`)
- **SMTP Email**: `smtp.gmail.com:587` (`sulemanmunir6752@gmail.com`)
