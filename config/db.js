const mongoose = require('mongoose');
const dns = require('dns');

// On Windows or certain ISPs, local DNS resolvers often fail SRV records for mongodb+srv://
// Setting public DNS (Google / Cloudflare) helps resolve SRV records reliably.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Fall back to default DNS if setServers is not allowed
}

let isConnected = false;

const connectDB = async () => {
  mongoose.set('strictQuery', false);
  
  if (mongoose.connection.readyState >= 1) {
    // console.log('Using existing MongoDB connection.');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000 // Error out after 5s instead of 10s if IP is blocked
    });
    console.log('MongoDB Connected to cluster');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    if (err.message && err.message.includes('querySrv ENOTFOUND')) {
      console.error('\n--> Hint: querySrv ENOTFOUND means the MongoDB cluster hostname in MONGO_URI could not be found.');
      console.error('    1. Check your MongoDB Atlas cluster URL in .env (ensure the cluster exists, is unpaused, and the hostname is spelled correctly).');
      console.error('    2. If running locally, set MONGO_URI=mongodb://127.0.0.1:27017/acad_ai in your .env file.\n');
    }
    throw err; // Crucial for Vercel: throw to prevent silent failures that cause routing timeouts
  }
};

module.exports = connectDB;
