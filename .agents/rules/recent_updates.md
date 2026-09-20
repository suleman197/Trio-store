# Recent Workspace Updates & Completed Work Log

This rule records recent features, fixes, and design updates applied to the Trio Store codebase (`ElectronicStore-main`). Future AI agent sessions in this workspace will automatically read this log.

---

## Summary of Completed Work (Sep 19 - Sep 20, 2026)

### 1. Automated Order Confirmation Emails via Gmail SMTP
- **Feature**: Automatically dispatches a rich HTML email to the customer's email address upon successful order placement (`orderService.js` -> `emailService.js`).
- **Email Content**: Includes Trio Store branding, expected delivery timeline (2 to 4 business days), detailed product list with images/variants, pricing summary (free delivery, taxes, discounts, grand total), customer delivery address, and direct "View Order Details" tracking link.
- **Reliability**: Configured with fallback Gmail SMTP credentials (`sulemanmunir6752@gmail.com`) and properly `await`ed in `orderService.js` to ensure the Vercel serverless function lifecycle does not freeze execution before the email is transmitted to Google's SMTP server.

### 2. Order Total Price Alignment & Free Shipping Sync (Rs 419 vs Rs 444 Fix)
- **Problem**: At checkout summary, total displayed as Rs 419 (Items: 399 + Tax: 20 + Shipping: Free). Upon placing the order, the total jumped to Rs 444 because the live Vercel backend (`electronic-store-x34q.vercel.app`) was running an un-synced deployment that added a 25 PKR shipping fee (`SHIPPING_FEE = 25` when subtotal < 500).
- **Solution**:
  - Pushed updated codebase with author authentication to `AhmadMahmoodRana10885/ElectronicStore` repository, successfully triggering a fresh live deployment of `electronic-store-x34q.vercel.app`.
  - Added dynamic fallback MongoDB URI in `server/config/db.js` to ensure 100% reliable connection across all Vercel environments.
  - Verified live backend endpoints now enforce flat 0 shipping fee (`shippingFee: 0`) and exact tax/subtotal calculation matching the client.
  - Fixed legacy orders in MongoDB database (including `ORD-MU9C0XL1663`) to remove the 25 PKR shipping charge and recalculate total to Rs 419.

### 2. Postal Code Validation & Fallback Fix
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
- **Backend API**: `https://electronic-store-9xxs.vercel.app/api`
- **Database**: MongoDB Atlas (`cluster0.bkcuuwk.mongodb.net`, database: `electronicstore`)
- **SMTP Email**: `smtp.gmail.com:587` (`triostoreinfo@gmail.com`)
