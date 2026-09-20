# Changelog - Trio Electronic Store

All notable changes and updates made to the project are documented in this file.

---

## [Unreleased] - 2026-09-19

### Fixed & Improved
- **Automated Order Confirmation Emails**: Implemented rich HTML confirmation emails dispatched to customers upon placing an order via Nodemailer Gmail SMTP (`sulemanmunir6752@gmail.com`). Emails feature branded styling, complete product details, pricing summary, free delivery status, 2-4 business day delivery timeline, customer address, and direct order tracking button.
- **Password Reset Live Email Delivery Fix**: Added direct SMTP fallback credentials in `authController.js` and repointed client API endpoints to active backend `electronic-store-9xxs.vercel.app`, ensuring password reset emails are delivered to recipients' inboxes via Gmail SMTP.
- **Order Total Price Jump Resolved**: Fixed discrepancy where order total jumped from Rs 419 at checkout to Rs 444 on confirmation by deploying the zero-shipping-fee logic to the live Vercel backend (`electronic-store-9xxs.vercel.app`), synchronizing server and client math, and correcting legacy orders in MongoDB database.
- **Password Reset User Check**: Added explicit validation so entering an unregistered email displays a clear notification to the user, and enabled native Gmail transport for registered accounts.
- **Gmail SMTP Email Delivery**: Verified Gmail App Password authentication (`sdybgakytxrobkdi`) and configured live SMTP email sending for Password Resets via `sulemanmunir6752@gmail.com`.
- **Password Reset Flow**: Enhanced Forgot Password flow to display an instant `"Reset Password Now"` button on screen and integrated Nodemailer for optional SMTP inbox delivery.
- **MongoDB Atlas Connection Verified**: Successfully connected to Atlas cluster (`ac-4eyohph-shard-00-00.bkcuuwk.mongodb.net`) and seeded initial database data (6 categories, 18 products, 2 coupons, admin user).
- **Security & Secret Protection**: Removed raw MongoDB password from tracked code (`db.js` and `.env.example`). Credentials now load strictly from environment variables (`process.env.MONGODB_URI`).
- **MongoDB Atlas Production Credentials**: Configured exact MongoDB Atlas username (`sulemanmunir6752_db_user`) and password in `server/.env` and `server/config/db.js`.
- **MongoDB Atlas Cluster Connection**: Configured project to connect to cluster0 Atlas database via `server/.env` and dynamic fallback in `server/config/db.js`.
- **Vercel API Rewrite Destination Sync**: Fixed live Vercel frontend proxy routing by updating `client/vercel.json` rewrite target from outdated `97t1` to active server `electronic-store-x34q.vercel.app`.
- **Order Total Price Alignment**: Fixed price discrepancy between checkout summary (e.g. Rs 398) and order placement total (e.g. Rs 423) by ensuring backend `orderService.js` strictly uses `discountPrice` when available.
- **Single Item "Buy Now" Isolation**: Updated `buyNowItem` across Wishlist and Product Details so that clicking "Buy Now" clears old cart items and proceeds to checkout with ONLY the selected product.
- **Checkout Summary Item Count Fix**: Fixed Checkout summary rail displaying incorrect item count by computing total units dynamically from active cart items.
- **Free Shipping Subtitle Update**: Changed Free Shipping text in Footer and Product Details page to `"On all available products"`.
- **Postal Code Validation Fix**: Resolved "Postal code is required" error during order placement by adding automatic fallback to `'N/A'` on checkout frontend payload and updating backend validator with `checkFalsy: true`.
- **Auto-Scroll Navigation**: Implemented auto-scroll to top when navigating between pages and selecting products (`ScrollToTop` handling).
- **Free Shipping Everywhere**: Completely removed shipping fee calculations from cart, checkout summary, order payload, and backend logic.
- **Product Details UI**: Removed "30-Day Returns" and "Warranty" badges from product details view.
- **Bank Discount Logic**: Converted bank discount from percentage to flat PKR amount. Updated Admin panel inputs to "Discount PKR".
- **Footer Trust Bar**: Removed "30-Day Returns" and "2-Year Warranty" blocks from footer trust bar.

---
