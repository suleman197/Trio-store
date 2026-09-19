# Changelog - Trio Electronic Store

All notable changes and updates made to the project are documented in this file.

---

## [Unreleased] - 2026-09-19

### Fixed & Improved
- **Checkout Summary Item Count Fix**: Fixed Checkout summary rail displaying incorrect item count by computing total units dynamically from active cart items.
- **Free Shipping Subtitle Update**: Changed Free Shipping text in Footer and Product Details page to `"On all available products"`.
- **Postal Code Validation Fix**: Resolved "Postal code is required" error during order placement by adding automatic fallback to `'N/A'` on checkout frontend payload and updating backend validator with `checkFalsy: true`.
- **Auto-Scroll Navigation**: Implemented auto-scroll to top when navigating between pages and selecting products (`ScrollToTop` handling).
- **Free Shipping Everywhere**: Completely removed shipping fee calculations from cart, checkout summary, order payload, and backend logic.
- **Product Details UI**: Removed "30-Day Returns" and "Warranty" badges from product details view.
- **Bank Discount Logic**: Converted bank discount from percentage to flat PKR amount. Updated Admin panel inputs to "Discount PKR".
- **Footer Trust Bar**: Removed "30-Day Returns" and "2-Year Warranty" blocks from footer trust bar.

---
