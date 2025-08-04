// Import the Mongoose library
const mongoose = require('mongoose');

// Define the schema for the ProductivityData
const ProductivityDataSchema = new mongoose.Schema({
  // Reference to the User model
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // The name of the User model
    required: true // A user must be associated with this data
  },
  // The date for which the productivity data is being recorded
  date: {
    type: String, // Stored as a string for easy comparison (e.g., "2024-08-04")
    required: true
  },
  // A map to store the time spent on each website
  websiteTime: {
    type: Map, // Mongoose's Map type
    of: Number, // The values in the map will be numbers (e.g., time in seconds)
    default: {} // The default value is an empty object
  },
  // Timestamp for when the document was created
  createdAt: {
    type: Date,
    default: Date.now // Default to the current date and time
  },
  // Timestamp for when the document was last updated
  updatedAt: {
    type: Date,
    default: Date.now // Default to the current date and time
  }
});

// Middleware function that runs before a document is saved
ProductivityDataSchema.pre('save', function(next) {
  // Update the `updatedAt` field to the current date and time
  this.updatedAt = Date.now();
  // Call the next middleware function in the stack
  next();
});

// Export the Mongoose model, making it available for use elsewhere
module.exports = mongoose.model('ProductivityData', ProductivityDataSchema);