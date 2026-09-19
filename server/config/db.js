const mongoose = require('mongoose');

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('[db] Error: MONGODB_URI is not set in environment variables');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[db] MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
