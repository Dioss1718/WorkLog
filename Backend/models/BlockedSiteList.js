// Import the Mongoose library
const mongoose = require('mongoose');

// Define the schema for the BlockedSiteList
const BlockedSiteListSchema = new mongoose.Schema({
  // Reference to the User model, ensuring each user has only one list
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // The name of the User model
    required: true, // A user must be associated with the list
    unique: true // Guarantees that no two lists belong to the same user
  },
  // An array of strings to store the blocked website URLs
  sites: {
    type: [String],
    default: [] // The default value is an empty array
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
BlockedSiteListSchema.pre('save', function(next) {
  // Update the `updatedAt` field to the current date and time
  this.updatedAt = Date.now();
  // Call the next middleware function in the stack
  next();
});

// Export the Mongoose model, making it available for use elsewhere
module.exports = mongoose.model('BlockedSiteList', BlockedSiteListSchema);