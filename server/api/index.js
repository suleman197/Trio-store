const connectDB = require('../config/db');

let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }

  const app = require('../app');
  return app(req, res);
};
