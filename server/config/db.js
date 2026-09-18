const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://ahmadmahmoodworkingprojects_db_user:jzjiWrb3B9bWdWlL@electronicstore.pi142ql.mongodb.net/?appName=ElectronicStore';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[db] MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
