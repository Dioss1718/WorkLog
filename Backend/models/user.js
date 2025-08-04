// Import the Mongoose and bcryptjs libraries
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the schema for a User
const UserSchema = new mongoose.Schema({
  // The user's username
  username: {
    type: String,
    required: true, // This field is required
    unique: true, // Usernames must be unique
    trim: true // Whitespace is trimmed from the start and end of the string
  },
  // The user's email address
  email: {
    type: String,
    required: true,
    unique: true, // Email addresses must be unique
    trim: true,
    lowercase: true, // Convert the email to lowercase
    match: [/.+@.+\..+/, 'Please fill a valid email address'] // Validate the email format
  },
  // The user's password
  password: {
    type: String,
    required: true
  },
  // An object to store user preferences
  preferences: {
    // How often the user wants to receive productivity reports
    reportFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'], // Must be one of these three values
      default: 'daily' // The default value is 'daily'
    },
    // Whether the user wants to receive notifications
    notificationsEnabled: {
      type: Boolean,
      default: true // The default value is 'true'
    }
  },
  // Timestamp for when the user was created
  createdAt: {
    type: Date,
    default: Date.now // Default to the current date and time
  }
});

// Middleware that runs before a user is saved
UserSchema.pre('save', async function (next) {
  // If the password hasn't been changed, move on to the next middleware
  if (!this.isModified('password')) {
    next();
  }
  // Generate a salt with a cost factor of 10
  const salt = await bcrypt.genSalt(10);
  // Hash the password using the generated salt
  this.password = await bcrypt.hash(this.password, salt);
  // Call the next middleware function
  next();
});

// Custom method to compare a provided password with the hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  // Use bcrypt to compare the plain text password with the hashed password
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the Mongoose model, making it available for use elsewhere
module.exports = mongoose.model('User', UserSchema);