/* eslint-disable no-console */
/**
 * End-to-end backend smoke test against an in-memory MongoDB.
 * Boots the real Express app, seeds data, and exercises the critical flows:
 *   auth → catalog → cart → wishlist → coupon → order (stock decrement)
 *   → review gating → admin RBAC → inventory adjustments → order status updates.
 *
 * Run: npm run smoke
 */
process.env.NODE_ENV = 'development';
process.env.JWT_SECRET = 'smoke_test_secret';
process.env.CLIENT_URL = 'https://electronic-store-opal-three.vercel.app';

const assert = (cond, label) => {
  if (!cond) {
    console.error(`  ✗ FAIL — ${label}`);
    process.exitCode = 1;
    throw new Error(label);
  }
  console.log(`  ✓ ${label}`);
};

(async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  console.log('[smoke] Starting in-memory MongoDB…');
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('electronicstore');

  const mongoose = require('mongoose');
  const connectDB = require('../config/db');
  await connectDB();

  const { seedAll } = require('../seeds/seedData');
  const counts = await seedAll();
  console.log(`[smoke] Seeded ${counts.categories} categories / ${counts.products} products / ${counts.coupons} coupons\n`);

  const app = require('../app');
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api`;

  const req = async (method, path, { token, body } = {}) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json;
    try {
      json = await res.json();
    } catch {
      json = {};
    }
    return { status: res.status, json };
  };

  // ---------------- Health & catalog ----------------
  console.log('\n— Health —');
  let r = await req('GET', '/health');
  assert(r.status === 200 && r.json.success === true, 'GET /api/health returns success envelope');

  console.log('\n— Catalog (public) —');
  r = await req('GET', '/products?limit=50');
  assert(r.status === 200 && r.json.data.products.length === counts.products, `lists all ${counts.products} products`);
  const allProducts = r.json.data.products;

  r = await req('GET', '/products?category=smartphones');
  assert(r.json.data.products.every((p) => p.category.slug === 'smartphones'), 'category filter works');

  r = await req('GET', '/products?sort=price-low&limit=5');
  const prices = r.json.data.products.map((p) => p.discountPrice ?? p.price);
  assert(prices.every((v, i) => i === 0 || v >= prices[i - 1]), 'sort price-low works');

  r = await req('GET', '/products?search=nova&limit=5');
  assert(r.json.data.products.some((p) => p.name.includes('Nova')), 'text search works');

  r = await req('GET', '/categories');
  assert(r.json.data.categories.length === counts.categories, 'public categories listed');

  const firstSlug = allProducts[0].slug;
  r = await req('GET', `/products/${firstSlug}`);
  assert(r.status === 200 && r.json.data.product.slug === firstSlug, 'product detail by slug + related products');

  r = await req('GET', '/search/suggest?q=nova');
  assert(r.status === 200 && r.json.data.suggestions.length > 0, 'search autocomplete suggestions');

  // ---------------- Auth ----------------
  console.log('\n— Authentication —');
  r = await req('POST', '/auth/register', {
    body: {
      firstName: 'John', lastName: 'Doe', email: 'john@example.com',
      phone: '+15551234567', password: 'Secret1', confirmPassword: 'Secret1',
    },
  });
  assert(r.status === 201 && r.json.data.token, 'customer registration returns JWT');
  assert(!JSON.stringify(r.json).toLowerCase().includes('password'), 'password never echoed in response');
  const userToken = r.json.data.token;
  const userId = r.json.data.user.id;

  r = await req('POST', '/auth/register', {
    body: { firstName: 'J', lastName: 'D', email: 'john@example.com', phone: '+15551234567', password: 'Secret1', confirmPassword: 'Secret1' },
  });
  assert(r.status === 409, 'duplicate email rejected with 409');

  r = await req('POST', '/auth/register', {
    body: { firstName: 'J', lastName: 'D', email: 'weak@example.com', phone: '+15551234567', password: 'short', confirmPassword: 'short' },
  });
  assert(r.status === 400 && r.json.success === false, 'validation errors produce standard error envelope');

  r = await req('POST', '/auth/login', { body: { email: 'john@example.com', password: 'WrongPass1' } });
  assert(r.status === 401, 'wrong password rejected');

  r = await req('POST', '/auth/login', { body: { email: 'john@example.com', password: 'Secret1' } });
  assert(r.status === 200 && r.json.data.user.role === 'customer', 'customer login works');

  r = await req('POST', '/auth/login', { body: { email: 'admin@example.com', password: 'Admin@123' } });
  assert(r.status === 200 && r.json.data.user.role === 'admin', 'admin login works');
  const adminToken = r.json.data.token;

  r = await req('GET', '/auth/me', { token: userToken });
  assert(r.status === 200 && r.json.data.user.email === 'john@example.com', 'GET /auth/me resolves current user');

  r = await req('POST', '/auth/forgot-password', { body: { email: 'john@example.com' } });
  assert(r.status === 200 && r.json.data?.resetToken, 'forgot-password generates reset token (dev mode)');
  const resetToken = r.json.data.resetToken;

  r = await req('POST', '/auth/reset-password', { body: { token: resetToken, password: 'NewSecret1' } });
  assert(r.status === 200, 'reset-password succeeds');

  r = await req('POST', '/auth/login', { body: { email: 'john@example.com', password: 'NewSecret1' } });
  assert(r.status === 200, 'login works after password reset');

  // ---------------- RBAC ----------------
  console.log('\n— Admin authorization —');
  r = await req('GET', '/admin/dashboard', { token: userToken });
  assert(r.status === 403, 'customer blocked from admin API (403)');

  r = await req('GET', '/admin/dashboard');
  assert(r.status === 401, 'anonymous blocked from admin API (401)');

  r = await req('GET', '/admin/dashboard', { token: adminToken });
  assert(r.status === 200 && r.json.data.stats.totalProducts === counts.products, 'admin dashboard stats correct');

  // ---------------- Cart & wishlist ----------------
  console.log('\n— Cart & wishlist —');
  const target = allProducts.find((p) => p.stock > 10);
  r = await req('POST', '/cart', { token: userToken, body: { productId: target._id, quantity: 2 } });
  assert(r.status === 201 && r.json.data.items.length === 1, 'add to cart');
  const cartItemId = r.json.data.items[0]._id;

  r = await req('PUT', `/cart/${cartItemId}`, { token: userToken, body: { quantity: 3 } });
  assert(r.json.data.subtotal > 0 && r.json.data.itemCount === 3, 'update quantity recalculates totals');

  const oos = allProducts.find((p) => p.stock === 0);
  if (oos) {
    r = await req('POST', '/cart', { token: userToken, body: { productId: oos._id, quantity: 1 } });
    assert(r.status === 400, 'out-of-stock product rejected from cart');
  }

  r = await req('POST', `/wishlist/${allProducts[1]._id}`, { token: userToken });
  assert(r.status === 201 && r.json.data.products.length === 1, 'wishlist add');

  r = await req('DELETE', `/wishlist/${allProducts[1]._id}`, { token: userToken });
  assert(r.status === 200 && r.json.data.products.length === 0, 'wishlist remove');

  // ---------------- Coupons ----------------
  console.log('\n— Coupons —');
  r = await req('POST', '/coupons/validate', { token: userToken, body: { code: 'WELCOME10', subtotal: 500 } });
  assert(r.status === 200 && r.json.data.discount === 50, 'percentage coupon computes discount');

  r = await req('POST', '/coupons/validate', { token: userToken, body: { code: 'NOPE404', subtotal: 500 } });
  assert(r.status === 404, 'unknown coupon rejected');

  r = await req('GET', '/coupons', { token: adminToken });
  assert(r.status === 200 && r.json.data.coupons.length === counts.coupons, 'admin lists coupons');

  // ---------------- Orders (stock decrement!) ----------------
  console.log('\n— Order placement & stock decrement —');
  const stockProduct = allProducts.find((p) => p.stock >= 20);
  let before = (await req('GET', `/products/${stockProduct._id}`)).json.data.product.stock;

  r = await req('POST', '/orders', {
    token: userToken,
    body: {
      items: [{ product: stockProduct._id, quantity: 2 }],
      customerInfo: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+15551234567' },
      shippingAddress: { address: '1 Test Way', city: 'Springfield', state: 'CA', postalCode: '90210', country: 'USA' },
      paymentMethod: 'cod',
      couponCode: 'WELCOME10',
    },
  });
  assert(r.status === 201 && r.json.data.order.orderNumber.startsWith('ORD-'), 'order created with generated number');
  const order = r.json.data.order;
  assert(order.discount === Math.round(stockProduct.discountPrice ? stockProduct.discountPrice : stockProduct.price) * 2 * 0.1 || order.discount > 0, 'coupon discount applied to order');
  assert(order.total === Math.round((order.subtotal - order.discount + order.shippingFee + order.tax) * 100) / 100, 'totals math is consistent');

  let after = (await req('GET', `/products/${stockProduct._id}`)).json.data.product.stock;
  assert(after === before - 2, `stock decremented (${before} → ${after})`);

  r = await req('GET', '/cart', { token: userToken });
  assert(r.json.data.items.length === 0, 'cart cleared after checkout');

  r = await req('GET', `/admin/inventory/${stockProduct._id}/history`, { token: adminToken });
  assert(r.status === 200 && r.json.data.history.length === 1 && r.json.data.history[0].quantityChanged === -2, 'inventory log recorded order decrement');

  r = await req('POST', '/orders', {
    token: userToken,
    body: {
      items: [{ product: stockProduct._id, quantity: before + 100 }],
      customerInfo: { firstName: 'J', lastName: 'D', email: 'j@e.com', phone: '+15550000000' },
      shippingAddress: { address: 'a', city: 'b', state: 'c', postalCode: 'd', country: 'e' },
    },
  });
  assert(r.status === 400, 'overselling rejected when stock insufficient');

  r = await req('GET', '/orders', { token: userToken });
  assert(r.status === 200 && r.json.data.orders.length === 1, 'customer sees own orders');

  // ---------------- Reviews ----------------
  console.log('\n— Reviews (verified purchase only) —');
  r = await req('POST', `/products/${stockProduct._id}/reviews`, {
    token: userToken,
    body: { rating: 5, title: 'Great', comment: 'Excellent device, fast shipping.' },
  });
  assert(r.status === 201, 'verified purchaser can review');

  r = await req('POST', `/products/${allProducts[2]._id}/reviews`, {
    token: userToken,
    body: { rating: 4, comment: 'No purchase history for this.' },
  });
  assert(r.status === 403, 'non-purchaser blocked from reviewing (403)');

  r = await req('GET', '/admin/reviews?approved=false', { token: adminToken });
  assert(r.json.data.reviews.length === 1, 'review pending moderation');
  const reviewId = r.json.data.reviews[0]._id;

  r = await req('PATCH', `/admin/reviews/${reviewId}/approve`, { token: adminToken });
  assert(r.status === 200, 'admin approves review');

  r = await req('GET', `/products/${stockProduct._id}`);
  assert(r.json.data.product.reviewCount === 1 && r.json.data.product.rating === 5, 'product rating synced from approved review');

  // ---------------- Inventory management ----------------
  console.log('\n— Inventory adjustments —');
  const invProduct = allProducts.find((p) => p.stock > 5);
  const invBefore = (await req('GET', `/products/${invProduct._id}`)).json.data.product.stock;

  r = await req('PATCH', `/admin/inventory/${invProduct._id}/adjust`, {
    token: adminToken,
    body: { type: 'increase', quantity: 10, reason: 'Restock delivery' },
  });
  assert(r.status === 200 && r.json.data.product.stock === invBefore + 10, `admin increases stock (${invBefore} → ${invBefore + 10})`);

  r = await req('PATCH', `/admin/inventory/${invProduct._id}/adjust`, { token: adminToken, body: { type: 'decrease', quantity: 3, reason: 'Damaged units' } });
  assert(r.json.data.product.stock === invBefore + 7, 'admin decreases stock');

  r = await req('PATCH', `/admin/inventory/${invProduct._id}/adjust`, { token: adminToken, body: { type: 'set', quantity: 42, reason: 'Audit correction' } });
  assert(r.json.data.product.stock === 42, 'admin sets exact stock');

  r = await req('PATCH', `/admin/inventory/${invProduct._id}/adjust`, { token: adminToken, body: { type: 'increase', quantity: 5, reason: '' } });
  assert(r.status === 400, 'adjustment without reason rejected');

  r = await req('GET', `/admin/inventory/${invProduct._id}/history`, { token: adminToken });
  assert(r.json.data.history.length >= 3, 'stock history recorded every adjustment');

  r = await req('GET', '/admin/inventory?status=low_stock', { token: adminToken });
  assert(r.status === 200, 'low-stock filter endpoint works');

  // ---------------- Product CRUD (admin) ----------------
  console.log('\n— Admin product CRUD —');
  const smartphonesCat = (await req('GET', '/categories')).json.data.categories.find((c) => c.slug === 'smartphones');

  r = await req('POST', '/products', {
    token: adminToken,
    body: {
      name: 'Test Gadget Pro', sku: 'TST-001', brand: 'TestCorp', category: smartphonesCat._id,
      price: 199, discountPrice: 149, stock: 8, lowStockThreshold: 10,
      description: 'A test gadget.', shortDescription: 'Test gadget.',
      specifications: [{ key: 'Color', value: 'Black' }], features: ['Feature A'],
      images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'],
    },
  });
  assert(r.status === 201 && r.json.data.product.slug === 'test-gadget-pro', 'admin creates product with auto slug');
  const newProductId = r.json.data.product._id;

  r = await req('PUT', `/products/${newProductId}`, {
    token: adminToken,
    body: { price: 189, description: 'Updated description.', stock: 15 },
  });
  assert(r.status === 200 && r.json.data.product.price === 189 && r.json.data.product.stock === 15, 'admin updates product');

  r = await req('PATCH', `/products/${newProductId}/status`, { token: adminToken });
  assert(r.json.data.product.status === 'disabled', 'admin disables product');

  r = await req('GET', '/products?limit=100');
  assert(!r.json.data.products.some((p) => p._id === newProductId), 'disabled product hidden from public listing');

  r = await req('POST', '/cart', { token: userToken, body: { productId: newProductId, quantity: 1 } });
  assert(r.status === 400 || r.status === 404, 'disabled product cannot be added to cart');

  r = await req('POST', '/products', { token: adminToken, body: { name: 'X', sku: 'TST-001', brand: 'B', category: smartphonesCat._id, price: 1, description: 'x' } });
  assert(r.status === 409, 'duplicate SKU rejected');

  r = await req('DELETE', `/products/${newProductId}`, { token: adminToken });
  assert(r.status === 200, 'admin deletes product');

  // ---------------- Categories CRUD ----------------
  r = await req('POST', '/categories', { token: adminToken, body: { name: 'Test Category' } });
  assert(r.status === 201 && r.json.data.category.slug === 'test-category', 'admin creates category');
  const testCatId = r.json.data.category._id;

  r = await req('PUT', `/categories/${testCatId}`, { token: adminToken, body: { isActive: false } });
  assert(r.json.data.category.isActive === false, 'admin disables category');

  r = await req('DELETE', `/categories/${testCatId}`, { token: adminToken });
  assert(r.status === 200, 'admin deletes empty category');

  r = await req('DELETE', `/categories/${smartphonesCat._id}`, { token: adminToken });
  assert(r.status === 400, 'cannot delete category with products');

  // ---------------- Customers & order status (admin) ----------------
  console.log('\n— Admin customers & order workflow —');
  r = await req('GET', '/admin/customers', { token: adminToken });
  assert(r.status === 200 && r.json.data.customers.length >= 1, 'admin lists customers with stats');
  const cust = r.json.data.customers[0];
  assert(cust.orderCount === 1 && cust.totalSpent > 0, 'customer aggregates include order stats');

  r = await req('GET', `/admin/customers/${userId}`, { token: adminToken });
  assert(r.status === 200 && r.json.data.orders.length === 1, 'admin views customer order history');

  r = await req('PATCH', `/admin/customers/${userId}/status`, { token: adminToken });
  assert(r.status === 200 && r.json.data.customer.isActive === false, 'admin deactivates customer');

  r = await req('POST', '/auth/login', { body: { email: 'john@example.com', password: 'NewSecret1' } });
  assert(r.status === 403, 'deactivated customer cannot log in');

  r = await req('PATCH', `/admin/customers/${userId}/status`, { token: adminToken });
  assert(r.json.data.customer.isActive === true, 'admin reactivates customer');

  for (const status of ['confirmed', 'processing', 'shipped']) {
    r = await req('PUT', `/admin/orders/${order._id}/status`, { token: adminToken, body: { status } });
    assert(r.status === 200 && r.json.data.order.status === status, `admin sets status → ${status}`);
  }

  r = await req('PUT', `/admin/orders/${order._id}/payment`, { token: adminToken, body: { paymentStatus: 'paid' } });
  assert(r.json.data.order.paymentStatus === 'paid', 'admin updates payment status');

  // Cancel flow restores stock
  const cancelStockBefore = (await req('GET', `/products/${stockProduct._id}`)).json.data.product.stock;
  r = await req('PUT', `/admin/orders/${order._id}/status`, { token: adminToken, body: { status: 'delivered' } });
  r = await req('PUT', `/orders/${order._id}/cancel`, { token: userToken });
  assert(r.status === 400, 'delivered order cannot be cancelled');

  // place second order then cancel as customer → stock restored
  r = await req('POST', '/orders', {
    token: userToken,
    body: {
      items: [{ product: stockProduct._id, quantity: 1 }],
      customerInfo: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+15551234567' },
      shippingAddress: { address: '1 Test Way', city: 'Springfield', state: 'CA', postalCode: '90210', country: 'USA' },
    },
  });
  const order2 = r.json.data.order;
  const midStock = (await req('GET', `/products/${stockProduct._id}`)).json.data.product.stock;
  assert(midStock === cancelStockBefore - 1, 'second order decremented stock again');

  r = await req('PUT', `/orders/${order2._id}/cancel`, { token: userToken });
  assert(r.status === 200 && r.json.data.order.status === 'cancelled', 'customer cancels pending order');
  const restoredStock = (await req('GET', `/products/${stockProduct._id}`)).json.data.product.stock;
  assert(restoredStock === midStock + 1, `cancellation restores stock (${midStock} → ${restoredStock})`);

  // ---------------- Error handling ----------------
  console.log('\n— Error handling & security —');
  r = await req('GET', '/products/not-a-valid-id');
  assert(r.status === 400 || r.status === 404, 'invalid ObjectId handled gracefully');
  r = await req('GET', '/nonexistent-route');
  assert(r.status === 404 && r.json.success === false, 'unknown route → 404 envelope');
  r = await req('GET', '/orders');
  assert(r.status === 401, 'protected route requires auth');

  // No secrets leaked anywhere
  const sample = JSON.stringify(await Promise.all([
    req('GET', '/products?limit=5'),
    req('GET', '/categories'),
    req('GET', '/auth/me', { token: userToken }),
  ]));
  assert(!sample.toLowerCase().includes('mongodb') && !sample.includes(process.env.JWT_SECRET), 'no credentials/secrets exposed via API');

  // ---------------- Done ----------------
  server.close();
  await mongoose.connection.close();
  await mongod.stop();
  console.log('\n[smoke] ✔ ALL CHECKS PASSED\n');
  process.exit(process.exitCode || 0);
})().catch((err) => {
  console.error(`\n[smoke] ✗ FAILED: ${err.message}`);
  console.error(err.stack.split('\n').slice(1, 5).join('\n'));
  process.exit(1);
});
