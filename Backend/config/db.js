const mongoose = require('mongoose');
// Load environment variables
require('dotenv').config();

const connectDB = async () => {
 try {
 // Attempt to connect to the MongoDB database using the URI from environment variables
 const conn = await mongoose.connect(process.env.MONGO_URI, {});
 console.log(`MongoDB Connected: ${conn.connection.host}`);
} catch (err) {
// If the connection fails, log the error and exit the process
 console.error(`Error: ${err.message}`);
 process.exit(1);
}
};

module.exports = connectDB;