const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
    // Basic email validation (Mongoose has no built-in email validator, but match works well)
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
  },

  phone: {
    type: String,
    required: [true, "Phone is required"],
    trim: true,
    minlength: [10, "Phone must be exactly 10 digits"],
    maxlength: [10, "Phone must be exactly 10 digits"],
    match: [/^\d{10}$/, "Phone must contain only 10 digits (no spaces or dashes)"]
  },

  subject: {
    type: String,
    required: [true, "Subject/Service is required"],
    enum: [
      "Fashion Shoot",
      "Brand Campaign",
      "Product Photography",
      "Video Production",
      "Other"
    ],
    trim: true
  },

  budget: {  // renamed from "budjet" to correct spelling
    type: String,
    trim: true,
    default: null  // optional – will not be saved if empty
  },

  membership: {
    type: String,
    trim: true,
    default: null  // optional (e.g., "GAP Me" field)
  },

  website: {
    type: String,
    trim: true,
    default: null,  // optional
    // Optional URL validation – only checks if provided
    validate: {
      validator: function(v) {
        if (!v) return true;  // empty is allowed
        // Simple URL regex (allows http/https or just domain/instagram handle)
        return /^https?:\/\/[^\s/$.?#].[^\s]*$|^@[a-zA-Z0-9_]+$/.test(v) ||
               /^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)*$/.test(v);
      },
      message: "Please provide a valid website URL or Instagram link"
    }
  },

  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true
  },

  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
});

module.exports = mongoose.model("Contact", contactSchema);