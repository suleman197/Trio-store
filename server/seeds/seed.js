/**
 * CLI seeder — wipes the database and inserts admin, categories, products, coupons.
 * Run: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { seedAll } = require('./seedData');

(async () => {
  await connectDB();
  const counts = await seedAll();
  console.log(`\n[seed] ✔ Done! ${counts.categories} categories, ${counts.products} products, ${counts.coupons} coupons`);
  console.log('        Admin login → admin@example.com / Admin@123\n');
  await mongoose.connection.close();
  process.exit(0);
})().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
