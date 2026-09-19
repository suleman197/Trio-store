const mongoose = require('mongoose');
const dns = require('dns');

// Fallback DNS servers (8.8.8.8) to prevent Windows ISP SRV lookup failures
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  /* ignore fallback failure if OS restricts */
}

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
