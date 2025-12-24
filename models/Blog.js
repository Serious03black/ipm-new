const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    imageUrl: { type: String }, // Cloudinary image
    paragraph1: { type: String, required: true },
    paragraph2: { type: String, required: true },
    quote: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Blog', blogSchema);